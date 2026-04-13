import { useEffect, useMemo, useRef, useState } from 'react';
import { DropZone } from './components/DropZone';
import { PipelineBuilder } from './components/PipelineBuilder';
import { Preview } from './components/Preview';
import { DeltaDisplay } from './components/DeltaDisplay';
import { usePipelineStore } from './stores/pipeline';
import {
  runPipeline,
  useProcessingWorker,
} from './hooks/useProcessingWorker';
import type { PipelineSuccess } from './workers/protocol';

interface InputState {
  file: File;
  url: string;
  width: number;
  height: number;
}

interface OutputState {
  url: string;
  output: PipelineSuccess['output'];
  totalMs: number;
}

const PREVIEW_DEBOUNCE_MS = 200;

export default function App() {
  const { ready, error: workerError, threading } = useProcessingWorker();
  const { operations } = usePipelineStore();

  const [input, setInput] = useState<InputState | null>(null);
  const [output, setOutput] = useState<OutputState | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progressLabel, setProgressLabel] = useState<string>('');
  const [runError, setRunError] = useState<string | null>(null);
  const runSeq = useRef(0);

  const inputFormat = useMemo(() => {
    if (!input) return '';
    const ext = input.file.name.toLowerCase().split('.').pop() ?? '';
    return ext || 'image';
  }, [input]);

  // Load an input file, probe dimensions via Image, create object URL.
  const handleFile = (file: File) => {
    if (input) URL.revokeObjectURL(input.url);
    if (output) URL.revokeObjectURL(output.url);
    setOutput(null);
    setRunError(null);
    const url = URL.createObjectURL(file);
    const probe = new Image();
    probe.onload = () => {
      setInput({ file, url, width: probe.naturalWidth, height: probe.naturalHeight });
    };
    probe.onerror = () => {
      setRunError('Could not decode image — file may be corrupted or unsupported.');
      URL.revokeObjectURL(url);
    };
    probe.src = url;
  };

  // Debounced auto-run on pipeline or input change.
  // Note: do NOT depend on `output` — we mutate it inside and would loop forever.
  useEffect(() => {
    if (!ready || !input) return;
    if (operations.length === 0) {
      setOutput((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return null;
      });
      return;
    }
    const mySeq = ++runSeq.current;
    const run = async () => {
      setProcessing(true);
      setRunError(null);
      try {
        const result = await runPipeline(input.file, operations, {
          onProgress: (p) => {
            if (mySeq === runSeq.current) {
              setProgressLabel(`${p.label} (${p.step}/${p.totalSteps})`);
            }
          },
        });
        if (mySeq !== runSeq.current) return;
        const blob = new Blob([result.output.buffer], { type: result.output.mimeType });
        const url = URL.createObjectURL(blob);
        setOutput((prev) => {
          if (prev) URL.revokeObjectURL(prev.url);
          return { url, output: result.output, totalMs: result.totalMs };
        });
      } catch (err) {
        if (mySeq !== runSeq.current) return;
        setRunError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mySeq === runSeq.current) {
          setProcessing(false);
          setProgressLabel('');
        }
      }
    };
    const timer = setTimeout(() => {
      void run();
    }, PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // output is intentionally excluded to avoid a re-run feedback loop.
  }, [ready, input, operations]);

  const handleDownload = () => {
    if (!output) return;
    const a = document.createElement('a');
    a.href = output.url;
    a.download = output.output.fileName;
    a.click();
  };

  return (
    <div className="flex h-full flex-col bg-cream text-taupe-900">
      <header className="flex items-center justify-between border-b border-taupe-200 px-6 py-3">
        <div>
          <h1 className="font-serif text-2xl leading-tight">Pixen</h1>
          <p className="text-xs text-taupe-600">
            Client-side image processing — nothing leaves your browser
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {!ready && !workerError && (
            <span className="text-taupe-500">Initializing wasm-vips…</span>
          )}
          {ready && (
            <span className="text-taupe-600">
              wasm-vips ready · {threading ? 'threaded' : 'single-thread'}
            </span>
          )}
          {workerError && (
            <span className="text-error">Worker error: {workerError}</span>
          )}
        </div>
      </header>

      <main className="grid flex-1 grid-cols-12 gap-4 overflow-hidden p-4">
        <section className="col-span-3 flex flex-col gap-4 overflow-hidden">
          {!input ? (
            <DropZone onFile={handleFile} />
          ) : (
            <>
              <div className="rounded-md border border-taupe-200 bg-taupe-50 p-3 text-xs">
                <div className="truncate font-medium text-taupe-900" title={input.file.name}>
                  {input.file.name}
                </div>
                <button
                  onClick={() => {
                    URL.revokeObjectURL(input.url);
                    if (output) URL.revokeObjectURL(output.url);
                    setInput(null);
                    setOutput(null);
                  }}
                  className="mt-1 text-taupe-600 underline hover:text-taupe-900"
                >
                  Replace image
                </button>
              </div>
              <DeltaDisplay
                inputBytes={input.file.size}
                inputWidth={input.width}
                inputHeight={input.height}
                inputFormat={inputFormat}
                output={
                  output
                    ? {
                        byteLength: output.output.byteLength,
                        width: output.output.width,
                        height: output.output.height,
                        format: output.output.format,
                        quality: output.output.quality,
                        totalMs: output.totalMs,
                      }
                    : null
                }
              />
              <button
                onClick={handleDownload}
                disabled={!output || processing}
                className="rounded-md bg-taupe-900 px-3 py-2 text-sm font-medium text-cream hover:bg-taupe-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Download result
              </button>
              {runError && (
                <div className="rounded-md border border-error/30 bg-error/10 p-2 text-xs text-error">
                  {runError}
                </div>
              )}
            </>
          )}
        </section>

        <section className="col-span-4 overflow-hidden rounded-md border border-taupe-200 bg-cream p-4">
          <PipelineBuilder />
        </section>

        <section className="col-span-5 overflow-hidden rounded-md border border-taupe-200 bg-cream p-4">
          {input ? (
            <Preview
              beforeUrl={input.url}
              afterUrl={output?.url ?? null}
              processing={processing}
              progressLabel={progressLabel}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-taupe-500">
              Drop an image to begin.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
