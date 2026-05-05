/// <reference lib="webworker" />
/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */

/**
 * AI worker — runs ONNX inference for opt-in advanced models.
 *
 * Handles RMBG-1.4 (background removal, opt-in) and Real-ESRGAN
 * (upscaling). Sessions are kept warm across requests to avoid the
 * (multi-second) creation cost; weights live in this worker's heap so the
 * main thread and VIPS worker stay lean.
 */

import * as ort from 'onnxruntime-web';
import { fetchAndCacheModel } from '../utils/model-cache';
import type {
  AiWorkerRequest,
  AiWorkerResponse,
  AiProgressMessage,
  AiResultError,
  AiResultSuccess,
  RmbgRequest,
  UpscaleRequest,
} from './ai-protocol';

const ctx = self as unknown as DedicatedWorkerGlobalScope;

// Held sessions, keyed by model id. Lifetime = worker lifetime; freed on
// `cancel`-all signal or worker termination.
const sessions = new Map<string, ort.InferenceSession>();
let detectedBackend: 'webgpu' | 'wasm' = 'wasm';

function send(msg: AiWorkerResponse, transfers: Transferable[] = []) {
  ctx.postMessage(msg, transfers);
}

ctx.onmessage = async (event: MessageEvent<AiWorkerRequest>) => {
  const req = event.data;
  try {
    switch (req.type) {
      case 'init':
        await handleInit(req.id);
        break;
      case 'rmbg':
        await handleRmbg(req);
        break;
      case 'upscale':
        await handleUpscale(req);
        break;
      case 'cancel':
        // ORT WebAssembly does not support mid-run cancellation. We mark the
        // request as ignored at the result boundary in the main thread.
        break;
    }
  } catch (err) {
    const msg: AiResultError = {
      id: req.id,
      type: 'result',
      status: 'error',
      error: err instanceof Error ? err.message : String(err),
    };
    send(msg);
  }
};

async function handleInit(id: string): Promise<void> {
  // Probe WebGPU once, lazily. ORT picks providers per session, but we
  // surface support up-front for UI.
  const hasGpu = typeof (globalThis as any).navigator?.gpu !== 'undefined';
  detectedBackend = hasGpu ? 'webgpu' : 'wasm';

  // ort.env tweaks: avoid noisy logging, let ORT choose worker thread count.
  ort.env.logLevel = 'warning';

  send({ id, type: 'init', status: 'success', backend: detectedBackend });
}

function progress(id: string, partial: Omit<AiProgressMessage, 'id' | 'type'>) {
  send({ id, type: 'progress', ...partial });
}

async function getOrCreateSession(
  id: string,
  modelId: string,
  modelUrl: string,
  preferGpu: boolean,
): Promise<ort.InferenceSession> {
  const cacheKey = `${modelId}:${preferGpu ? 'gpu' : 'cpu'}`;
  const existing = sessions.get(cacheKey);
  if (existing) return existing;

  progress(id, { phase: 'fetching-model', loaded: 0, total: 0 });
  const buf = await fetchAndCacheModel(modelId, modelUrl, ({ loaded, total }) => {
    progress(id, { phase: 'fetching-model', loaded, total });
  });

  progress(id, { phase: 'creating-session' });
  const providers: string[] = [];
  if (preferGpu && detectedBackend === 'webgpu') providers.push('webgpu');
  providers.push('wasm');

  const session = await ort.InferenceSession.create(buf, {
    executionProviders: providers,
    graphOptimizationLevel: 'all',
  });
  sessions.set(cacheKey, session);
  return session;
}

// --- Background removal (RMBG-1.4) ----------------------------------------

async function handleRmbg(req: RmbgRequest): Promise<void> {
  const session = await getOrCreateSession(
    req.id,
    req.modelId,
    req.modelUrl,
    req.preferGpu,
  );

  const RES = 1024;
  const srcRgba = new Uint8Array(req.pixels);

  progress(req.id, { phase: 'running', label: 'Preparing input' });
  const inputCHW = rgbaToCHWFloat32(srcRgba, req.width, req.height, RES);
  const inputTensor = new ort.Tensor('float32', inputCHW, [1, 3, RES, RES]);

  progress(req.id, { phase: 'running', label: 'Inference' });
  const inputName = session.inputNames[0] ?? 'input';
  const outputName = session.outputNames[0] ?? 'output';
  const feeds: Record<string, ort.Tensor> = { [inputName]: inputTensor };
  const outputs = await session.run(feeds);
  const maskTensor = outputs[outputName];

  progress(req.id, { phase: 'finishing' });
  const maskF32 = maskTensor.data as Float32Array;
  // Output mask is [1,1,RES,RES] in [0,1] (sigmoid).
  const compositeRgba = applyMaskRgba(
    srcRgba,
    req.width,
    req.height,
    maskF32,
    RES,
  );

  // Free tensors. ORT manages internal heaps; explicit dispose is
  // documented for WebGPU buffers.
  inputTensor.dispose?.();
  for (const k of Object.keys(outputs)) outputs[k].dispose?.();

  const result: AiResultSuccess = {
    id: req.id,
    type: 'result',
    status: 'success',
    pixels: compositeRgba.buffer as ArrayBuffer,
    width: req.width,
    height: req.height,
    channels: 4,
  };
  send(result, [result.pixels]);
}

function rgbaToCHWFloat32(
  rgba: Uint8Array,
  srcW: number,
  srcH: number,
  dst: number,
): Float32Array {
  const out = new Float32Array(3 * dst * dst);
  // Bilinear resample to dst×dst, then split planes.
  const sxRatio = srcW / dst;
  const syRatio = srcH / dst;
  for (let y = 0; y < dst; y++) {
    const fy = (y + 0.5) * syRatio - 0.5;
    const y0 = Math.max(0, Math.floor(fy));
    const y1 = Math.min(srcH - 1, y0 + 1);
    const wy = fy - y0;
    for (let x = 0; x < dst; x++) {
      const fx = (x + 0.5) * sxRatio - 0.5;
      const x0 = Math.max(0, Math.floor(fx));
      const x1 = Math.min(srcW - 1, x0 + 1);
      const wx = fx - x0;

      const i00 = (y0 * srcW + x0) * 4;
      const i01 = (y0 * srcW + x1) * 4;
      const i10 = (y1 * srcW + x0) * 4;
      const i11 = (y1 * srcW + x1) * 4;

      for (let c = 0; c < 3; c++) {
        const p00 = rgba[i00 + c];
        const p01 = rgba[i01 + c];
        const p10 = rgba[i10 + c];
        const p11 = rgba[i11 + c];
        const top = p00 * (1 - wx) + p01 * wx;
        const bot = p10 * (1 - wx) + p11 * wx;
        const v = (top * (1 - wy) + bot * wy) / 255;
        out[c * dst * dst + y * dst + x] = v;
      }
    }
  }
  return out;
}

function applyMaskRgba(
  src: Uint8Array,
  w: number,
  h: number,
  mask: Float32Array,
  maskRes: number,
): Uint8Array {
  const out = new Uint8Array(w * h * 4);
  const xRatio = maskRes / w;
  const yRatio = maskRes / h;
  for (let y = 0; y < h; y++) {
    const my = Math.min(maskRes - 1, Math.floor(y * yRatio));
    for (let x = 0; x < w; x++) {
      const mx = Math.min(maskRes - 1, Math.floor(x * xRatio));
      const m = clamp01(mask[my * maskRes + mx]);
      const i = (y * w + x) * 4;
      out[i] = src[i];
      out[i + 1] = src[i + 1];
      out[i + 2] = src[i + 2];
      out[i + 3] = Math.round(m * 255);
    }
  }
  return out;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// --- Upscaling (Real-ESRGAN, tiled) ---------------------------------------

async function handleUpscale(req: UpscaleRequest): Promise<void> {
  const session = await getOrCreateSession(
    req.id,
    req.modelId,
    req.modelUrl,
    req.preferGpu,
  );

  const TILE = 256;
  const OVERLAP = 32;
  const NATIVE_SCALE = 4; // realesr-general-x4v3 emits 4x natively
  const targetScale = req.scale;

  const src = new Uint8Array(req.pixels);
  const w = req.width;
  const h = req.height;
  const outW = w * NATIVE_SCALE;
  const outH = h * NATIVE_SCALE;
  const outRgba = new Uint8Array(outW * outH * 4);

  const stride = TILE - OVERLAP;
  const cols = Math.max(1, Math.ceil((w - OVERLAP) / stride));
  const rows = Math.max(1, Math.ceil((h - OVERLAP) / stride));
  const totalTiles = cols * rows;

  const inputName = session.inputNames[0] ?? 'input';
  const outputName = session.outputNames[0] ?? 'output';

  let tileIdx = 0;
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      const sx = Math.min(w - TILE, tx * stride);
      const sy = Math.min(h - TILE, ty * stride);
      const sxClamped = Math.max(0, sx);
      const syClamped = Math.max(0, sy);
      const tileW = Math.min(TILE, w - sxClamped);
      const tileH = Math.min(TILE, h - syClamped);

      progress(req.id, {
        phase: 'tiling',
        step: tileIdx + 1,
        totalSteps: totalTiles,
        label: `Upscale tile ${tileIdx + 1}/${totalTiles}`,
      });

      const tileChw = rgbaTileToCHWFloat32(
        src,
        w,
        h,
        sxClamped,
        syClamped,
        tileW,
        tileH,
        TILE,
      );
      const inputTensor = new ort.Tensor('float32', tileChw, [1, 3, TILE, TILE]);
      const outputs = await session.run({ [inputName]: inputTensor });
      const upTensor = outputs[outputName];
      const upData = upTensor.data as Float32Array;
      const upRes = TILE * NATIVE_SCALE;

      stitchTile(
        outRgba,
        outW,
        outH,
        upData,
        upRes,
        sxClamped * NATIVE_SCALE,
        syClamped * NATIVE_SCALE,
        tileW * NATIVE_SCALE,
        tileH * NATIVE_SCALE,
        OVERLAP * NATIVE_SCALE,
      );

      inputTensor.dispose?.();
      for (const k of Object.keys(outputs)) outputs[k].dispose?.();

      // Yield to the event loop so progress messages flush.
      await new Promise((r) => setTimeout(r, 0));
      tileIdx++;
    }
  }

  progress(req.id, { phase: 'finishing' });

  // If user requested 2x, downsample 4x → 2x by half-area average.
  let finalPixels: Uint8Array;
  let finalW: number;
  let finalH: number;
  if (targetScale === NATIVE_SCALE) {
    finalPixels = outRgba;
    finalW = outW;
    finalH = outH;
  } else {
    finalW = w * targetScale;
    finalH = h * targetScale;
    finalPixels = downsampleBox(outRgba, outW, outH, finalW, finalH);
  }

  const result: AiResultSuccess = {
    id: req.id,
    type: 'result',
    status: 'success',
    pixels: finalPixels.buffer as ArrayBuffer,
    width: finalW,
    height: finalH,
    channels: 4,
  };
  send(result, [result.pixels]);
}

function rgbaTileToCHWFloat32(
  rgba: Uint8Array,
  srcW: number,
  srcH: number,
  ox: number,
  oy: number,
  tileW: number,
  tileH: number,
  pad: number,
): Float32Array {
  const out = new Float32Array(3 * pad * pad);
  for (let y = 0; y < pad; y++) {
    const sy = clampInt(oy + y, 0, srcH - 1);
    for (let x = 0; x < pad; x++) {
      const sx = clampInt(ox + x, 0, srcW - 1);
      const i = (sy * srcW + sx) * 4;
      out[0 * pad * pad + y * pad + x] = rgba[i] / 255;
      out[1 * pad * pad + y * pad + x] = rgba[i + 1] / 255;
      out[2 * pad * pad + y * pad + x] = rgba[i + 2] / 255;
    }
    void tileW;
    void tileH;
  }
  return out;
}

function stitchTile(
  dst: Uint8Array,
  dstW: number,
  dstH: number,
  tileChw: Float32Array,
  tilePad: number,
  dstX: number,
  dstY: number,
  tileW: number,
  tileH: number,
  overlap: number,
): void {
  for (let y = 0; y < tileH; y++) {
    const wy = featherWeight(y, tileH, overlap);
    for (let x = 0; x < tileW; x++) {
      const wx = featherWeight(x, tileW, overlap);
      const w = Math.min(wx, wy);
      const sIdx = y * tilePad + x;
      const r = clamp01(tileChw[0 * tilePad * tilePad + sIdx]) * 255;
      const g = clamp01(tileChw[1 * tilePad * tilePad + sIdx]) * 255;
      const b = clamp01(tileChw[2 * tilePad * tilePad + sIdx]) * 255;
      const px = dstX + x;
      const py = dstY + y;
      if (px < 0 || py < 0 || px >= dstW || py >= dstH) continue;
      const di = (py * dstW + px) * 4;
      const existingA = dst[di + 3];
      if (existingA === 0) {
        dst[di] = r;
        dst[di + 1] = g;
        dst[di + 2] = b;
        dst[di + 3] = Math.round(w * 255);
      } else {
        // Alpha-weighted blend with previously-written feather.
        const wExisting = existingA / 255;
        const total = wExisting + w;
        if (total > 0) {
          dst[di] = Math.round((dst[di] * wExisting + r * w) / total);
          dst[di + 1] = Math.round((dst[di + 1] * wExisting + g * w) / total);
          dst[di + 2] = Math.round((dst[di + 2] * wExisting + b * w) / total);
          dst[di + 3] = Math.round(Math.min(1, total) * 255);
        }
      }
    }
  }
}

function featherWeight(coord: number, length: number, overlap: number): number {
  if (overlap <= 0) return 1;
  const fade = Math.min(overlap, Math.floor(length / 2));
  if (fade <= 0) return 1;
  if (coord < fade) return (coord + 1) / fade;
  if (coord >= length - fade) return (length - coord) / fade;
  return 1;
}

function downsampleBox(
  src: Uint8Array,
  sw: number,
  sh: number,
  dw: number,
  dh: number,
): Uint8Array {
  const out = new Uint8Array(dw * dh * 4);
  const xRatio = sw / dw;
  const yRatio = sh / dh;
  for (let y = 0; y < dh; y++) {
    const y0 = Math.floor(y * yRatio);
    const y1 = Math.min(sh, Math.floor((y + 1) * yRatio));
    for (let x = 0; x < dw; x++) {
      const x0 = Math.floor(x * xRatio);
      const x1 = Math.min(sw, Math.floor((x + 1) * xRatio));
      let r = 0,
        g = 0,
        b = 0,
        a = 0,
        n = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * sw + xx) * 4;
          r += src[i];
          g += src[i + 1];
          b += src[i + 2];
          a += src[i + 3];
          n++;
        }
      }
      const di = (y * dw + x) * 4;
      out[di] = n ? Math.round(r / n) : 0;
      out[di + 1] = n ? Math.round(g / n) : 0;
      out[di + 2] = n ? Math.round(b / n) : 0;
      out[di + 3] = n ? Math.round(a / n) : 255;
    }
  }
  return out;
}

function clampInt(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
