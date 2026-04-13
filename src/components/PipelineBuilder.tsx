import { useState } from 'react';
import { usePipelineStore, type Operation } from '../stores/pipeline';
import { OperationEditor } from './OperationEditor';

const OPERATION_LABELS: Record<Operation['type'], string> = {
  resize: 'Resize',
  pad: 'Pad',
  convert: 'Convert Format',
  compress: 'Compress',
  stripMetadata: 'Strip Metadata',
  rename: 'Rename',
  'background-removal': 'Remove Background (P5)',
  upscale: 'Upscale (P5)',
};

function defaultOperation(type: Operation['type']): Operation {
  switch (type) {
    case 'resize':
      return { type: 'resize', width: 1920, height: 1080, mode: 'contain' };
    case 'pad':
      return {
        type: 'pad',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        fillMode: 'color',
        color: '#ffffff',
      };
    case 'convert':
      return { type: 'convert', format: 'webp' };
    case 'compress':
      return { type: 'compress', quality: 82, perceptual: false };
    case 'stripMetadata':
      return { type: 'stripMetadata' };
    case 'rename':
      return { type: 'rename', pattern: '{name}-processed' };
    case 'background-removal':
      return { type: 'background-removal' };
    case 'upscale':
      return { type: 'upscale', scale: 2 };
  }
}

export function PipelineBuilder() {
  const { operations, addOperation, removeOperation, updateOperation, moveOperation, clearPipeline } =
    usePipelineStore();
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-taupe-200 pb-2">
        <h3 className="font-serif text-xl text-taupe-900">Pipeline</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setAdding((v) => !v)}
            className="rounded-md bg-sage-700 px-3 py-1 text-xs font-medium text-cream hover:bg-sage-800"
          >
            + Add operation
          </button>
          {operations.length > 0 && (
            <button
              onClick={clearPipeline}
              className="rounded-md border border-taupe-300 px-3 py-1 text-xs text-taupe-700 hover:bg-taupe-100"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {adding && (
        <div className="mt-2 grid grid-cols-2 gap-1 rounded-md border border-taupe-200 bg-taupe-50 p-2">
          {(Object.keys(OPERATION_LABELS) as Operation['type'][]).map((t) => (
            <button
              key={t}
              onClick={() => {
                addOperation(defaultOperation(t));
                setAdding(false);
              }}
              className="rounded px-2 py-1 text-left text-xs text-taupe-800 hover:bg-cream"
            >
              {OPERATION_LABELS[t]}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
        {operations.length === 0 && (
          <p className="mt-4 text-center text-sm text-taupe-500">
            No operations. Add one to get started.
          </p>
        )}
        {operations.map((op, idx) => (
          <div
            key={idx}
            className="rounded-md border border-taupe-200 bg-cream p-3 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-taupe-900">
                {idx + 1}. {OPERATION_LABELS[op.type]}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={idx === 0}
                  onClick={() => moveOperation(idx, idx - 1)}
                  className="rounded px-1 text-taupe-600 hover:bg-taupe-100 disabled:opacity-30"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  disabled={idx === operations.length - 1}
                  onClick={() => moveOperation(idx, idx + 1)}
                  className="rounded px-1 text-taupe-600 hover:bg-taupe-100 disabled:opacity-30"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={() => removeOperation(idx)}
                  className="rounded px-1 text-error hover:bg-taupe-100"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
            <OperationEditor
              operation={op}
              onChange={(updated) => updateOperation(idx, updated)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
