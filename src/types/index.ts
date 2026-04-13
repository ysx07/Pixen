/**
 * Core type definitions for Pixen
 * See docs/SPEC.md Section 7 for data model details
 */

/**
 * Resize modes for the Resize operation
 * - exact: Set exact dimensions (may distort)
 * - fit: Fit within dimensions, preserve aspect ratio
 * - fill: Fill dimensions, preserve aspect ratio (may crop)
 * - cover: Fill dimensions, preserve aspect ratio, crop to fit
 * - longest-side: Scale by longest side to match target
 * - percent: Scale by percentage
 */
export type ResizeMode = 'exact' | 'fit' | 'fill' | 'cover' | 'longest-side' | 'percent'

/**
 * Pad fill modes for the Pad operation
 * - solid-color: Fill with a solid color
 * - blur: Extend edges with blurred image content
 * - transparent: Fill with transparency (RGBA output)
 */
export type PadFillMode = 'solid-color' | 'blur' | 'transparent'

/**
 * Output image formats
 */
export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif'

/**
 * Compression modes
 * - quality: Explicit quality slider (0-100)
 * - perceptual: Target perceptual quality (Maximum Quality, Web Optimized, Aggressive Reduction)
 */
export type CompressionMode = 'quality' | 'perceptual'

/**
 * Perceptual quality targets
 */
export type PerceptualTarget = 'maximum' | 'web-optimized' | 'aggressive'

/**
 * Operation type union
 */
export type OperationType =
  | 'resize'
  | 'pad'
  | 'convert'
  | 'compress'
  | 'strip-metadata'
  | 'rename'
  | 'background-removal'
  | 'upscale'
  | 'flatten-transparency'

/**
 * Individual operation definition
 */
export interface Operation {
  type: OperationType
  params: Record<string, unknown>
}

/**
 * Resize operation parameters
 */
export interface ResizeParams {
  mode: ResizeMode
  width?: number
  height?: number
  percent?: number
  preserveAspectRatio?: boolean
}

/**
 * Pad operation parameters
 */
export interface PadParams {
  aspectRatio?: string // e.g., "16:9"
  width?: number
  height?: number
  fillMode: PadFillMode
  solidColor?: string // Hex color, e.g., "#000000"
}

/**
 * Convert operation parameters
 */
export interface ConvertParams {
  format: ImageFormat
}

/**
 * Compress operation parameters
 */
export interface CompressParams {
  mode: CompressionMode
  quality?: number // 0-100 if mode === 'quality'
  target?: PerceptualTarget // if mode === 'perceptual'
}

/**
 * Strip metadata operation parameters
 */
export interface StripMetadataParams {
  stripExif: boolean
  stripIccProfile: boolean
  preserveColorProfile: boolean
}

/**
 * Rename operation parameters
 * Supports tokens: {name}, {index}, {date}, {width}, {height}, {format}
 */
export interface RenameParams {
  pattern: string // e.g., "{name}_{index}.{format}"
}

/**
 * Background removal operation parameters (post-MVP)
 */
export interface BackgroundRemovalParams {
  modelSelection?: string
  threshold?: number
}

/**
 * Upscale operation parameters (post-MVP)
 */
export interface UpscaleParams {
  scaleFactor: 2 | 4
  modelSelection?: string
}

/**
 * Flatten transparency operation parameters
 */
export interface FlattenTransparencyParams {
  fillColor: string // Hex color, e.g., "#FFFFFF"
}

/**
 * Pipeline: ordered list of operations
 */
export interface Pipeline {
  operations: Operation[]
  organizeConfig?: OrganizeConfig
}

/**
 * Organization/grouping configuration
 */
export interface OrganizeConfig {
  enabled: boolean
  groupingMode: GroupingMode
  groupingRules: GroupingRules
}

/**
 * Grouping mode type
 */
export type GroupingMode = 'date' | 'pattern' | 'size-limit' | 'custom' | 'none'

/**
 * Grouping rules based on mode
 */
export interface GroupingRules {
  // For 'date' mode
  dateGranularity?: 'year' | 'month' | 'day'
  datePattern?: string // e.g., "YYYY/MM"

  // For 'pattern' mode
  filenamePattern?: string // prefix, regex, or fuzzy
  regexCaptureGroup?: number

  // For 'size-limit' mode
  maxSizeGB?: number
  sortBy?: 'date' | 'filename'

  // For 'custom' mode
  customRules?: string[]
}

/**
 * Named, saved recipe
 * See docs/SPEC.md Section 4.1
 */
export interface Recipe {
  id: string // UUID
  name: string
  version: number
  created: string // ISO 8601 timestamp
  description?: string
  operations: Operation[]
  organize: {
    enabled: boolean
    groupingMode?: GroupingMode
    groupingRules?: GroupingRules
  }
}

/**
 * Built-in recipe presets
 */
export const BUILT_IN_RECIPES = {
  INSTAGRAM_1_1: 'instagram-1-1-grid',
  SHOPIFY_PRODUCT: 'shopify-product-2000',
  TWITTER_POST: 'twitter-post',
  LINKEDIN_BANNER: 'linkedin-banner',
  WEB_GENERAL: 'web-general',
  ARCHIVE: 'archive-lossless',
} as const

/**
 * Image batch item
 */
export interface BatchImage {
  file: File
  id: string // UUID or sequential ID
  dimensions?: { width: number; height: number }
  size: number
}

/**
 * Processing result
 */
export interface ProcessingResult {
  originalFile: File
  processedBlob: Blob
  originalSize: number
  processedSize: number
  dimensions: { before: { width: number; height: number }; after: { width: number; height: number } }
  format: ImageFormat
  processingTimeMs: number
}

/**
 * Batch processing status
 */
export type ProcessingStatus = 'idle' | 'processing' | 'completed' | 'failed'

/**
 * Error type for processing
 */
export interface ProcessingError {
  code: string
  message: string
  fatal: boolean
  fileId?: string
}
