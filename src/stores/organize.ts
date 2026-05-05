import { create } from 'zustand';
import type { OrganizeConfig, OrganizeMode } from '../types';

const GB = 1024 * 1024 * 1024;

const DEFAULT_CONFIG: OrganizeConfig = {
  mode: 'none',
  date: { granularity: 'month', source: 'exif' },
  namePattern: { regex: '^([^_]+)_', fallback: 'Other' },
  sizeLimit: { bytes: 2 * GB },
  combined: {
    date: { granularity: 'month', source: 'exif' },
    sizeLimit: { bytes: 2 * GB },
  },
};

interface OrganizeState {
  config: OrganizeConfig;
  setMode: (mode: OrganizeMode) => void;
  setDateGranularity: (granularity: 'year' | 'month' | 'day') => void;
  setDateSource: (source: 'exif' | 'modified') => void;
  setNamePatternRegex: (regex: string) => void;
  setNamePatternFallback: (fallback: string) => void;
  setSizeLimitBytes: (bytes: number) => void;
  setCombinedDateGranularity: (granularity: 'year' | 'month' | 'day') => void;
  setCombinedDateSource: (source: 'exif' | 'modified') => void;
  setCombinedSizeLimitBytes: (bytes: number) => void;
  reset: () => void;
}

export const useOrganizeStore = create<OrganizeState>((set) => ({
  config: { ...DEFAULT_CONFIG },

  setMode: (mode) => set((s) => ({ config: { ...s.config, mode } })),

  setDateGranularity: (granularity) =>
    set((s) => ({
      config: { ...s.config, date: { ...s.config.date!, granularity } },
    })),

  setDateSource: (source) =>
    set((s) => ({
      config: { ...s.config, date: { ...s.config.date!, source } },
    })),

  setNamePatternRegex: (regex) =>
    set((s) => ({
      config: { ...s.config, namePattern: { ...s.config.namePattern!, regex } },
    })),

  setNamePatternFallback: (fallback) =>
    set((s) => ({
      config: { ...s.config, namePattern: { ...s.config.namePattern!, fallback } },
    })),

  setSizeLimitBytes: (bytes) =>
    set((s) => ({
      config: { ...s.config, sizeLimit: { bytes } },
    })),

  setCombinedDateGranularity: (granularity) =>
    set((s) => ({
      config: {
        ...s.config,
        combined: { ...s.config.combined!, date: { ...s.config.combined!.date, granularity } },
      },
    })),

  setCombinedDateSource: (source) =>
    set((s) => ({
      config: {
        ...s.config,
        combined: { ...s.config.combined!, date: { ...s.config.combined!.date, source } },
      },
    })),

  setCombinedSizeLimitBytes: (bytes) =>
    set((s) => ({
      config: {
        ...s.config,
        combined: { ...s.config.combined!, sizeLimit: { bytes } },
      },
    })),

  reset: () => set({ config: { ...DEFAULT_CONFIG } }),
}));
