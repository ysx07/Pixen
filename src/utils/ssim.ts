/**
 * Minimal 8x8-block SSIM on a single luminance plane (Uint8, 0-255).
 * Returns a value in [-1, 1]; 1.0 means identical.
 *
 * Reference: Wang et al. 2004. Simplified: global mean over non-overlapping blocks.
 * Good enough to drive a perceptual-quality search for JPEG/WebP/AVIF encoding.
 * A full Gaussian-window implementation can replace this in a future phase if
 * accuracy becomes a limitation.
 */

const K1 = 0.01;
const K2 = 0.03;
const L = 255;
const C1 = (K1 * L) ** 2;
const C2 = (K2 * L) ** 2;
const BLOCK = 8;

export function ssimLuma(
  a: Uint8Array,
  b: Uint8Array,
  width: number,
  height: number,
): number {
  if (a.length !== b.length || a.length !== width * height) {
    throw new Error('ssimLuma: buffer size mismatch');
  }

  let total = 0;
  let blocks = 0;

  for (let by = 0; by + BLOCK <= height; by += BLOCK) {
    for (let bx = 0; bx + BLOCK <= width; bx += BLOCK) {
      let sumA = 0;
      let sumB = 0;
      let sumAA = 0;
      let sumBB = 0;
      let sumAB = 0;

      for (let y = 0; y < BLOCK; y++) {
        const row = (by + y) * width + bx;
        for (let x = 0; x < BLOCK; x++) {
          const va = a[row + x];
          const vb = b[row + x];
          sumA += va;
          sumB += vb;
          sumAA += va * va;
          sumBB += vb * vb;
          sumAB += va * vb;
        }
      }

      const n = BLOCK * BLOCK;
      const meanA = sumA / n;
      const meanB = sumB / n;
      const varA = sumAA / n - meanA * meanA;
      const varB = sumBB / n - meanB * meanB;
      const covAB = sumAB / n - meanA * meanB;

      const num = (2 * meanA * meanB + C1) * (2 * covAB + C2);
      const den = (meanA * meanA + meanB * meanB + C1) * (varA + varB + C2);
      total += num / den;
      blocks++;
    }
  }

  return blocks === 0 ? 1 : total / blocks;
}
