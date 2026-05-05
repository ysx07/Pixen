import type { BatchItem } from '../stores/batch';

export function groupByPattern(
  items: BatchItem[],
  regex: string,
  fallback: string,
): Record<string, BatchItem[]> {
  let re: RegExp | null = null;
  try {
    re = new RegExp(regex);
  } catch {
    // Invalid regex — put everything in fallback
  }

  const groups: Record<string, BatchItem[]> = {};
  for (const item of items) {
    let folder = fallback;
    if (re) {
      const match = re.exec(item.file.name);
      if (match?.[1]) folder = match[1];
    }
    if (!groups[folder]) groups[folder] = [];
    groups[folder].push(item);
  }
  return groups;
}
