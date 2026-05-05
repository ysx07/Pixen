import type { ZipEntry, GroupedZipEntries } from './zip-download';
import { downloadZip, downloadGroupedZip } from './zip-download';

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

type DirPicker = () => Promise<FileSystemDirectoryHandle>;

async function getOrCreateSubdir(
  root: FileSystemDirectoryHandle,
  folderPath: string,
): Promise<FileSystemDirectoryHandle> {
  const segments = folderPath.split('/').filter(Boolean);
  let handle = root;
  for (const seg of segments) {
    handle = await handle.getDirectoryHandle(seg, { create: true });
  }
  return handle;
}

export async function saveGroupedToFolder(groups: GroupedZipEntries): Promise<void> {
  const picker = (window as Window & { showDirectoryPicker?: DirPicker }).showDirectoryPicker;
  if (!picker) {
    downloadGroupedZip(groups);
    return;
  }

  let dirHandle: FileSystemDirectoryHandle;
  try {
    dirHandle = await picker();
  } catch {
    return;
  }

  for (const [folder, entries] of Object.entries(groups)) {
    const targetDir = folder ? await getOrCreateSubdir(dirHandle, folder) : dirHandle;
    await Promise.all(
      entries.map(async (entry) => {
        const fileHandle = await targetDir.getFileHandle(entry.fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(entry.buffer);
        await writable.close();
      }),
    );
  }
}
