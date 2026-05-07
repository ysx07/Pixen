/**
 * Runs a pipeline that may contain AI operations.
 *
 * Strategy: split the operation list at every AI op (`background-removal`,
 * `upscale`). Run each non-AI segment in the VIPS worker; run each AI op on
 * its own (using the AI worker for RMBG-1.4 / upscale, or the imgly worker
 * for IS-Net). The output of each segment becomes the input of the next.
 *
 * This keeps each worker focused on one concern and avoids passing AI
 * weights through the VIPS heap.
 */

import type { Operation } from '../stores/pipeline';
import { runPipeline, type ProcessingRunResult } from './useProcessingWorker';
import type { OutputFormat, ProgressMessage } from '../workers/protocol';
import { removeBackgroundFromFile } from '../utils/bg-removal';
import { upscaleFile } from '../utils/upscale';
import { useAppSettingsStore } from '../stores/app-settings';
import { RMBG_AVAILABLE } from '../utils/build-flags';

export interface AiPipelineProgress {
  step: number;
  totalSteps: number;
  label: string;
}

export interface AiPipelineOptions {
  signal?: AbortSignal;
  onProgress?: (p: AiPipelineProgress) => void;
}

export interface AiPipelineResult {
  output: ProcessingRunResult['output'];
  totalMs: number;
}

const AI_TYPES = new Set<Operation['type']>(['background-removal', 'upscale']);

function isAi(op: Operation): boolean {
  return AI_TYPES.has(op.type);
}

export async function runAiPipeline(
  inputFile: File,
  operations: Operation[],
  options: AiPipelineOptions = {},
): Promise<AiPipelineResult> {
  const t0 = performance.now();
  const settings = useAppSettingsStore.getState().settings;

  // If no AI ops, fall straight through to the VIPS worker.
  if (!operations.some(isAi)) {
    const result = await runPipeline(inputFile, operations, {
      signal: options.signal,
      onProgress: (p) => forwardVipsProgress(options.onProgress, p, 0, 1),
    });
    return { output: result.output, totalMs: performance.now() - t0 };
  }

  // Split into [pre-VIPS][AI op][VIPS][AI op][VIPS]... segments.
  const segments: Operation[][] = [[]];
  const aiOps: Operation[] = [];
  for (const op of operations) {
    if (isAi(op)) {
      aiOps.push(op);
      segments.push([]);
    } else {
      segments[segments.length - 1].push(op);
    }
  }

  const totalStages = segments.length + aiOps.length;
  let stageIdx = 0;

  const reportStage = (label: string, fraction: number | null) => {
    options.onProgress?.({
      step: stageIdx,
      totalSteps: totalStages,
      label: fraction !== null ? `${label} (${Math.round(fraction * 100)}%)` : label,
    });
  };

  let current: File = inputFile;
  let lastVipsResult: ProcessingRunResult | null = null;

  // Iterate segment[0], aiOps[0], segment[1], aiOps[1], ..., segment[N].
  for (let i = 0; i < segments.length; i++) {
    if (options.signal?.aborted) throw new DOMException('aborted', 'AbortError');
    const seg = segments[i];
    if (seg.length > 0) {
      stageIdx++;
      reportStage(`VIPS stage ${i + 1}`, null);
      const res = await runPipeline(current, seg, {
        signal: options.signal,
        onProgress: (p) =>
          forwardVipsProgress(options.onProgress, p, stageIdx, totalStages),
      });
      lastVipsResult = res;
      current = new File([res.output.buffer.slice(0)], res.output.fileName, {
        type: res.output.mimeType,
      });
    }

    const aiOp = aiOps[i];
    if (!aiOp) break;
    stageIdx++;
    current = await applyAiOp(current, aiOp, settings.bgRemovalModel, settings.enableGPU, {
      signal: options.signal,
      onProgress: (label, fraction) => reportStage(label, fraction),
    });
    lastVipsResult = null;
  }

  // Build a ProcessingRunResult-shaped output. If the last stage was VIPS,
  // reuse its rich metadata; otherwise synthesize from the PNG file.
  if (lastVipsResult) {
    return { output: lastVipsResult.output, totalMs: performance.now() - t0 };
  }
  const synthesized = await synthesizeOutput(current);
  return { output: synthesized, totalMs: performance.now() - t0 };
}

async function synthesizeOutput(file: File): Promise<ProcessingRunResult['output']> {
  const buffer = await file.arrayBuffer();
  const bitmap = await createImageBitmap(file);
  const width = bitmap.width;
  const height = bitmap.height;
  bitmap.close();
  const ext = file.name.toLowerCase().split('.').pop() ?? 'png';
  const format: OutputFormat =
    ext === 'jpg' || ext === 'jpeg'
      ? 'jpeg'
      : ext === 'webp'
      ? 'webp'
      : ext === 'avif'
      ? 'avif'
      : 'png';
  return {
    buffer,
    fileName: file.name,
    mimeType: file.type || 'image/png',
    width,
    height,
    byteLength: buffer.byteLength,
    format,
  };
}

interface AiOpProgressArgs {
  signal?: AbortSignal;
  onProgress?: (label: string, fraction: number | null) => void;
}

async function applyAiOp(
  input: File,
  op: Operation,
  bgModel: string,
  preferGpu: boolean,
  cb: AiOpProgressArgs,
): Promise<File> {
  if (op.type === 'background-removal') {
    // Web demo builds don't ship RMBG-1.4. Fall back to IS-Net so the run
    // succeeds instead of erroring on a 404 model fetch.
    const effectiveModel: 'imgly-isnet' | 'rmbg-1.4-fp16' =
      bgModel === 'rmbg-1.4-fp16' && !RMBG_AVAILABLE
        ? 'imgly-isnet'
        : (bgModel as 'imgly-isnet' | 'rmbg-1.4-fp16');
    const blob = await removeBackgroundFromFile(input, {
      model: effectiveModel,
      preferGpu,
      signal: cb.signal,
      onProgress: cb.onProgress,
    });
    return new File([blob], replaceExtension(input.name, 'png'), {
      type: 'image/png',
    });
  }
  if (op.type === 'upscale') {
    const blob = await upscaleFile(input, {
      scale: op.scale,
      preferGpu,
      signal: cb.signal,
      onProgress: cb.onProgress,
    });
    return new File([blob], replaceExtension(input.name, 'png'), {
      type: 'image/png',
    });
  }
  return input;
}

function forwardVipsProgress(
  cb: AiPipelineOptions['onProgress'],
  p: ProgressMessage,
  stageIdx: number,
  totalStages: number,
): void {
  cb?.({
    step: stageIdx,
    totalSteps: totalStages,
    label: `${p.label} (${p.step}/${p.totalSteps})`,
  });
}

function replaceExtension(name: string, newExt: string): string {
  const dot = name.lastIndexOf('.');
  const base = dot >= 0 ? name.slice(0, dot) : name;
  return `${base}.${newExt}`;
}
