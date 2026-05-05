import type { BatchItem } from '../stores/batch';

type Granularity = 'year' | 'month' | 'day';
type DateSource = 'exif' | 'modified';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function dateToFolder(d: Date, granularity: Granularity): string {
  const yyyy = String(d.getFullYear());
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  if (granularity === 'year') return yyyy;
  if (granularity === 'month') return `${yyyy}-${mm}`;
  return `${yyyy}-${mm}-${dd}`;
}

async function getDate(file: File, source: DateSource): Promise<Date> {
  if (source === 'exif') {
    try {
      // Dynamic import so the ~40KB exifr bundle is only loaded when needed
      const exifr = await import('exifr');
      const result = await exifr.parse(file, ['DateTimeOriginal', 'CreateDate']) as Record<string, unknown> | null;
      const raw = result?.['DateTimeOriginal'] ?? result?.['CreateDate'];
      if (raw instanceof Date && !isNaN(raw.getTime())) return raw;
    } catch {
      // exifr throws on non-EXIF files — fall through to lastModified
    }
  }
  return new Date(file.lastModified);
}

export async function groupByDate(
  items: BatchItem[],
  granularity: Granularity,
  source: DateSource,
): Promise<Record<string, BatchItem[]>> {
  const dates = await Promise.all(items.map((item) => getDate(item.file, source)));

  const groups: Record<string, BatchItem[]> = {};
  for (let i = 0; i < items.length; i++) {
    const folder = dateToFolder(dates[i], granularity);
    if (!groups[folder]) groups[folder] = [];
    groups[folder].push(items[i]);
  }
  return groups;
}
