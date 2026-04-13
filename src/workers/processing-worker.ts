/**
 * Processing worker for wasm-vips operations
 *
 * Runs image processing off the main thread to keep UI responsive.
 */

import { initializeWasmVips } from '../utils/wasm-vips';

export interface ProcessingTask {
  id: string;
  type: 'init' | 'process';
  data?: unknown;
}

export interface ProcessingResult {
  id: string;
  status: 'success' | 'error';
  data?: unknown;
  error?: string;
}

// Initialize wasm-vips when worker starts
initializeWasmVips()
  .then(() => {
    console.log('[processing-worker] wasm-vips initialized');
    self.postMessage({
      id: 'init',
      status: 'success',
      data: { ready: true },
    } as ProcessingResult);
  })
  .catch((error) => {
    console.error('[processing-worker] Initialization failed:', error);
    self.postMessage({
      id: 'init',
      status: 'error',
      error: 'Failed to initialize processing worker',
    } as ProcessingResult);
  });

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<ProcessingTask>) => {
  const { id, type, data } = event.data;

  try {
    switch (type) {
      case 'init':
        // Already initialized above
        self.postMessage({
          id,
          status: 'success',
          data: { ready: true },
        } as ProcessingResult);
        break;

      case 'process':
        // TODO: Implement actual processing operations
        // For now, just echo back
        self.postMessage({
          id,
          status: 'success',
          data,
        } as ProcessingResult);
        break;

      default:
        self.postMessage({
          id,
          status: 'error',
          error: `Unknown task type: ${String(type)}`,
        } as ProcessingResult);
    }
  } catch (error) {
    self.postMessage({
      id,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ProcessingResult);
  }
};
