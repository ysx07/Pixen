import type { ZipEntry, GroupedZipEntries } from '../utils/zip-download';
import { downloadZip, downloadGroupedZip } from '../utils/zip-download';
import { isFsAccessSupported, saveToFolder, saveGroupedToFolder } from '../utils/fs-access';

interface BatchControlsProps {
  totalCount: number;
  completedCount: number;
  errorCount: number;
  isProcessing: boolean;
  canRun: boolean;
  keepOriginalNames: boolean;
  onKeepNamesChange: (v: boolean) => void;
  onPreviewSamples: () => void;
  onCancel: () => void;
  outputs: ZipEntry[];
  organizeGroups?: GroupedZipEntries | null;
}

export function BatchControls({
  totalCount,
  completedCount,
  errorCount,
  isProcessing,
  canRun,
  keepOriginalNames,
  onKeepNamesChange,
  onPreviewSamples,
  onCancel,
  outputs,
  organizeGroups,
}: BatchControlsProps) {
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isDone = !isProcessing && completedCount + errorCount === totalCount && totalCount > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Keep original names */}
      <label className="flex cursor-pointer items-center gap-2 text-xs text-taupe-700">
        <input
          type="checkbox"
          checked={keepOriginalNames}
          onChange={(e) => onKeepNamesChange(e.currentTarget.checked)}
          className="accent-sage-600"
        />
        Keep original filenames
      </label>

      {/* Overall progress bar */}
      {(isProcessing || isDone) && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-taupe-600">
            <span>{completedCount} / {totalCount} done</span>
            {errorCount > 0 && <span className="text-error">{errorCount} failed</span>}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-taupe-100">
            <div
              className="h-full rounded-full bg-sage-500 transition-all duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        {!isProcessing && !isDone && (
          <button
            onClick={onPreviewSamples}
            disabled={!canRun}
            className="rounded-md bg-taupe-900 px-3 py-2 text-sm font-medium text-cream hover:bg-taupe-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Preview 3 samples
          </button>
        )}

        {isProcessing && (
          <button
            onClick={onCancel}
            className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm font-medium text-error hover:bg-error/20"
          >
            Cancel
          </button>
        )}

        {isDone && (organizeGroups ?? outputs.length > 0) && (
          <div className="flex gap-2">
            {organizeGroups ? (
              <>
                {isFsAccessSupported() && (
                  <button
                    onClick={() => void saveGroupedToFolder(organizeGroups)}
                    className="flex-1 rounded-md border border-taupe-300 bg-cream px-3 py-2 text-sm font-medium text-taupe-800 hover:bg-taupe-100"
                  >
                    Save organized
                  </button>
                )}
                <button
                  onClick={() => downloadGroupedZip(organizeGroups)}
                  className="flex-1 rounded-md bg-taupe-900 px-3 py-2 text-sm font-medium text-cream hover:bg-taupe-800"
                >
                  Download ZIP
                </button>
              </>
            ) : (
              outputs.length > 0 && (
                <>
                  {isFsAccessSupported() && (
                    <button
                      onClick={() => void saveToFolder(outputs)}
                      className="flex-1 rounded-md border border-taupe-300 bg-cream px-3 py-2 text-sm font-medium text-taupe-800 hover:bg-taupe-100"
                    >
                      Save to folder
                    </button>
                  )}
                  <button
                    onClick={() => downloadZip(outputs)}
                    className="flex-1 rounded-md bg-taupe-900 px-3 py-2 text-sm font-medium text-cream hover:bg-taupe-800"
                  >
                    Download ZIP
                  </button>
                </>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
