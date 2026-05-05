import type { BatchItem } from '../stores/batch';
import type { OrganizeConfig } from '../types';
import { groupByDate } from './group-by-date';
import { groupByPattern } from './group-by-pattern';
import { groupBySize } from './group-by-size';

export type GroupedItems = Record<string, BatchItem[]>;

export async function organize(
  items: BatchItem[],
  config: OrganizeConfig,
): Promise<GroupedItems> {
  const completed = items.filter((it) => it.status === 'completed' && it.outputFile);

  switch (config.mode) {
    case 'none':
      return { '': completed };

    case 'date': {
      const { granularity, source } = config.date!;
      return groupByDate(completed, granularity, source);
    }

    case 'name_pattern': {
      const { regex, fallback } = config.namePattern!;
      return groupByPattern(completed, regex, fallback);
    }

    case 'size_limit': {
      // Sort by filename before packing
      const sorted = [...completed].sort((a, b) => a.file.name.localeCompare(b.file.name));
      return groupBySize(sorted, config.sizeLimit!.bytes);
    }

    case 'combined': {
      const { date: dateCfg, sizeLimit } = config.combined!;
      // First pass: group by date
      const dateGroups = await groupByDate(completed, dateCfg.granularity, dateCfg.source);
      // Second pass: split each date group by size if it exceeds the limit
      const result: GroupedItems = {};
      for (const [dateFolder, groupItems] of Object.entries(dateGroups)) {
        const total = groupItems.reduce(
          (sum, it) => sum + (it.outputFile?.size ?? it.file.size),
          0,
        );
        if (total <= sizeLimit.bytes) {
          result[dateFolder] = groupItems;
        } else {
          const sizeSplit = groupBySize(groupItems, sizeLimit.bytes, dateFolder);
          Object.assign(result, sizeSplit);
        }
      }
      return result;
    }
  }
}

import type { ZipEntry } from './zip-download';

/** Convert GroupedItems → grouped ZipEntry structure for output utilities */
export async function toGroupedZipEntries(
  groups: GroupedItems,
): Promise<Record<string, ZipEntry[]>> {
  const result: Record<string, ZipEntry[]> = {};
  for (const [folder, items] of Object.entries(groups)) {
    result[folder] = await Promise.all(
      items
        .filter((it) => it.outputFile)
        .map(async (it) => ({
          fileName: it.outputFile!.name,
          buffer: await it.outputFile!.arrayBuffer(),
        })),
    );
  }
  return result;
}
