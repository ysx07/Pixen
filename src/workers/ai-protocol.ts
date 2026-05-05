/**
 * Message protocol between the main thread and the AI worker.
 *
 * The AI worker handles ONNX inference for opt-in advanced models
 * (RMBG-1.4) and upscaling (Real-ESRGAN). The default background-removal
 * pipeline (@imgly/background-removal) does not use this worker — it ships
 * its own self-contained worker.
 */

import type { ModelId } from '../utils/model-registry';

export interface AiInitRequest {
  id: string;
  type: 'init';
}

export interface RmbgRequest {
  id: string;
  type: 'rmbg';
  pixels: ArrayBuffer; // RGBA Uint8 packed
  width: number;
  height: number;
  modelUrl: string;
  modelId: ModelId;
  preferGpu: boolean;
}

export interface UpscaleRequest {
  id: string;
  type: 'upscale';
  pixels: ArrayBuffer; // RGBA Uint8 packed
  width: number;
  height: number;
  scale: 2 | 4;
  modelUrl: string;
  modelId: ModelId;
  preferGpu: boolean;
}

export interface AiCancelRequest {
  id: string;
  type: 'cancel';
  targetId: string;
}

export type AiWorkerRequest =
  | AiInitRequest
  | RmbgRequest
  | UpscaleRequest
  | AiCancelRequest;

export type AiPhase =
  | 'fetching-model'
  | 'creating-session'
  | 'running'
  | 'tiling'
  | 'finishing';

export interface AiProgressMessage {
  id: string;
  type: 'progress';
  phase: AiPhase;
  loaded?: number;
  total?: number;
  step?: number;
  totalSteps?: number;
  label?: string;
}

export interface AiInitResponse {
  id: string;
  type: 'init';
  status: 'success' | 'error';
  backend?: 'webgpu' | 'wasm';
  error?: string;
}

export interface AiResultSuccess {
  id: string;
  type: 'result';
  status: 'success';
  pixels: ArrayBuffer;
  width: number;
  height: number;
  channels: 4;
}

export interface AiResultError {
  id: string;
  type: 'result';
  status: 'error';
  error: string;
}

export type AiWorkerResponse =
  | AiInitResponse
  | AiProgressMessage
  | AiResultSuccess
  | AiResultError;
