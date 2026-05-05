/**
 * Model registry for the AI worker.
 *
 * Models are vendored under public/models/ and served from the same origin
 * as the app. Self-hosting avoids 401/404 churn from upstream HF repos
 * being made private or renamed.
 *
 * NOTE: Models loaded through this registry are gated behind explicit user
 * opt-in (see app-settings). RMBG-1.4 is NON-COMMERCIAL — see SPEC §6.1.
 */

export type ModelId = 'rmbg-1.4-fp16' | 'realesr-general-x4v3';

export interface ModelDescriptor {
  id: ModelId;
  label: string;
  inputSize: number; // expected square input edge in pixels
  scale?: number; // for upscalers
  url: string;
  approxBytes: number;
  notes?: string;
}

export const DEFAULT_MODEL_REGISTRY: Record<ModelId, ModelDescriptor> = {
  'rmbg-1.4-fp16': {
    id: 'rmbg-1.4-fp16',
    label: 'RMBG-1.4 (fp16, advanced)',
    inputSize: 1024,
    url: '/models/rmbg-1.4-fp16.onnx',
    approxBytes: 88 * 1024 * 1024,
    notes: 'NON-COMMERCIAL license. Verify rights before commercial use.',
  },
  'realesr-general-x4v3': {
    id: 'realesr-general-x4v3',
    label: 'Real-ESRGAN general x4 v3',
    inputSize: 256,
    scale: 4,
    url: '/models/realesr-general-x4v3.onnx',
    approxBytes: 5 * 1024 * 1024,
  },
};
