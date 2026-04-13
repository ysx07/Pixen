/// <reference lib="webworker" />
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
/**
 * Processing worker — runs the full pipeline off the main thread.
 *
 * Receives a source file buffer + ordered operations, returns the encoded
 * output buffer + metadata. Geometry operations (resize, pad) run in order;
 * convert/compress/stripMetadata/rename set output-stage options that are
 * applied in the final encode step.
 */

import type { Operation } from '../stores/pipeline';
import { getVips, isThreaded } from '../utils/wasm-vips';
import { ssimLuma } from '../utils/ssim';
import {
  FORMAT_EXT,
  FORMAT_MIME,
  detectFormatFromName,
  type OutputFormat,
  type PipelineError,
  type PipelineSuccess,
  type ProgressMessage,
  type InitResponse,
  type WorkerRequest,
} from './protocol';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VipsImage = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VipsModule = any;

const ctx = self as unknown as DedicatedWorkerGlobalScope;

getVips()
  .then(() => {
    const msg: InitResponse = {
      id: 'init',
      type: 'init',
      status: 'success',
      threading: isThreaded(),
    };
    ctx.postMessage(msg);
  })
  .catch((err) => {
    const msg: InitResponse = {
      id: 'init',
      type: 'init',
      status: 'error',
      error: err instanceof Error ? err.message : 'wasm-vips init failed',
    };
    ctx.postMessage(msg);
  });

ctx.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  if (req.type === 'init') {
    try {
      await getVips();
      const msg: InitResponse = {
        id: req.id,
        type: 'init',
        status: 'success',
        threading: isThreaded(),
      };
      ctx.postMessage(msg);
    } catch (err) {
      const msg: InitResponse = {
        id: req.id,
        type: 'init',
        status: 'error',
        error: err instanceof Error ? err.message : 'init failed',
      };
      ctx.postMessage(msg);
    }
    return;
  }

  if (req.type === 'runPipeline') {
    try {
      const result = await runPipeline(req.id, req.fileBuffer, req.fileName, req.operations);
      ctx.postMessage(result, [result.output.buffer]);
    } catch (err) {
      const msg: PipelineError = {
        id: req.id,
        type: 'result',
        status: 'error',
        error: err instanceof Error ? err.message : 'pipeline failed',
      };
      ctx.postMessage(msg);
    }
  }
};

interface OutputConfig {
  format: OutputFormat;
  quality: number;
  perceptual: boolean;
  strip: boolean;
  renamePattern?: string;
}

async function runPipeline(
  id: string,
  fileBuffer: ArrayBuffer,
  fileName: string,
  operations: Operation[],
): Promise<PipelineSuccess> {
  const t0 = performance.now();
  const vips: VipsModule = await getVips();

  const totalSteps = operations.length + 1;
  let step = 0;
  const progress = (label: string) => {
    step += 1;
    const msg: ProgressMessage = {
      id,
      type: 'progress',
      step,
      totalSteps,
      label,
    };
    ctx.postMessage(msg);
  };

  const output: OutputConfig = {
    format: detectFormatFromName(fileName),
    quality: 82,
    perceptual: false,
    strip: false,
  };

  // Track every intermediate Vips.Image so we can free them deterministically.
  // wasm-vips keeps images on the Emscripten heap; without .delete() we leak
  // tens of MB per run and will hit "out of memory" within a few runs.
  const disposables: VipsImage[] = [];
  const track = (i: VipsImage): VipsImage => {
    disposables.push(i);
    return i;
  };

  let img: VipsImage = track(vips.Image.newFromBuffer(new Uint8Array(fileBuffer)));

  for (const op of operations) {
    switch (op.type) {
      case 'resize':
        progress(`Resize → ${op.width}×${op.height} (${op.mode})`);
        img = track(applyResize(vips, img, op.width, op.height, op.mode));
        break;
      case 'pad':
        progress('Pad');
        img = track(applyPad(img, op));
        break;
      case 'convert':
        progress(`Convert → ${op.format.toUpperCase()}`);
        output.format = op.format;
        break;
      case 'compress':
        progress(
          `Compress (q=${op.quality}${op.perceptual ? ', perceptual' : ''})`,
        );
        output.quality = clamp(op.quality, 1, 100);
        output.perceptual = op.perceptual;
        break;
      case 'stripMetadata':
        progress('Strip metadata');
        output.strip = true;
        break;
      case 'rename':
        progress('Rename');
        output.renamePattern = op.pattern;
        break;
      case 'background-removal':
      case 'upscale':
        // Phase 5 operations — no-op in Phase 1.
        progress(`Skip ${op.type} (Phase 5)`);
        break;
    }
  }

  progress('Encode');

  try {
    // PNG ignores quality; handle perceptual search only for lossy codecs.
    const lossy = output.format !== 'png';
    let finalQuality = output.quality;
    let encoded: Uint8Array;

    if (lossy && output.perceptual) {
      const searched = await perceptualSearch(vips, img, output);
      encoded = searched.buffer;
      finalQuality = searched.quality;
    } else {
      encoded = encode(img, output, output.quality);
    }

    const width = img.width as number;
    const height = img.height as number;

    // Detach from the underlying Emscripten heap so the ArrayBuffer is transferable.
    const buffer = encoded.slice().buffer;

    const outName = buildOutputName(fileName, output);

    const result: PipelineSuccess = {
      id,
      type: 'result',
      status: 'success',
      output: {
        buffer,
        fileName: outName,
        mimeType: FORMAT_MIME[output.format],
        width,
        height,
        byteLength: buffer.byteLength,
        format: output.format,
        quality: lossy ? finalQuality : undefined,
      },
      timings: { totalMs: performance.now() - t0 },
    };
    return result;
  } finally {
    for (const d of disposables) {
      try {
        d.delete();
      } catch {
        // Already deleted — ignore.
      }
    }
  }
}

// --- Operations ------------------------------------------------------------

function applyResize(
  vips: VipsModule,
  img: VipsImage,
  targetW: number,
  targetH: number,
  mode: 'cover' | 'contain' | 'fill' | 'inside' | 'outside' | 'max',
): VipsImage {
  const w = img.width as number;
  const h = img.height as number;
  const sx = targetW / w;
  const sy = targetH / h;

  if (mode === 'fill') {
    return img.resize(sx, { vscale: sy });
  }

  let scale: number;
  switch (mode) {
    case 'cover':
      scale = Math.max(sx, sy);
      break;
    case 'outside':
      scale = Math.max(sx, sy, 1);
      break;
    case 'inside':
      scale = Math.min(sx, sy, 1);
      break;
    case 'contain':
    case 'max':
    default:
      scale = Math.min(sx, sy);
      break;
  }

  let resized = img.resize(scale);

  if (mode === 'cover') {
    // Center-crop to exact target dimensions.
    const rw = resized.width as number;
    const rh = resized.height as number;
    const left = Math.max(0, Math.floor((rw - targetW) / 2));
    const top = Math.max(0, Math.floor((rh - targetH) / 2));
    const cropW = Math.min(targetW, rw - left);
    const cropH = Math.min(targetH, rh - top);
    resized = resized.extractArea(left, top, cropW, cropH);
  }

  void vips;
  return resized;
}

function applyPad(
  img: VipsImage,
  op: Extract<Operation, { type: 'pad' }>,
): VipsImage {
  const w = img.width as number;
  const h = img.height as number;
  const bands = img.bands as number;
  const outW = w + op.left + op.right;
  const outH = h + op.top + op.bottom;

  const extendMap: Record<typeof op.fillMode, string> = {
    color: 'background',
    extend: 'copy',
    mirror: 'mirror',
  };

  const options: Record<string, unknown> = { extend: extendMap[op.fillMode] };
  if (op.fillMode === 'color' && op.color) {
    options.background = backgroundForBands(op.color, bands);
  }

  return img.embed(op.left, op.top, outW, outH, options);
}

function backgroundForBands(hex: string, bands: number): number[] {
  const [r, g, b] = hexToRgb(hex);
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  switch (bands) {
    case 1:
      return [luma];
    case 2:
      return [luma, 255];
    case 3:
      return [r, g, b];
    case 4:
      return [r, g, b, 255];
    default:
      // Fall back to grey for unusual band counts (e.g. CMYK).
      return Array(bands).fill(luma) as number[];
  }
}

// --- Encoding --------------------------------------------------------------

function encode(img: VipsImage, cfg: OutputConfig, quality: number): Uint8Array {
  const ext = `.${FORMAT_EXT[cfg.format]}`;
  const params: string[] = [];
  if (cfg.format !== 'png') params.push(`Q=${Math.round(quality)}`);
  if (cfg.strip) params.push('strip=true');
  const spec = params.length ? `${ext}[${params.join(',')}]` : ext;
  return img.writeToBuffer(spec) as Uint8Array;
}

async function perceptualSearch(
  vips: VipsModule,
  img: VipsImage,
  cfg: OutputConfig,
): Promise<{ buffer: Uint8Array; quality: number }> {
  const SSIM_TARGET = 0.95;
  const refLuma = getLuma(img);
  const w = img.width as number;
  const h = img.height as number;

  // Start high, decrement by 5 until SSIM dips below threshold.
  const startQ = Math.min(95, cfg.quality);
  let bestBuf = encode(img, cfg, startQ);
  let bestQ = startQ;

  for (let q = startQ - 5; q >= 40; q -= 5) {
    const buf = encode(img, cfg, q);
    const candidate = decodeLumaFromBuffer(vips, buf, w, h);
    if (!candidate) {
      break;
    }
    const s = ssimLuma(refLuma, candidate, w, h);
    if (s >= SSIM_TARGET) {
      bestBuf = buf;
      bestQ = q;
    } else {
      break;
    }
  }

  return { buffer: bestBuf, quality: bestQ };
}

function getLuma(img: VipsImage): Uint8Array {
  const bw = img.colourspace('b-w');
  try {
    const w = bw.width as number;
    const h = bw.height as number;
    const bands = bw.bands as number;
    const mem = bw.writeToMemory() as Uint8Array;
    if (bands === 1 && mem.length === w * h) {
      // Copy off the Emscripten heap so the result survives bw.delete().
      return new Uint8Array(mem);
    }
    const out = new Uint8Array(w * h);
    for (let i = 0; i < out.length; i++) out[i] = mem[i * bands];
    return out;
  } finally {
    try {
      bw.delete();
    } catch {
      // ignore
    }
  }
}

function decodeLumaFromBuffer(
  vips: VipsModule,
  buf: Uint8Array,
  expectW: number,
  expectH: number,
): Uint8Array | null {
  let img: VipsImage = null;
  try {
    img = vips.Image.newFromBuffer(buf);
    const w = img.width as number;
    const h = img.height as number;
    if (w !== expectW || h !== expectH) return null;
    return getLuma(img);
  } catch {
    return null;
  } finally {
    if (img) {
      try {
        img.delete();
      } catch {
        // ignore
      }
    }
  }
}

// --- Helpers ---------------------------------------------------------------

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(hex);
  if (!m) return [0, 0, 0];
  const raw = m[1];
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function buildOutputName(inputName: string, cfg: OutputConfig): string {
  const dot = inputName.lastIndexOf('.');
  const stem = dot > 0 ? inputName.slice(0, dot) : inputName;
  const ext = FORMAT_EXT[cfg.format];
  const baseStem = cfg.renamePattern
    ? applyRenamePattern(cfg.renamePattern, stem)
    : stem;
  return `${baseStem}.${ext}`;
}

function applyRenamePattern(pattern: string, originalStem: string): string {
  // Supported tokens: {name} = original stem; {date} = YYYY-MM-DD.
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  return pattern.replace(/\{name\}/g, originalStem).replace(/\{date\}/g, date);
}
