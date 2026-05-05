import type { ZipEntry } from './zip-download';
import { downloadZip } from './zip-download';

export function isFsAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export async function saveToFolder(entries: ZipEntry[]): Promise<void> {
  // showDirectoryPicker is non-standard; TypeScript doesn't include it in lib.dom
  const picker = (window as Window & { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> })
    .showDirectoryPicker;
  if (!picker) {
    downloadZip(entries);
    return;
  }

  let dirHandle: FileSystemDirectoryHandle;
  try {
    dirHandle = await picker();
  } catch {
    // User cancelled
    return;
  }

  await Promise.all(
    entries.map(async (entry) => {
      const fileHandle = await dirHandle.getFileHandle(entry.fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(entry.buffer);
      await writable.close();
    }),
  );
}
