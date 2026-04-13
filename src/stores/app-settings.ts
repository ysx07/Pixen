import { create } from 'zustand';

export interface AppSettings {
  previewSampleCount: number; // How many images to preview before batch run
  maxBatchWebSize: number; // Max batch size warning for web (images)
  maxBatchDesktopSize: number; // Max batch size for desktop (images)
  enableGPU: boolean; // Use GPU for AI ops if available
  autoPreview: boolean; // Auto-generate preview on file upload
}

export interface AppSettingsState {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  loadFromLocalStorage: () => void;
  saveToLocalStorage: () => void;
  getSettings: () => AppSettings;
}

const defaultSettings: AppSettings = {
  previewSampleCount: 3,
  maxBatchWebSize: 500,
  maxBatchDesktopSize: 1000,
  enableGPU: true,
  autoPreview: true,
};

export const useAppSettingsStore = create<AppSettingsState>((set, get) => ({
  settings: defaultSettings,

  updateSetting: (key, value) => {
    set((state) => ({
      settings: {
        ...state.settings,
        [key]: value,
      },
    }));
    get().saveToLocalStorage();
  },

  loadFromLocalStorage: () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('pixen-settings');
      if (stored) {
        const settings = JSON.parse(stored) as AppSettings;
        set({
          settings: {
            ...defaultSettings,
            ...settings,
          },
        });
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
  },

  saveToLocalStorage: () => {
    if (typeof window === 'undefined') return;
    try {
      const settings = get().settings;
      localStorage.setItem('pixen-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  },

  getSettings: () => {
    return get().settings;
  },
}));
