import { useCallback, useRef, useState } from 'react';

interface DropZoneProps {
  onFiles: (files: File[]) => void;
}

function isImage(file: File) {
  return file.type.startsWith('image/');
}

async function collectFromEntry(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    return new Promise((resolve) => {
      (entry as FileSystemFileEntry).file(
        (f) => resolve(isImage(f) ? [f] : []),
        () => resolve([]),
      );
    });
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const allEntries: FileSystemEntry[] = [];
    await new Promise<void>((resolve) => {
      const readBatch = () => {
        reader.readEntries((batch) => {
          if (batch.length === 0) {
            resolve();
          } else {
            allEntries.push(...batch);
            readBatch();
          }
        });
      };
      readBatch();
    });
    const nested = await Promise.all(allEntries.map(collectFromEntry));
    return nested.flat();
  }
  return [];
}

export function DropZone({ onFiles }: DropZoneProps) {
  const [hovering, setHovering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setHovering(false);
      const items = Array.from(e.dataTransfer.items);
      const entries = items
        .map((item) => item.webkitGetAsEntry?.())
        .filter(Boolean) as FileSystemEntry[];

      if (entries.length > 0) {
        const nested = await Promise.all(entries.map(collectFromEntry));
        const files = nested.flat();
        if (files.length > 0) onFiles(files);
        return;
      }

      // Fallback: no FileSystem API
      const files = Array.from(e.dataTransfer.files).filter(isImage);
      if (files.length > 0) onFiles(files);
    },
    [onFiles],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.currentTarget.files ?? []).filter(isImage);
      if (files.length > 0) onFiles(files);
      e.currentTarget.value = '';
    },
    [onFiles],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setHovering(true);
      }}
      onDragLeave={() => setHovering(false)}
      onDrop={(e) => void handleDrop(e)}
      className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
        hovering
          ? 'border-sage-500 bg-sage-50'
          : 'border-taupe-300 bg-taupe-50 hover:bg-taupe-100'
      }`}
    >
      <p className="font-serif text-lg text-taupe-900">Drop images or a folder</p>
      <p className="mt-1 text-sm text-taupe-600">or choose below</p>
      <div className="mt-3 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded border border-taupe-300 bg-cream px-3 py-1.5 text-xs text-taupe-700 hover:bg-taupe-100"
        >
          Select files
        </button>
        <button
          type="button"
          onClick={() => folderRef.current?.click()}
          className="rounded border border-taupe-300 bg-cream px-3 py-1.5 text-xs text-taupe-700 hover:bg-taupe-100"
        >
          Select folder
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFileInput}
      />
      <input
        ref={folderRef}
        type="file"
        // @ts-expect-error — webkitdirectory is non-standard but widely supported
        webkitdirectory=""
        multiple
        hidden
        onChange={handleFileInput}
      />
    </div>
  );
}
