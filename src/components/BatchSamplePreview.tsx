import { useEffect, useRef } from 'react';

export interface SampleResult {
  fileName: string;
  beforeUrl: string;
  afterUrl: string | null;
  processing: boolean;
  error: string | null;
}

interface BatchSamplePreviewProps {
  samples: SampleResult[];
  onConfirm: () => void;
  onClose: () => void;
}

export function BatchSamplePreview({ samples, onConfirm, onClose }: BatchSamplePreviewProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const allDone = samples.every((s) => !s.processing);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-taupe-900/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-taupe-200 bg-cream shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Batch sample preview"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-taupe-200 bg-cream px-5 py-4">
          <div>
            <h2 className="font-serif text-lg text-taupe-900">Sample preview</h2>
            <p className="text-xs text-taupe-600">
              {samples.length} random {samples.length === 1 ? 'sample' : 'samples'} from your batch
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-taupe-400 hover:text-taupe-700"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-6">
            {samples.map((sample) => (
              <SampleRow key={sample.fileName} sample={sample} />
            ))}
          </div>
        </div>

        <footer className="flex justify-end gap-3 border-t border-taupe-200 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-taupe-300 px-4 py-2 text-sm text-taupe-700 hover:bg-taupe-100"
          >
            Back
          </button>
          <button
            onClick={onConfirm}
            disabled={!allDone}
            className="rounded-md bg-taupe-900 px-4 py-2 text-sm font-medium text-cream hover:bg-taupe-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Run full batch
          </button>
        </footer>
      </div>
    </div>
  );
}

function SampleRow({ sample }: { sample: SampleResult }) {
  return (
    <div>
      <p className="mb-2 truncate text-xs font-medium text-taupe-700" title={sample.fileName}>
        {sample.fileName}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1 text-xs text-taupe-500">Before</p>
          <img
            src={sample.beforeUrl}
            alt="before"
            className="h-40 w-full rounded border border-taupe-200 object-contain bg-taupe-50"
          />
        </div>
        <div>
          <p className="mb-1 text-xs text-taupe-500">After</p>
          {sample.processing && (
            <div className="flex h-40 items-center justify-center rounded border border-taupe-200 bg-taupe-50 text-xs text-taupe-400">
              Processing…
            </div>
          )}
          {sample.error && (
            <div className="flex h-40 items-center justify-center rounded border border-error/30 bg-error/10 text-xs text-error">
              {sample.error}
            </div>
          )}
          {!sample.processing && !sample.error && sample.afterUrl && (
            <img
              src={sample.afterUrl}
              alt="after"
              className="h-40 w-full rounded border border-taupe-200 object-contain bg-taupe-50"
            />
          )}
        </div>
      </div>
    </div>
  );
}
