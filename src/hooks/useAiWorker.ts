/**
 * Main-thread interface to the AI worker.
 *
 * Singleton worker; sessions persist across calls so the model is paid for
 * once. Exposes promise-based wrappers for RMBG-1.4 background removal and
 * Real-ESRGAN upscaling, plus a hook for components to observe init state.
 */

import { useEffect, useRef, useState } from 'react';
import type {
  AiProgressMessage,
  AiWorkerResponse,
  RmbgRequest,
  UpscaleRequest,
} from '../workers/ai-protocol';
import { DEFAULT_MODEL_REGISTRY } from '../utils/model-registry';

let workerInstance: Worker | null = null;
let workerReady: Promise<{ backend: 'webgpu' | 'wasm' }> | null = null;

function getWorker(): Worker {
  if (workerInstance) return workerInstance;
  workerInstance = new Worker(
    new URL('../workers/ai-worker.ts', import.meta.url),
    { type: 'module' },
  );
  workerReady = new Promise((resolve, reject) => {
    const onInit = (event: MessageEvent<AiWorkerResponse>) => {
      const msg = event.data;
      if (msg.type === 'init' && msg.id === 'init') {
        workerInstance?.removeEventListener('message', onInit);
        if (msg.status === 'success') {
          resolve({ backend: msg.backend ?? 'wasm' });
        } else {
          reject(new Error(msg.error ?? 'AI worker init failed'));
        }
      }
    };
    workerInstance?.addEventListener('message', onInit);
    workerInstance?.postMessage({ id: 'init', type: 'init' });
  });
  return workerInstance;
}

export interface AiRunOptions {
  signal?: AbortSignal;
  onProgress?: (p: AiProgressMessage) => void;
}

export interface AiPixelResult {
  pixels: ArrayBuffer;
  width: number;
  height: number;
}

function dispatch<T extends { id: string }>(
  request: T,
  transfers: Transferable[],
  options: AiRunOptions,
): Promise<AiPixelResult> {
  const worker = getWorker();
  return new Promise<AiPixelResult>((resolve, reject) => {
    const cleanup = () => {
      worker.removeEventListener('message', onMessage);
      options.signal?.removeEventListener('abort', onAbort);
    };
    const onAbort = () => {
      cleanup();
      reject(new DOMException('aborted', 'AbortError'));
    };
    const onMessage = (event: MessageEvent<AiWorkerResponse>) => {
      const msg = event.data;
      if (msg.id !== request.id) return;
      if (msg.type === 'progress') {
        options.onProgress?.(msg);
        return;
      }
      if (msg.type === 'result') {
        cleanup();
        if (msg.status === 'success') {
          resolve({ pixels: msg.pixels, width: msg.width, height: msg.height });
        } else {
          reject(new Error(msg.error));
        }
      }
    };
    worker.addEventListener('message', onMessage);
    options.signal?.addEventListener('abort', onAbort);
    worker.postMessage(request, transfers);
  });
}

export interface RmbgInput {
  pixels: ArrayBuffer;
  width: number;
  height: number;
  preferGpu: boolean;
}

export async function rmbgRemoveBackground(
  input: RmbgInput,
  options: AiRunOptions = {},
): Promise<AiPixelResult> {
  if (workerReady) await workerReady;
  const desc = DEFAULT_MODEL_REGISTRY['rmbg-1.4-fp16'];
  const id = `rmbg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const req: RmbgRequest = {
    id,
    type: 'rmbg',
    pixels: input.pixels,
    width: input.width,
    height: input.height,
    modelId: desc.id,
    modelUrl: desc.url,
    preferGpu: input.preferGpu,
  };
  return dispatch(req, [req.pixels], options);
}

export interface UpscaleInput {
  pixels: ArrayBuffer;
  width: number;
  height: number;
  scale: 2 | 4;
  preferGpu: boolean;
}

export async function aiUpscale(
  input: UpscaleInput,
  options: AiRunOptions = {},
): Promise<AiPixelResult> {
  if (workerReady) await workerReady;
  const desc = DEFAULT_MODEL_REGISTRY['realesr-general-x4v3'];
  const id = `upscale-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const req: UpscaleRequest = {
    id,
    type: 'upscale',
    pixels: input.pixels,
    width: input.width,
    height: input.height,
    scale: input.scale,
    modelId: desc.id,
    modelUrl: desc.url,
    preferGpu: input.preferGpu,
  };
  return dispatch(req, [req.pixels], options);
}

export function useAiWorker() {
  const [ready, setReady] = useState(false);
  const [backend, setBackend] = useState<'webgpu' | 'wasm' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inited = useRef(false);

  useEffect(() => {
    if (inited.current) return;
    inited.current = true;
    getWorker();
    if (workerReady) {
      workerReady
        .then(({ backend: b }) => {
          setBackend(b);
          setReady(true);
        })
        .catch((err: Error) => setError(err.message));
    }
  }, []);

  return { ready, backend, error };
}
