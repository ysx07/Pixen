import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { BatchItem } from '../stores/batch';

interface BatchQueueProps {
  items: BatchItem[];
  onRemove: (id: string) => void;
}

const STATUS_ICON: Record<BatchItem['status'], string> = {
  pending: '○',
  processing: '◐',
  completed: '●',
  error: '✕',
};

const STATUS_COLOR: Record<BatchItem['status'], string> = {
  pending: 'text-taupe-400',
  processing: 'text-sage-600',
  completed: 'text-sage-700',
  error: 'text-error',
};

export function BatchQueue({ items, onRemove }: BatchQueueProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 5,
  });

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-taupe-400">
        No images added yet.
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-full overflow-y-auto">
      <div
        style={{ height: virtualizer.getTotalSize() }}
        className="relative w-full"
      >
        {virtualizer.getVirtualItems().map((vItem) => {
          const item = items[vItem.index];
          return (
            <div
              key={item.id}
              data-index={vItem.index}
              ref={virtualizer.measureElement}
              style={{ transform: `translateY(${vItem.start}px)` }}
              className="absolute left-0 top-0 w-full border-b border-taupe-100 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className={`shrink-0 text-sm font-mono ${STATUS_COLOR[item.status]}`}>
                  {STATUS_ICON[item.status]}
                </span>
                <span
                  className="min-w-0 flex-1 truncate text-xs text-taupe-900"
                  title={item.file.name}
                >
                  {item.file.name}
                </span>
                {item.status === 'pending' && (
                  <button
                    onClick={() => onRemove(item.id)}
                    className="shrink-0 text-xs text-taupe-400 hover:text-error"
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                )}
              </div>

              {item.status === 'processing' && (
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-taupe-100">
                  <div
                    className="h-full rounded-full bg-sage-500 transition-all duration-150"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}

              {item.status === 'error' && item.error && (
                <p className="mt-0.5 truncate text-xs text-error" title={item.error}>
                  {item.error}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
