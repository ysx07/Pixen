/**
 * ONNX Runtime Web wrapper for AI inference
 *
 * Handles model loading, caching, and inference with automatic backend selection.
 *
 * See docs/SPEC.md Section 5.3 for technical details.
 */

export type BackendName = 'webgpu' | 'wasm-simd' | 'wasm-single-thread'

export interface BackendInfo {
  name: BackendName
  supported: boolean
  description: string
}

/**
 * Initialize ONNX Runtime with automatic backend detection
 *
 * Priority chain:
 * 1. WebGPU (Chrome/Edge, 85% of users) - 100-500ms for background removal
 * 2. WASM SIMD + Threads (remaining desktop) - ~3-8s for background removal
 * 3. WASM single-thread (iOS Safari, legacy) - slower, but functional
 * 4. None available - degrade with warning
 */
export async function initializeOnnxRuntime(): Promise<void> {
  // TODO: Implement ONNX Runtime initialization
  // 1. Check available backends in priority order
  // 2. Load runtime with auto-selected backend
  // 3. Set up model cache in IndexedDB
  console.warn('ONNX Runtime not yet initialized')
}

/**
 * Get available backends and their status
 */
export function getAvailableBackends(): BackendInfo[] {
  // TODO: Detect available backends
  return [
    { name: 'webgpu', supported: false, description: 'WebGPU (fastest, Chrome/Edge)' },
    { name: 'wasm-simd', supported: false, description: 'WASM SIMD + Threads' },
    { name: 'wasm-single-thread', supported: false, description: 'WASM single-thread (slowest)' },
  ]
}

/**
 * Get currently selected backend
 */
export function getSelectedBackend(): BackendName | null {
  // TODO: Return currently selected backend
  return null
}

/**
 * Remove background from an image using AI model
 *
 * Models are cached in IndexedDB after first download.
 * Returns image with transparent background (RGBA).
 *
 * Performance:
 * - WebGPU: 100-500ms
 * - WASM: 3-8 seconds
 *
 * @param imageBuffer - Raw image buffer (RGBA expected)
 * @param modelSelection - Optional specific model to use
 * @param onProgress - Optional progress callback (0-1)
 * @returns Image buffer with transparent background
 */
export async function removeBackground(
  imageBuffer: ArrayBuffer,
  _modelSelection?: string,
  _onProgress?: (progress: number) => void,
): Promise<ArrayBuffer> {
  // TODO: Implement background removal
  // 1. Load model from cache or download
  // 2. Prepare input tensor
  // 3. Run inference
  // 4. Post-process output
  console.warn('removeBackground() not yet implemented')
  return imageBuffer
}

/**
 * Upscale an image using AI model
 *
 * Supports 2x and 4x upscaling.
 * Sequential queue only—never parallel (VRAM safety).
 *
 * Performance depends on model:
 * - 2x upscale: 2-5 seconds
 * - 4x upscale: 5-15 seconds
 *
 * @param imageBuffer - Raw image buffer
 * @param _scaleFactor - 2 or 4
 * @param _modelSelection - Optional specific model to use
 * @param _onProgress - Optional progress callback (0-1)
 * @returns Upscaled image buffer
 */
export async function upscale(
  imageBuffer: ArrayBuffer,
  _scaleFactor: 2 | 4,
  _modelSelection?: string,
  _onProgress?: (progress: number) => void,
): Promise<ArrayBuffer> {
  // TODO: Implement upscaling
  // 1. Load model from cache or download
  // 2. Prepare input tensor
  // 3. Run inference (sequential, no parallelization)
  // 4. Post-process output
  console.warn('upscale() not yet implemented')
  return imageBuffer
}

/**
 * Preload a model into IndexedDB cache
 *
 * Useful for warming up cache before batch processing.
 * Returns true if already cached, false if newly downloaded.
 */
export async function preloadModel(_modelName: string): Promise<boolean> {
  // TODO: Implement model preloading
  console.warn('preloadModel() not yet implemented')
  return false
}

/**
 * Clear cached models from IndexedDB
 */
export async function clearModelCache(): Promise<void> {
  // TODO: Implement cache clearing
  console.warn('clearModelCache() not yet implemented')
}

/**
 * Get cached model list
 */
export async function getCachedModels(): Promise<string[]> {
  // TODO: Return list of cached models
  return []
}

/**
 * Estimate processing time for a batch
 *
 * Useful for showing ETA to user before running batch.
 */
export function estimateProcessingTime(
  _fileCount: number,
  _backend: BackendName,
  _includeBackgroundRemoval: boolean,
  _includeUpscale: boolean,
): number {
  // TODO: Implement time estimation based on backend and operations
  return 0
}
