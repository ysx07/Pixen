# Active Context

## Current State
**Phase 4 (Recipe System) — IMPLEMENTATION COMPLETE.** Type-check, lint, and build all pass. Awaiting manual test sign-off before commit.

## What Was Done (Phase 4)
- Rewrote `src/stores/recipes.ts` — Zustand `persist` middleware (replaces manual localStorage), `crypto.randomUUID()` IDs, aligned `Recipe` interface to spec (`version`, `created: string ISO 8601`, `organize?`), fixed 7 bugs from scaffold, added `duplicateRecipe` + `loadRecipeIntoPipeline`
- Created `src/utils/recipe-schema.ts` — dependency-free structural validator for recipe JSON; used on import and URL-param load; returns `{ valid, errors[] }`
- Created `src/utils/recipe-presets.ts` — 5 read-only presets (Instagram 1:1, Shopify Product, Twitter Post, Web General, Archive) using `pipeline.ts` discriminated union; stable `preset-*` IDs never saved to localStorage
- Created `src/components/RecipeCard.tsx` — compact card: name, platform badge, op summary (3 ops + overflow), creation date; Load/Duplicate/Export/Share/Delete actions; two-click delete confirmation
- Created `src/components/RecipeLibrary.tsx` — inline toggle panel inside PipelineBuilder; "Built-in" + "My Recipes" sections; "Save current" inline form; file import; 5s auto-clearing error toasts
- Modified `src/components/PipelineBuilder.tsx` — `view: 'pipeline' | 'library'` state; "Recipes" button in header; conditional render of RecipeLibrary vs ops list
- Modified `src/App.tsx` — URL `?recipe=<btoa>` mount effect; recipe imported + loaded into pipeline; URL cleaned with `history.replaceState`

## Key Design Decisions (Phase 4)
- RecipeLibrary as inline toggle view (no modals — consistent with app's conditional-render convention)
- Zustand `persist` middleware over manual localStorage (eliminates 3 bug-prone manual functions)
- Store-local `Recipe` type is superset of `types/index.ts` (avoids inverting the dependency direction)
- `btoa(encodeURIComponent(json))` for URL encoding (handles non-ASCII recipe names)
- Preset IDs prefixed `preset-` to route export/share inline without going through the store
- `loadRecipeIntoPipeline` as a store action (keeps cross-store coordination in one place)

## What Was Done (Phase 3)
- Installed `exifr@7.1.3` for EXIF date extraction
- Updated `src/types/index.ts`: aligned `OrganizeConfig` with spec §7.3
- Created `src/stores/organize.ts` — Zustand store holding `OrganizeConfig` + all setters
- Created `src/utils/group-by-date.ts`, `group-by-pattern.ts`, `group-by-size.ts` — grouping algorithms
- Created `src/utils/organize.ts` — dispatcher for all 5 modes; `toGroupedZipEntries()` converter
- Extended `src/utils/zip-download.ts` and `fs-access.ts` — grouped output support
- Created `src/components/OrganizePanel.tsx` + `OrganizePreview.tsx`
- Modified `PipelineBuilder`, `BatchControls`, `App.tsx` — organize wiring

## What Was Done (Phase 2)
- Multi-file + folder input via DropZone
- `useBatchProcessor` hook — sequential worker loop, `AbortController` cancellation
- `BatchQueue` — virtualized list, per-item status/progress/error
- `BatchControls`, `BatchSamplePreview`, `zip-download.ts`, `fs-access.ts`

## What Was Done (Phase 1)
- Complete single-image processing pipeline: resize/pad/convert/compress/stripMetadata/rename
- Worker-based architecture: wasm-vips off-thread
- Perceptual SSIM compression
- 3-pane UI with live before/after preview

## What's Next
**Phase 5: AI Features — Very High complexity. Recommended model: Opus 4.6.**

Key tasks:
- ONNX Runtime Web integration in a new `ai-worker.ts` (separate from vips worker)
- Background removal model (decide RMBG-1.4 vs mediapipe at start)
- Model download + progress + IndexedDB caching
- WebGPU → WASM fallback chain
- Spatial tiling for upscaling (mandatory)
- Sequential AI queue with cancel
- Hardware capability detection
- `background-removal` and `upscale` ops as working pipeline steps (currently "(P5)" placeholders)

## Known Deferred Items
- Drag-to-reorder ops → Phase 6
- SSIM tuning → expose in app-settings if users request
- Worker cooperative cancellation mid-pipeline → Phase 5 (adds cancel checkpoints)
- Vite dual-bundle of vips-es6 → Phase 6 bundle audit
- Tauri native folder picker → Phase 7
- Unit tests for all utilities → Phase 6
- `saveToFolder` parallel writes serialization → Phase 6 if needed
- "Clicking Recipes leaves `adding: true`" bug → one-line fix: `setAdding(false)` when switching view
- Recipe system unit tests → Phase 6
