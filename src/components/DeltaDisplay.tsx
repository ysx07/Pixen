import type { OutputFormat } from '../workers/protocol';

interface DeltaDisplayProps {
  inputBytes: number;
  inputWidth: number;
  inputHeight: number;
  inputFormat: string;
  output?: {
    byteLength: number;
    width: number;
    height: number;
    format: OutputFormat;
    quality?: number;
    totalMs: number;
  } | null;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function DeltaDisplay({
  inputBytes,
  inputWidth,
  inputHeight,
  inputFormat,
  output,
}: DeltaDisplayProps) {
  if (!output) {
    return (
      <div className="rounded-md border border-taupe-200 bg-taupe-50 p-3 text-xs text-taupe-700">
        <div className="font-medium text-taupe-900">Input</div>
        <div className="mt-1 font-mono">
          {inputWidth}×{inputHeight} · {inputFormat.toUpperCase()} · {formatBytes(inputBytes)}
        </div>
      </div>
    );
  }

  const bytePct = (output.byteLength / inputBytes - 1) * 100;
  const byteColor = bytePct < 0 ? 'text-success' : 'text-warning';
  const formatChanged = inputFormat.toLowerCase() !== output.format;
  const dimsChanged = inputWidth !== output.width || inputHeight !== output.height;

  return (
    <div className="rounded-md border border-taupe-200 bg-taupe-50 p-3 text-xs text-taupe-700">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="font-medium text-taupe-900">Before</div>
          <div className="mt-1 font-mono">
            {inputWidth}×{inputHeight}
          </div>
          <div className="font-mono">{inputFormat.toUpperCase()}</div>
          <div className="font-mono">{formatBytes(inputBytes)}</div>
        </div>
        <div>
          <div className="font-medium text-taupe-900">After</div>
          <div className={`mt-1 font-mono ${dimsChanged ? 'text-info' : ''}`}>
            {output.width}×{output.height}
          </div>
          <div className={`font-mono ${formatChanged ? 'text-info' : ''}`}>
            {output.format.toUpperCase()}
            {output.quality != null && (
              <span className="text-taupe-500"> · q{output.quality}</span>
            )}
          </div>
          <div className={`font-mono ${byteColor}`}>
            {formatBytes(output.byteLength)}{' '}
            <span className="text-taupe-500">
              ({bytePct >= 0 ? '+' : ''}
              {bytePct.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>
      <div className="mt-2 text-[11px] text-taupe-500">
        Processed in {output.totalMs.toFixed(0)} ms
      </div>
    </div>
  );
}
