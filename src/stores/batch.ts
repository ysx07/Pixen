import { create } from 'zustand';

export interface BatchItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number; // 0-100
  error?: string;
  outputFile?: File;
}

export interface BatchState {
  items: BatchItem[];
  isProcessing: boolean;
  previewIndices: number[]; // Indices of files to preview before batch run
  addFiles: (files: File[]) => void;
  removeItem: (id: string) => void;
  clearBatch: () => void;
  setItemStatus: (id: string, status: BatchItem['status'], progress?: number, error?: string) => void;
  setOutputFile: (id: string, file: File) => void;
  setProcessing: (isProcessing: boolean) => void;
  generatePreviewIndices: (count: number) => void;
}

export const useBatchStore = create<BatchState>((set) => ({
  items: [],
  isProcessing: false,
  previewIndices: [],

  addFiles: (files) =>
    set((state) => ({
      items: [
        ...state.items,
        ...files.map((file) => ({
          id: `${Date.now()}-${Math.random()}`,
          file,
          status: 'pending' as const,
          progress: 0,
        })),
      ],
    })),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  clearBatch: () =>
    set({
      items: [],
      isProcessing: false,
      previewIndices: [],
    }),

  setItemStatus: (id, status, progress = 0, error) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              progress,
              error: error || (status === 'error' ? 'Unknown error' : undefined),
            }
          : item
      ),
    })),

  setOutputFile: (id, file) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? {
              ...item,
              outputFile: file,
            }
          : item
      ),
    })),

  setProcessing: (isProcessing) =>
    set({ isProcessing }),

  generatePreviewIndices: (count) =>
    set((state) => {
      if (state.items.length <= count) {
        return { previewIndices: state.items.map((_, i) => i) };
      }
      const indices: number[] = [];
      while (indices.length < count) {
        const idx = Math.floor(Math.random() * state.items.length);
        if (!indices.includes(idx)) {
          indices.push(idx);
        }
      }
      return { previewIndices: indices.sort((a, b) => a - b) };
    }),
}));
