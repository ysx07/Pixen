import type { Recipe } from '../stores/recipes'

export type Preset = Readonly<Recipe>

export const RECIPE_PRESETS: ReadonlyArray<Preset> = [
  {
    id: 'preset-instagram',
    name: 'Instagram Grid (1:1)',
    platform: 'instagram',
    version: 1,
    created: '2025-01-01T00:00:00.000Z',
    updatedAt: 1735689600000,
    description: 'Square 1080×1080 JPEG, white padding, 85 quality',
    operations: [
      {
        type: 'resize',
        width: 1080,
        height: 1080,
        mode: 'contain',
      },
      {
        type: 'pad',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        fillMode: 'color',
        color: '#ffffff',
      },
      {
        type: 'convert',
        format: 'jpeg',
      },
      {
        type: 'compress',
        quality: 85,
        perceptual: false,
      },
    ],
  },
  {
    id: 'preset-shopify',
    name: 'Shopify Product',
    platform: 'shopify',
    version: 1,
    created: '2025-01-01T00:00:00.000Z',
    updatedAt: 1735689600000,
    description: '2000×2000 WebP, white pad, 90 quality, no metadata',
    operations: [
      {
        type: 'resize',
        width: 2000,
        height: 2000,
        mode: 'contain',
      },
      {
        type: 'pad',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        fillMode: 'color',
        color: '#ffffff',
      },
      {
        type: 'convert',
        format: 'webp',
      },
      {
        type: 'compress',
        quality: 90,
        perceptual: false,
      },
      {
        type: 'stripMetadata',
      },
    ],
  },
  {
    id: 'preset-twitter',
    name: 'Twitter / X Post',
    platform: 'twitter',
    version: 1,
    created: '2025-01-01T00:00:00.000Z',
    updatedAt: 1735689600000,
    description: '1600×900 JPEG (16:9), black letterbox pad',
    operations: [
      {
        type: 'resize',
        width: 1600,
        height: 900,
        mode: 'contain',
      },
      {
        type: 'pad',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        fillMode: 'color',
        color: '#000000',
      },
      {
        type: 'convert',
        format: 'jpeg',
      },
      {
        type: 'compress',
        quality: 82,
        perceptual: false,
      },
    ],
  },
  {
    id: 'preset-web',
    name: 'Web General',
    platform: 'web',
    version: 1,
    created: '2025-01-01T00:00:00.000Z',
    updatedAt: 1735689600000,
    description: 'Max 1920×1080 WebP, 80 quality, no metadata. Good for web pages.',
    operations: [
      {
        type: 'resize',
        width: 1920,
        height: 1080,
        mode: 'inside',
      },
      {
        type: 'convert',
        format: 'webp',
      },
      {
        type: 'compress',
        quality: 80,
        perceptual: false,
      },
      {
        type: 'stripMetadata',
      },
    ],
  },
  {
    id: 'preset-archive',
    name: 'Archive (Lossless)',
    platform: 'archive',
    version: 1,
    created: '2025-01-01T00:00:00.000Z',
    updatedAt: 1735689600000,
    description: 'Lossless PNG with metadata stripped. Preserves full quality.',
    operations: [
      {
        type: 'convert',
        format: 'png',
      },
      {
        type: 'stripMetadata',
      },
    ],
  },
] as const
