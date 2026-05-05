import type { GroupedItems } from '../utils/organize';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

interface OrganizePreviewProps {
  groups: GroupedItems | null;
  isComputing: boolean;
}

export function OrganizePreview({ groups, isComputing }: OrganizePreviewProps) {
  if (isComputing) {
    return (
      <div className="rounded-md border border-taupe-200 bg-taupe-50 p-3">
        <p className="text-xs text-taupe-500">Computing organization…</p>
      </div>
    );
  }

  if (!groups) return null;

  const folderNames = Object.keys(groups);
  if (folderNames.length === 0) return null;

  const totalFiles = Object.values(groups).reduce((sum, items) => sum + items.length, 0);
  const totalBytes = Object.values(groups)
    .flat()
    .reduce((sum, it) => sum + (it.outputFile?.size ?? it.file.size), 0);

  // 'none' mode produces a single empty-string key — show a flat summary instead
  const isFlat = folderNames.length === 1 && folderNames[0] === '';

  return (
    <div className="rounded-md border border-taupe-200 bg-taupe-50 p-3">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-xs font-medium text-taupe-900">
          {isFlat ? 'Flat output' : `${folderNames.length} folder${folderNames.length !== 1 ? 's' : ''}`}
        </span>
        <span className="text-xs text-taupe-500">
          {totalFiles} file{totalFiles !== 1 ? 's' : ''} · {formatBytes(totalBytes)}
        </span>
      </div>

      {!isFlat && (
        <ul className="max-h-40 space-y-1 overflow-y-auto">
          {folderNames.map((folder) => {
            const items = groups[folder];
            const folderBytes = items.reduce(
              (sum, it) => sum + (it.outputFile?.size ?? it.file.size),
              0,
            );
            return (
              <li key={folder} className="flex items-center justify-between text-xs">
                <span className="truncate font-mono text-taupe-800" title={folder}>
                  {folder}/
                </span>
                <span className="ml-2 shrink-0 text-taupe-500">
                  {items.length} · {formatBytes(folderBytes)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
