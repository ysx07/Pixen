import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DropZone } from './components/DropZone';
import { PipelineBuilder } from './components/PipelineBuilder';
import { Preview } from './components/Preview';
import { DeltaDisplay } from './components/DeltaDisplay';
import { BatchQueue } from './components/BatchQueue';
import { BatchControls } from './components/BatchControls';
import { BatchSamplePreview } from './components/BatchSamplePreview';
import { OrganizePreview } from './components/OrganizePreview';
import type { SampleResult } from './components/BatchSamplePreview';
import { usePipelineStore } from './stores/pipeline';
import { useBatchStore } from './stores/batch';
import { useOrganizeStore } from './stores/organize';
import { useRecipesStore } from './stores/recipes';
import { runPipeline, useProcessingWorker } from './hooks/useProcessingWorker';
import { useBatchProcessor } from './hooks/useBatchProcessor';
import type { PipelineSuccess } from './workers/protocol';
import { organize, toGroupedZipEntries } from './utils/organize';
import type { GroupedItems } from './utils/organize';
import type { GroupedZipEntries } from './utils/zip-download';

// ── Single-image state ────────────────────────────────────────────────────────

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
const SAMPLE_COUNT = 3;

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const { ready, error: workerError, threading } = useProcessingWorker();
  const { operations } = usePipelineStore();
  const batchStore = useBatchStore();

  // Mode
  const [mode, setMode] = useState<'single' | 'batch'>('single');

  // Single-image state
  const [input, setInput] = useState<InputState | null>(null);
  const [output, setOutput] = useState<OutputState | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progressLabel, setProgressLabel] = useState('');
  const [runError, setRunError] = useState<string | null>(null);
  const runSeq = useRef(0);

  // Batch state
  const [keepOriginalNames, setKeepOriginalNames] = useState(true);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [samples, setSamples] = useState<SampleResult[]>([]);
  const sampleUrlsRef = useRef<string[]>([]);

  const { runBatch, cancelBatch, completedOutputs, isProcessing } = useBatchProcessor({
    keepOriginalNames,
  });

  // Organize state
  const organizeConfig = useOrganizeStore((s) => s.config);
  const [organizeGroups, setOrganizeGroups] = useState<GroupedItems | null>(null);
  const [organizeZipEntries, setOrganizeZipEntries] = useState<GroupedZipEntries | null>(null);
  const [isOrganizing, setIsOrganizing] = useState(false);

  const inputFormat = useMemo(() => {
    if (!input) return '';
    const ext = input.file.name.toLowerCase().split('.').pop() ?? '';
    return ext || 'image';
  }, [input]);

  // ── URL recipe loading ──────────────────────────────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('recipe');
    if (!encoded) return;
    try {
      const json = decodeURIComponent(atob(encoded));
      const { recipe, errors } = useRecipesStore.getState().importRecipe(json);
      if (recipe) {
        useRecipesStore.getState().loadRecipeIntoPipeline(recipe.id);
        const url = new URL(window.location.href);
        url.searchParams.delete('recipe');
        window.history.replaceState({}, '', url.toString());
      } else {
        console.warn('URL recipe failed validation:', errors);
      }
    } catch {
      // malformed base64 — silently ignore
    }
  }, []);

  // ── File input handler ──────────────────────────────────────────────────────

  const handleFiles = useCallback(
    (files: File[]) => {
      if (files.length === 1) {
        // Single-image mode
        setMode('single');
        batchStore.clearBatch();
        const file = files[0];
        if (input) URL.revokeObjectURL(input.url);
        if (output) URL.revokeObjectURL(output.url);
        setOutput(null);
        setRunError(null);
        const url = URL.createObjectURL(file);
        const probe = new Image();
        probe.onload = () =>
          setInput({ file, url, width: probe.naturalWidth, height: probe.naturalHeight });
        probe.onerror = () => {
          setRunError('Could not decode image — file may be corrupted or unsupported.');
          URL.revokeObjectURL(url);
        };
        probe.src = url;
      } else {
        // Batch mode
        setMode('batch');
        if (input) {
          URL.revokeObjectURL(input.url);
          setInput(null);
        }
        if (output) {
          URL.revokeObjectURL(output.url);
          setOutput(null);
        }
        batchStore.clearBatch();
        batchStore.addFiles(files);
      }
    },
    // Intentionally exclude input/output to avoid stale closure; we read them via setInput callback
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ── Single-image debounced auto-run ────────────────────────────────────────

  useEffect(() => {
    if (mode !== 'single') return;
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
            if (mySeq === runSeq.current)
              setProgressLabel(`${p.label} (${p.step}/${p.totalSteps})`);
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
    const timer = setTimeout(() => void run(), PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // output intentionally excluded — would cause feedback loop
  }, [ready, input, operations, mode]);

  // ── Single-image download ──────────────────────────────────────────────────

  const handleDownload = () => {
    if (!output) return;
    const a = document.createElement('a');
    a.href = output.url;
    a.download = output.output.fileName;
    a.click();
  };

  // ── Batch: open sample preview modal ──────────────────────────────────────

  const handlePreviewSamples = useCallback(async () => {
    const { items, generatePreviewIndices } = useBatchStore.getState();
    if (items.length === 0 || operations.length === 0) return;

    generatePreviewIndices(SAMPLE_COUNT);
    const { previewIndices } = useBatchStore.getState();
    const sampleItems = previewIndices.map((i) => items[i]);

    // Revoke previous sample URLs
    sampleUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    sampleUrlsRef.current = [];

    const initial: SampleResult[] = sampleItems.map((item) => {
      const url = URL.createObjectURL(item.file);
      sampleUrlsRef.current.push(url);
      return { fileName: item.file.name, beforeUrl: url, afterUrl: null, processing: true, error: null };
    });
    setSamples(initial);
    setShowSampleModal(true);

    // Run pipeline on samples concurrently (they're small previews, fine to overlap)
    await Promise.all(
      sampleItems.map(async (item, idx) => {
        try {
          const result = await runPipeline(item.file, operations);
          const blob = new Blob([result.output.buffer], { type: result.output.mimeType });
          const afterUrl = URL.createObjectURL(blob);
          sampleUrlsRef.current.push(afterUrl);
          setSamples((prev) =>
            prev.map((s, i) => (i === idx ? { ...s, afterUrl, processing: false } : s)),
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          setSamples((prev) =>
            prev.map((s, i) => (i === idx ? { ...s, processing: false, error: msg } : s)),
          );
        }
      }),
    );
  }, [operations]);

  const handleSampleClose = useCallback(() => {
    setShowSampleModal(false);
  }, []);

  const handleRunFullBatch = useCallback(async () => {
    setShowSampleModal(false);
    await runBatch(operations);
  }, [operations, runBatch]);

  // ── Counts for BatchControls ──────────────────────────────────────────────

  const completedCount = batchStore.items.filter((i) => i.status === 'completed').length;
  const errorCount = batchStore.items.filter((i) => i.status === 'error').length;

  // ── Organize step (runs after batch completes) ────────────────────────────

  useEffect(() => {
    const completedItems = batchStore.items.filter(
      (it) => it.status === 'completed' && it.outputFile,
    );
    if (isProcessing || completedItems.length === 0 || organizeConfig.mode === 'none') {
      setOrganizeGroups(null);
      setOrganizeZipEntries(null);
      return;
    }

    let cancelled = false;
    setIsOrganizing(true);

    void organize(completedItems, organizeConfig).then(async (groups) => {
      if (cancelled) return;
      setOrganizeGroups(groups);
      const zipEntries = await toGroupedZipEntries(groups);
      if (!cancelled) {
        setOrganizeZipEntries(zipEntries);
        setIsOrganizing(false);
      }
    });

    return () => { cancelled = true; };
  // completedCount as a stable proxy for "batch items changed"
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProcessing, organizeConfig, completedCount]);

  // ── Batch: reset to drop zone ──────────────────────────────────────────────

  const handleResetBatch = () => {
    cancelBatch();
    batchStore.clearBatch();
    setMode('single');
    setSamples([]);
    setOrganizeGroups(null);
    setOrganizeZipEntries(null);
    sampleUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    sampleUrlsRef.current = [];
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col bg-cream text-taupe-900">
      {/* Header */}
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

      {/* Main */}
      <main className="grid flex-1 grid-cols-12 gap-4 overflow-hidden p-4">

        {/* Left pane — drop zone / file info / batch info */}
        <section className="col-span-3 flex flex-col gap-4 overflow-hidden">
          {mode === 'single' && !input && (
            <DropZone onFiles={handleFiles} />
          )}

          {mode === 'single' && input && (
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

          {mode === 'batch' && (
            <>
              <div className="rounded-md border border-taupe-200 bg-taupe-50 p-3 text-xs">
                <div className="font-medium text-taupe-900">
                  {batchStore.items.length} image{batchStore.items.length !== 1 ? 's' : ''} queued
                </div>
                <button
                  onClick={handleResetBatch}
                  className="mt-1 text-taupe-600 underline hover:text-taupe-900"
                >
                  Clear & start over
                </button>
              </div>
              <DropZone onFiles={handleFiles} />
              {(organizeGroups || isOrganizing) && (
                <OrganizePreview groups={organizeGroups} isComputing={isOrganizing} />
              )}
              <BatchControls
                totalCount={batchStore.items.length}
                completedCount={completedCount}
                errorCount={errorCount}
                isProcessing={isProcessing}
                canRun={ready && operations.length > 0 && batchStore.items.length > 0}
                keepOriginalNames={keepOriginalNames}
                onKeepNamesChange={setKeepOriginalNames}
                onPreviewSamples={() => void handlePreviewSamples()}
                onCancel={cancelBatch}
                outputs={completedOutputs}
                organizeGroups={organizeZipEntries}
              />
            </>
          )}
        </section>

        {/* Middle pane — pipeline builder */}
        <section className="col-span-4 overflow-hidden rounded-md border border-taupe-200 bg-cream p-4">
          <PipelineBuilder showOrganize={mode === 'batch'} />
        </section>

        {/* Right pane — preview (single) or batch queue (batch) */}
        <section className="col-span-5 overflow-hidden rounded-md border border-taupe-200 bg-cream p-4">
          {mode === 'single' && input && (
            <Preview
              beforeUrl={input.url}
              afterUrl={output?.url ?? null}
              processing={processing}
              progressLabel={progressLabel}
            />
          )}
          {mode === 'single' && !input && (
            <div className="flex h-full items-center justify-center text-sm text-taupe-500">
              Drop an image to begin.
            </div>
          )}
          {mode === 'batch' && (
            <BatchQueue
              items={batchStore.items}
              onRemove={(id) => batchStore.removeItem(id)}
            />
          )}
        </section>
      </main>

      {/* Batch sample preview modal */}
      {showSampleModal && (
        <BatchSamplePreview
          samples={samples}
          onConfirm={() => void handleRunFullBatch()}
          onClose={handleSampleClose}
        />
      )}
    </div>
  );
}
