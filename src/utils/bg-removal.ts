/**
 * Background-removal dispatcher.
 *
 * Default path: @imgly/background-removal (IS-Net, AGPL-3.0). Self-contained
 * package — handles its own model download and IndexedDB cache.
 *
 * Advanced opt-in path: RMBG-1.4 via the AI worker. Requires explicit user
 * acknowledgement of the non-commercial license (see app-settings).
 *
 * Both paths return a PNG Blob with transparent background.
 */

import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';
import { decodeImageToRgba, encodeRgbaToPng } from './image-codec';
import { rmbgRemoveBackground } from '../hooks/useAiWorker';

export type BgRemovalModel = 'imgly-isnet' | 'rmbg-1.4-fp16';

export interface BgRemovalOptions {
  model: BgRemovalModel;
  preferGpu: boolean;
  signal?: AbortSignal;
  onProgress?: (label: string, fraction: number | null) => void;
}

export async function removeBackgroundFromFile(
  file: File | Blob,
  options: BgRemovalOptions,
): Promise<Blob> {
  if (options.model === 'imgly-isnet') {
    return imglyRemoveBackground(file, {
      device: options.preferGpu ? 'gpu' : 'cpu',
      output: { format: 'image/png', quality: 0.95 },
      progress: (key, current, total) => {
        const fraction = total > 0 ? current / total : null;
        options.onProgress?.(key, fraction);
      },
    });
  }

  // RMBG-1.4 path: decode to raw RGBA, run inference in AI worker, re-encode.
  options.onProgress?.('Decoding image', null);
  const decoded = await decodeImageToRgba(file);
  options.onProgress?.('Running RMBG-1.4', null);
  const result = await rmbgRemoveBackground(
    {
      pixels: decoded.pixels,
      width: decoded.width,
      height: decoded.height,
      preferGpu: options.preferGpu,
    },
    {
      signal: options.signal,
      onProgress: (p) => {
        if (p.phase === 'fetching-model' && p.total) {
          options.onProgress?.('Downloading RMBG-1.4', p.loaded! / p.total);
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
