import type { Operation } from '../stores/pipeline';

export interface RunPipelineRequest {
  id: string;
  type: 'runPipeline';
  fileBuffer: ArrayBuffer;
  fileName: string;
  operations: Operation[];
}

export interface InitRequest {
  id: string;
  type: 'init';
}

export type WorkerRequest = RunPipelineRequest | InitRequest;

export interface ProgressMessage {
  id: string;
  type: 'progress';
  step: number;
  totalSteps: number;
  label: string;
}

export interface PipelineSuccess {
  id: string;
  type: 'result';
  status: 'success';
  output: {
    buffer: ArrayBuffer;
    fileName: string;
    mimeType: string;
    width: number;
    height: number;
    byteLength: number;
    format: OutputFormat;
    quality?: number;
  };
  timings: { totalMs: number };
}

export interface PipelineError {
  id: string;
  type: 'result';
  status: 'error';
  error: string;
}

export interface InitResponse {
  id: string;
  type: 'init';
  status: 'success' | 'error';
  threading?: boolean;
  error?: string;
}

export type WorkerResponse =
  | ProgressMessage
  | PipelineSuccess
  | PipelineError
  | InitResponse;

export type OutputFormat = 'jpeg' | 'png' | 'webp' | 'avif';

export const FORMAT_MIME: Record<OutputFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
};

export const FORMAT_EXT: Record<OutputFormat, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  avif: 'avif',
};

export function detectFormatFromName(name: string): OutputFormat {
  const ext = name.toLowerCase().split('.').pop() ?? '';
  if (ext === 'jpg' || ext === 'jpeg') return 'jpeg';
  if (ext === 'png') return 'png';
  if (ext === 'webp') return 'webp';
  if (ext === 'avif') return 'avif';
  return 'jpeg';
}
