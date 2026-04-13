/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
/**
 * wasm-vips initialization helper. Runs inside the processing worker.
 *
 * See docs/SPEC.md §5.2. SharedArrayBuffer is required for the threaded
 * build; we detect and fall back to single-threaded if cross-origin
 * isolation is not available.
 *
 * Main-thread code must NOT import this module directly — dispatch work
 * to the worker via useProcessingWorker instead.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VipsModule = any;

let vipsPromise: Promise<VipsModule> | null = null;
let threading = false;

export function isCrossOriginIsolated(): boolean {
  return typeof SharedArrayBuffer !== 'undefined';
}

export async function getVips(): Promise<VipsModule> {
  if (!vipsPromise) {
    threading = isCrossOriginIsolated();
    vipsPromise = loadVips();
  }
  return vipsPromise;
}

export function isThreaded(): boolean {
  return threading;
}

async function loadVips(): Promise<VipsModule> {
  // Dynamic import so the ~5MB wasm bundle is only pulled inside the worker.
  const mod = await import('wasm-vips');
  const factory = (mod as { default?: unknown }).default ?? mod;

  // Resolve the .wasm asset through Vite so the dev server serves it with the
  // correct MIME type (otherwise Emscripten gets index.html back from the SPA
  // fallback and fails with a WebAssembly compile error).
  const wasmUrl = (await import('wasm-vips/vips.wasm?url')).default;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vips = await (factory as any)({
    locateFile: (path: string) => {
      if (path.endsWith('.wasm')) return wasmUrl;
      return path;
    },
    dynamicLibraries: [] as string[],
  });
  return vips;
}
