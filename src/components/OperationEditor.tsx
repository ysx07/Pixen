import type { Operation } from '../stores/pipeline';

interface OperationEditorProps {
  operation: Operation;
  onChange: (op: Operation) => void;
}

export function OperationEditor({ operation, onChange }: OperationEditorProps) {
  switch (operation.type) {
    case 'resize':
      return (
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs">
            <span className="text-taupe-700">Width</span>
            <input
              type="number"
              className="mt-0.5 w-full"
              value={operation.width}
              min={1}
              onChange={(e) =>
                onChange({ ...operation, width: Number(e.currentTarget.value) || 1 })
              }
            />
          </label>
          <label className="text-xs">
            <span className="text-taupe-700">Height</span>
            <input
              type="number"
              className="mt-0.5 w-full"
              value={operation.height}
              min={1}
              onChange={(e) =>
                onChange({ ...operation, height: Number(e.currentTarget.value) || 1 })
              }
            />
          </label>
          <label className="col-span-2 text-xs">
            <span className="text-taupe-700">Mode</span>
            <select
              className="mt-0.5 w-full"
              value={operation.mode}
              onChange={(e) =>
                onChange({
                  ...operation,
                  mode: e.currentTarget.value as typeof operation.mode,
                })
              }
            >
              <option value="contain">Contain (fit within)</option>
              <option value="cover">Cover (fill, crop)</option>
              <option value="fill">Fill (distort)</option>
              <option value="inside">Inside (shrink only)</option>
              <option value="outside">Outside (grow only)</option>
              <option value="max">Max (same as contain)</option>
            </select>
          </label>
        </div>
      );

    case 'pad':
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
              <label key={side} className="text-xs">
                <span className="capitalize text-taupe-700">{side}</span>
                <input
                  type="number"
                  className="mt-0.5 w-full"
                  value={operation[side]}
                  min={0}
                  onChange={(e) =>
                    onChange({
                      ...operation,
                      [side]: Number(e.currentTarget.value) || 0,
                    })
                  }
                />
              </label>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs">
              <span className="text-taupe-700">Fill mode</span>
              <select
                className="mt-0.5 w-full"
                value={operation.fillMode}
                onChange={(e) =>
                  onChange({
                    ...operation,
                    fillMode: e.currentTarget.value as typeof operation.fillMode,
                  })
                }
              >
                <option value="color">Solid color</option>
                <option value="extend">Extend edges</option>
                <option value="mirror">Mirror</option>
              </select>
            </label>
            {operation.fillMode === 'color' && (
              <label className="text-xs">
                <span className="text-taupe-700">Color</span>
                <input
                  type="color"
                  className="mt-0.5 h-9 w-full cursor-pointer p-1"
                  value={operation.color ?? '#ffffff'}
                  onChange={(e) =>
                    onChange({ ...operation, color: e.currentTarget.value })
                  }
                />
              </label>
            )}
          </div>
        </div>
      );

    case 'convert':
      return (
        <label className="block text-xs">
          <span className="text-taupe-700">Format</span>
          <select
            className="mt-0.5 w-full"
            value={operation.format}
            onChange={(e) =>
              onChange({
                ...operation,
                format: e.currentTarget.value as typeof operation.format,
              })
            }
          >
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
            <option value="avif">AVIF</option>
          </select>
        </label>
      );

    case 'compress':
      return (
        <div className="space-y-2">
          <label className="block text-xs">
            <span className="text-taupe-700">
              Quality: <span className="font-mono">{operation.quality}</span>
            </span>
            <input
              type="range"
              min={1}
              max={100}
              className="mt-1 w-full"
              value={operation.quality}
              onChange={(e) =>
                onChange({ ...operation, quality: Number(e.currentTarget.value) })
              }
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-taupe-700">
            <input
              type="checkbox"
              checked={operation.perceptual}
              onChange={(e) =>
                onChange({ ...operation, perceptual: e.currentTarget.checked })
              }
            />
            Perceptual mode (SSIM-guided)
          </label>
        </div>
      );

    case 'stripMetadata':
      return (
        <p className="text-xs text-taupe-600">Removes EXIF and ICC data on encode.</p>
      );

    case 'rename':
      return (
        <label className="block text-xs">
          <span className="text-taupe-700">
            Pattern (tokens: <code>{'{name}'}</code>, <code>{'{date}'}</code>)
          </span>
          <input
            type="text"
            className="mt-0.5 w-full"
            value={operation.pattern}
            placeholder="{name}-processed"
            onChange={(e) =>
              onChange({ ...operation, pattern: e.currentTarget.value })
            }
          />
        </label>
      );

    case 'background-removal':
    case 'upscale':
      return (
        <p className="text-xs text-warning">
          Available in Phase 5 — this operation will be skipped.
        </p>
      );
  }
}
