import { useEffect, useRef, useState } from 'react';
import type { Operation } from '../stores/pipeline';
import type {
  PipelineSuccess,
  ProgressMessage,
  WorkerResponse,
} from '../workers/protocol';

export interface RunOptions {
  onProgress?: (p: ProgressMessage) => void;
  signal?: AbortSignal;
}

let workerInstance: Worker | null = null;
let workerReady: Promise<void> | null = null;
let threadingSupported = false;

function getWorker(): Worker {
  if (workerInstance) return workerInstance;
  workerInstance = new Worker(
    new URL('../workers/processing-worker.ts', import.meta.url),
    { type: 'module' },
  );
  workerReady = new Promise((resolve, reject) => {
    const onInit = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      if (msg.type === 'init' && msg.id === 'init') {
        workerInstance?.removeEventListener('message', onInit);
        if (msg.status === 'success') {
          threadingSupported = !!msg.threading;
          resolve();
        } else {
          reject(new Error(msg.error ?? 'worker init failed'));
        }
      }
    };
    workerInstance?.addEventListener('message', onInit);
  });
  return workerInstance;
}

export interface ProcessingRunResult {
  success: true;
  output: PipelineSuccess['output'];
  totalMs: number;
}

export async function runPipeline(
  file: File,
  operations: Operation[],
  options: RunOptions = {},
): Promise<ProcessingRunResult> {
  const worker = getWorker();
  if (workerReady) await workerReady;

  const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const fileBuffer = await file.arrayBuffer();

  return new Promise((resolve, reject) => {
    const abort = () => {
      worker.removeEventListener('message', onMessage);
      reject(new DOMException('aborted', 'AbortError'));
    };

    const onMessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      if (msg.id !== id) return;
      if (msg.type === 'progress') {
        options.onProgress?.(msg);
        return;
      }
      if (msg.type === 'result') {
        worker.removeEventListener('message', onMessage);
        options.signal?.removeEventListener('abort', abort);
        if (msg.status === 'success') {
          resolve({ success: true, output: msg.output, totalMs: msg.timings.totalMs });
        } else {
          reject(new Error(msg.error));
        }
      }
    };

    worker.addEventListener('message', onMessage);
    options.signal?.addEventListener('abort', abort);

    worker.postMessage(
      {
        id,
        type: 'runPipeline',
        fileBuffer,
        fileName: file.name,
        operations,
      },
      [fileBuffer],
    );
  });
}

export function useProcessingWorker() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threading, setThreading] = useState(false);
  const inited = useRef(false);

  useEffect(() => {
    if (inited.current) return;
    inited.current = true;
    getWorker();
    if (workerReady) {
      workerReady
        .then(() => {
          setReady(true);
          setThreading(threadingSupported);
        })
        .catch((err: Error) => {
          setError(err.message);
        });
    }
  }, []);

  return { ready, error, threading };
}
