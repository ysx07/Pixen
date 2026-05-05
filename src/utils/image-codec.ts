/**
 * Main-thread helpers for decoding image files to raw RGBA and re-encoding
 * RGBA buffers back to PNG. Used to feed AI pipelines that operate on raw
 * pixels (the VIPS worker handles its own decoding, but the AI worker
 * receives pre-decoded pixels so it doesn't need a full image decoder).
 */

export interface RawImage {
  pixels: ArrayBuffer; // RGBA Uint8 packed
  width: number;
  height: number;
}

export async function decodeImageToRgba(file: File | Blob): Promise<RawImage> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('OffscreenCanvas 2D context unavailable');
    ctx.drawImage(bitmap, 0, 0);
    const data = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
    return {
      pixels: data.buffer.slice(0),
      width: bitmap.width,
      height: bitmap.height,
    };
  } finally {
    bitmap.close();
  }
}

export async function encodeRgbaToPng(img: RawImage): Promise<Blob> {
  const canvas = new OffscreenCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('OffscreenCanvas 2D context unavailable');
  const imageData = new ImageData(
    new Uint8ClampedArray(img.pixels),
    img.width,
    img.height,
  );
  ctx.putImageData(imageData, 0, 0);
  return canvas.convertToBlob({ type: 'image/png' });
}
