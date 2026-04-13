import { create } from 'zustand';

export type Operation =
  | { type: 'resize'; width: number; height: number; mode: 'cover' | 'contain' | 'fill' | 'inside' | 'outside' | 'max' }
  | { type: 'pad'; top: number; right: number; bottom: number; left: number; fillMode: 'color' | 'extend' | 'mirror'; color?: string }
  | { type: 'convert'; format: 'jpeg' | 'png' | 'webp' | 'avif' }
  | { type: 'compress'; quality: number; perceptual: boolean }
  | { type: 'stripMetadata' }
  | { type: 'rename'; pattern: string }
  | { type: 'background-removal' }
  | { type: 'upscale'; scale: 2 | 4 };

export interface PipelineState {
  operations: Operation[];
  addOperation: (operation: Operation) => void;
  removeOperation: (index: number) => void;
  updateOperation: (index: number, operation: Operation) => void;
  moveOperation: (from: number, to: number) => void;
  clearPipeline: () => void;
}

export const usePipelineStore = create<PipelineState>((set) => ({
  operations: [],

  addOperation: (operation) =>
    set((state) => ({
      operations: [...state.operations, operation],
    })),

  removeOperation: (index) =>
    set((state) => ({
      operations: state.operations.filter((_, i) => i !== index),
    })),

  updateOperation: (index, operation) =>
    set((state) => ({
      operations: state.operations.map((op, i) => (i === index ? operation : op)),
    })),

  moveOperation: (from, to) =>
    set((state) => {
      const newOps = [...state.operations];
      const [moved] = newOps.splice(from, 1);
      newOps.splice(to, 0, moved);
      return { operations: newOps };
    }),

  clearPipeline: () =>
    set({ operations: [] }),
}));
