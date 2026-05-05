import { zip } from 'fflate';

export type GroupedZipEntries = Record<string, ZipEntry[]>;

export interface ZipEntry {
  fileName: string;
  buffer: ArrayBuffer;
}

export function downloadZip(entries: ZipEntry[], zipName = 'pixen-output.zip'): void {
  const files: Record<string, Uint8Array> = {};
  for (const entry of entries) {
    // Deduplicate filenames by appending index if collision
    let name = entry.fileName;
    if (name in files) {
      const dot = name.lastIndexOf('.');
      const base = dot >= 0 ? name.slice(0, dot) : name;
      const ext = dot >= 0 ? name.slice(dot) : '';
      let i = 1;
      while (`${base}-${i}${ext}` in files) i++;
      name = `${base}-${i}${ext}`;
    }
    // .slice(0) returns plain ArrayBuffer, resolving Uint8Array generic variance
    files[name] = new Uint8Array(entry.buffer.slice(0));
  }

  zip(files, { level: 0 }, (err, data) => {
    if (err) {
      console.error('ZIP error', err);
      return;
    }
    // fflate never uses SharedArrayBuffer; assertion is safe
    const buf = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
    const blob = new Blob([buf], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  });
}

/**
 * ZIP with subfolders. fflate supports `/` in keys natively, so
 * `{ "2024-03": [{ fileName: "photo.jpg", ... }] }` → `2024-03/photo.jpg` inside the ZIP.
 */
export function downloadGroupedZip(
  groups: GroupedZipEntries,
  zipName = 'pixen-output.zip',
): void {
  const files: Record<string, Uint8Array> = {};

  for (const [folder, entries] of Object.entries(groups)) {
    for (const entry of entries) {
      const prefix = folder ? `${folder}/` : '';
      let name = `${prefix}${entry.fileName}`;
      if (name in files) {
        const dot = entry.fileName.lastIndexOf('.');
        const base = dot >= 0 ? entry.fileName.slice(0, dot) : entry.fileName;
        const ext = dot >= 0 ? entry.fileName.slice(dot) : '';
        let i = 1;
        while (`${prefix}${base}-${i}${ext}` in files) i++;
        name = `${prefix}${base}-${i}${ext}`;
      }
      files[name] = new Uint8Array(entry.buffer.slice(0));
    }
  }

  zip(files, { level: 0 }, (err, data) => {
    if (err) {
      console.error('ZIP error', err);
      return;
    }
    const buf = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
    const blob = new Blob([buf], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  });
}
