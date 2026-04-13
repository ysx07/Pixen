import { useEffect, useRef, useState } from 'react';

interface PreviewProps {
  beforeUrl: string;
  afterUrl: string | null;
  processing: boolean;
  progressLabel?: string;
}

export function Preview({ beforeUrl, afterUrl, processing, progressLabel }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dividerPct, setDividerPct] = useState(50);
  const dragging = useRef(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setDividerPct(Math.max(0, Math.min(100, pct)));
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-taupe-200 pb-2">
        <h3 className="font-serif text-xl text-taupe-900">Preview</h3>
        <div className="text-xs text-taupe-600">
          {processing ? (progressLabel ?? 'Processing…') : afterUrl ? 'Drag the divider' : 'Before only'}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative mt-3 flex-1 select-none overflow-hidden rounded-md border border-taupe-200 bg-taupe-950"
        style={{
          backgroundImage:
            'repeating-conic-gradient(#3A3A36 0% 25%, #4D4A45 0% 50%)',
          backgroundSize: '16px 16px',
        }}
      >
        {afterUrl ? (
          <>
            {/* Before: clipped to left of divider */}
            <div
              className="absolute inset-0 h-full w-full"
              style={{ clipPath: `inset(0 ${100 - dividerPct}% 0 0)` }}
            >
              <img
                src={beforeUrl}
                alt="before"
                className="absolute inset-0 h-full w-full object-contain"
              />
            </div>
            {/* After: clipped to right of divider */}
            <div
              className="absolute inset-0 h-full w-full"
              style={{ clipPath: `inset(0 0 0 ${dividerPct}%)` }}
            >
              <img
                src={afterUrl}
                alt="after"
                className="absolute inset-0 h-full w-full object-contain"
              />
            </div>
            <div
              className="absolute inset-y-0 z-10 w-8 cursor-ew-resize"
              style={{ left: `${dividerPct}%`, transform: 'translateX(-50%)' }}
              onMouseDown={() => (dragging.current = true)}
            >
              <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-cream shadow-[0_0_4px_rgba(0,0,0,0.5)]" />
              <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cream bg-taupe-900/80 text-center leading-7 text-cream shadow-[0_0_6px_rgba(0,0,0,0.5)]">
                ⇆
              </div>
            </div>
            <div className="absolute left-2 top-2 z-10 rounded bg-taupe-950/70 px-2 py-0.5 text-xs text-cream">
              Before
            </div>
            <div className="absolute right-2 top-2 z-10 rounded bg-taupe-950/70 px-2 py-0.5 text-xs text-cream">
              After
            </div>
          </>
        ) : (
          <img
            src={beforeUrl}
            alt="before"
            className="absolute inset-0 h-full w-full object-contain"
          />
        )}

        {processing && (
          <div className="absolute inset-0 flex items-center justify-center bg-taupe-950/50">
            <div className="rounded-md bg-cream px-4 py-2 font-mono text-sm text-taupe-900">
              {progressLabel ?? 'Processing…'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
