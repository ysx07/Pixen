import type { BatchItem } from '../stores/batch';

function binName(prefix: string, index: number): string {
  return `${prefix}_${String(index).padStart(3, '0')}`;
}

/**
 * Pack items into bins where each bin's total output size stays under maxBytes.
 * Items are taken in the order given — sort before calling if ordering matters.
 * prefix is used as the bin name base (e.g. "Batch" → "Batch_001").
 */
export function groupBySize(
  items: BatchItem[],
  maxBytes: number,
  prefix = 'Batch',
): Record<string, BatchItem[]> {
  const groups: Record<string, BatchItem[]> = {};
  let binIndex = 1;
  let binSize = 0;
  let binKey = binName(prefix, binIndex);

  for (const item of items) {
    const itemSize = item.outputFile?.size ?? item.file.size;

    // If a single file is larger than the limit, it gets its own bin
    if (itemSize > maxBytes && binSize === 0) {
      groups[binKey] = [item];
      binIndex++;
      binKey = binName(prefix, binIndex);
      binSize = 0;
      continue;
    }

    if (binSize + itemSize > maxBytes && binSize > 0) {
      binIndex++;
      binKey = binName(prefix, binIndex);
      binSize = 0;
    }

    if (!groups[binKey]) groups[binKey] = [];
    groups[binKey].push(item);
    binSize += itemSize;
  }

  return groups;
}
