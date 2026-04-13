# Data Model

Core entities and their schemas for Pixen. See `src/types/index.ts` for TypeScript definitions.

## Core Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| **Pipeline** | Ordered sequence of image processing operations | `operations[]`, `organizeConfig?` |
| **Operation** | Single processing step (resize, pad, compress, etc.) | `type`, `params` |
| **Recipe** | Named, saved pipeline configuration | `id`, `name`, `version`, `operations[]` |
| **OrganizeConfig** | Grouping/folder structure rules | `groupingMode`, `groupingRules` |
| **BatchImage** | Single image in processing queue | `file`, `id`, `dimensions`, `size` |
| **ProcessingResult** | Output after processing one image | `processedBlob`, `dimensions`, `format`, `processingTimeMs` |

## Pipeline & Operation

```typescript
interface Pipeline {
  operations: Operation[]
  organizeConfig?: OrganizeConfig
}

interface Operation {
  type: OperationType
  params: Record<string, unknown>
}
```

### MVP Operations

- `resize` (6 modes: exact, fit, fill, cover, longest-side, percent)
- `pad` (3 fill modes: solid-color, blur, transparent)
- `convert` (JPG, PNG, WebP, AVIF)
- `compress` (quality slider OR perceptual mode)
- `strip-metadata` (EXIF, ICC profile)
- `rename` (pattern-based with tokens: `{name}`, `{index}`, `{date}`, `{width}`, `{height}`, `{format}`)

### Post-MVP Operations

- `background-removal` (AI-powered)
- `upscale` (2x, 4x, AI-powered)
- `flatten-transparency` (RGBA → RGB)

## Recipe

Named, saved, exportable pipeline configuration.

```typescript
interface Recipe {
  id: string                    // UUID
  name: string
  version: number
  created: string              // ISO 8601
  description?: string
  operations: Operation[]
  organize: {
    enabled: boolean
    groupingMode?: GroupingMode
    groupingRules?: GroupingRules
  }
}
```

### Built-in Presets

- Instagram 1:1 Grid
- Shopify Product (2000×2000)
- Twitter/X Post
- LinkedIn Banner
- Web General (WebP, perceptual compression)
- Archive (lossless PNG, preserve metadata)

## Organization Config

Grouping and folder structure rules applied after processing.

### Grouping Modes

1. **By Date:** EXIF DateTimeOriginal → file lastModified
   - Granularity: Year / Month / Day
   - Pattern: `YYYY/MM` (default)

2. **By Pattern:** Prefix match, regex capture groups, fuzzy matching
   - Example: `IMG_` → all files starting with `IMG_` grouped together
   - Example regex: `(\d{4}-\d{2}-\d{2}).*` → use date as folder name

3. **By Size Limit:** Batch files into user-defined chunks (1GB, 2GB, 4GB, custom)
   - Algorithm: Sort → accumulate until approaching limit → new subfolder
   - Naming: `Batch_001`, `Batch_002` or `2025-04_part1`, `2025-04_part2`

4. **Custom Rules:** Combine modes
   - Example: "Group by month, then split each month into 2GB chunks"

5. **None:** Flat folder, no subfolders

## Relationships

```
Pipeline
  └── Operation[] (1+ operations)
        └── params (operation-specific)

Recipe
  └── Pipeline (saved configuration)

OrganizeConfig
  └── GroupingRules (varies by mode)

BatchImage
  └── File (native browser File)

ProcessingResult
  └── Blob (processed image data)
```

## Storage Strategy

### Web (PWA)

**localStorage:**
- Saved recipes
- User preferences (format, quality, theme)
- Last used pipeline

**IndexedDB:**
- ONNX Runtime models (cached after first download)
- Processing history (optional)

### Desktop (Tauri)

**App Data Directory:**
```
~/.config/pixen/         (Linux)
~/Library/Application Support/pixen/  (macOS)
%APPDATA%\pixen\         (Windows)

├── recipes/             (user-created recipes)
├── models/              (cached ONNX models)
├── preferences.json     (user settings)
└── cache/               (temporary processing cache)
```

## Notes

- **No server:** All data stays on user's machine
- **No database:** localStorage + IndexedDB on web, file system on desktop
- **No accounts:** Pure client-side, no cloud sync
- **Recipes are portable:** Export as JSON, share with others, import via drag-drop
