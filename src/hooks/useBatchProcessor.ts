import { useCallback, useRef, useState } from 'react';
import type { Operation } from '../stores/pipeline';
import { useBatchStore } from '../stores/batch';
import { runPipeline } from './useProcessingWorker';
import type { ZipEntry } from '../utils/zip-download';
import { FORMAT_EXT } from '../workers/protocol';

interface UseBatchProcessorOptions {
  keepOriginalNames: boolean;
}

export function useBatchProcessor({ keepOriginalNames }: UseBatchProcessorOptions) {
  const store = useBatchStore();
  const abortRef = useRef<AbortController | null>(null);
  const [outputs, setOutputs] = useState<ZipEntry[]>([]);

  const runBatch = useCallback(
    async (operations: Operation[], itemIds?: string[]) => {
      const { items, setItemStatus, setProcessing } = useBatchStore.getState();
      const targets = itemIds
        ? items.filter((it) => itemIds.includes(it.id))
        : items;

      abortRef.current = new AbortController();
      const { signal } = abortRef.current;

      setProcessing(true);
      const collected: ZipEntry[] = [];

      for (const item of targets) {
        if (signal.aborted) break;

        setItemStatus(item.id, 'processing', 0);

        try {
          const result = await runPipeline(item.file, operations, {
            signal,
            onProgress: (p) => {
              const pct = Math.round((p.step / p.totalSteps) * 100);
              useBatchStore.getState().setItemStatus(item.id, 'processing', pct);
            },
          });

          const ext = FORMAT_EXT[result.output.format];
          const outputName = keepOriginalNames
            ? replaceExtension(item.file.name, ext)
            : result.output.fileName;

          const outputFile = new File([result.output.buffer], outputName, {
            type: result.output.mimeType,
          });

          useBatchStore.getState().setOutputFile(item.id, outputFile);
          useBatchStore.getState().setItemStatus(item.id, 'completed', 100);
          collected.push({ fileName: outputName, buffer: result.output.buffer });
        } catch (err) {
          if ((err as DOMException).name === 'AbortError') {
            useBatchStore.getState().setItemStatus(item.id, 'pending', 0);
            break;
          }
          const msg = err instanceof Error ? err.message : String(err);
          useBatchStore.getState().setItemStatus(item.id, 'error', 0, msg);
        }
      }

      setProcessing(false);
      if (!signal.aborted) {
        setOutputs(collected);
      }
      return collected;
    },
    [keepOriginalNames],
  );

  const cancelBatch = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const completedOutputs = outputs;

  return { runBatch, cancelBatch, completedOutputs, isProcessing: store.isProcessing };
}

function replaceExtension(fileName: string, newExt: string): string {
  const dot = fileName.lastIndexOf('.');
  const base = dot >= 0 ? fileName.slice(0, dot) : fileName;
  return `${base}.${newExt}`;
}
