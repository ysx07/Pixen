/**
 * Upscale dispatcher (Real-ESRGAN general x4 v3).
 *
 * Returns a PNG Blob to preserve the upscaled pixels losslessly before they
 * enter the rest of the pipeline (which may re-encode to a lossy format).
 */

import { decodeImageToRgba, encodeRgbaToPng } from './image-codec';
import { aiUpscale } from '../hooks/useAiWorker';

export interface UpscaleOptions {
  scale: 2 | 4;
  preferGpu: boolean;
  signal?: AbortSignal;
  onProgress?: (label: string, fraction: number | null) => void;
}

export async function upscaleFile(
  file: File | Blob,
  options: UpscaleOptions,
): Promise<Blob> {
  options.onProgress?.('Decoding image', null);
  const decoded = await decodeImageToRgba(file);
  options.onProgress?.('Running upscale model', null);
  const result = await aiUpscale(
    {
      pixels: decoded.pixels,
      width: decoded.width,
      height: decoded.height,
      scale: options.scale,
      preferGpu: options.preferGpu,
    },
    {
      signal: options.signal,
      onProgress: (p) => {
        if (p.phase === 'fetching-model' && p.total) {
          options.onProgress?.('Downloading upscale model', p.loaded! / p.total);
        } else if (p.phase === 'tiling' && p.totalSteps) {
          options.onProgress?.(
            p.label ?? 'Tiling',
            (p.step ?? 0) / p.totalSteps,
          );
        } else {
          options.onProgress?.(p.label ?? p.phase, null);
        }
      },
    },
  );
  options.onProgress?.('Encoding PNG', null);
  return encodeRgbaToPng({
    pixels: result.pixels,
    width: result.width,
    height: result.height,
  });
}
