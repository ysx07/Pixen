# Active Context

## Current State
**Phase 3 (Organization & Grouping) — IMPLEMENTATION COMPLETE.** Type-check, lint, and build all pass. Awaiting manual test sign-off before commit.

## What Was Done (Phase 3)
- Installed `exifr@7.1.3` for EXIF date extraction
- Updated `src/types/index.ts`: aligned `OrganizeConfig` with spec §7.3 (`mode`, `date`, `namePattern`, `sizeLimit`, `combined` shape)
- Created `src/stores/organize.ts` — Zustand store holding `OrganizeConfig` + all setters; defaults to mode=none, 2GB size limit, month granularity
- Created `src/utils/group-by-date.ts` — async EXIF read (exifr) → date bins by year/month/day
- Created `src/utils/group-by-pattern.ts` — regex capture group 1 → folder name, fallback for no-match
- Created `src/utils/group-by-size.ts` — bin-packing: accumulate output sizes, roll to new bin at limit
- Created `src/utils/organize.ts` — dispatcher for all 5 modes (none/date/name_pattern/size_limit/combined); `toGroupedZipEntries()` async converter
- Extended `src/utils/zip-download.ts` — added `downloadGroupedZip()` with folder-prefixed paths
- Extended `src/utils/fs-access.ts` — added `saveGroupedToFolder()` with nested `getDirectoryHandle` for multi-segment paths
- Created `src/components/OrganizePanel.tsx` — mode picker + config form (granularity, date source, regex, size limit presets + custom)
- Created `src/components/OrganizePreview.tsx` — post-batch summary: folder name / file count / size per row
- Modified `src/components/PipelineBuilder.tsx` — accepts `showOrganize` prop; renders OrganizePanel as terminal section below ops list (batch mode only)
- Modified `src/components/BatchControls.tsx` — accepts `organizeGroups?: GroupedZipEntries | null`; shows "Save organized" / "Download ZIP" when groups present, falls back to flat output buttons
- Modified `src/App.tsx` — organize effect runs post-batch (using `completedCount` as stable dep); OrganizePreview shown in left pane; `organizeZipEntries` passed to BatchControls

## Key Design Decisions (Phase 3)
- OrganizeConfig is NOT a pipeline operation — it lives in its own store
- Combined mode = date-first, then size-limit per date group (origin story scenario)
- Single-level folder paths only (e.g. `2024-03`, not `2024/2024-03`)
- OrganizePreview shows AFTER batch completes (uses real output file sizes, more accurate)
- EXIF reads are lazy (at organize time, not on file add)

## What Was Done (Phase 2)
- Multi-file + folder input via DropZone (FileSystem Entry API, `webkitdirectory`, multi-select)
- `useBatchProcessor` hook — sequential worker loop, `AbortController` cancellation, keep-original-names logic
- `BatchQueue` — virtualized list (`@tanstack/react-virtual`), per-item status/progress/error
- `BatchControls` — overall progress bar, run/cancel/output buttons, "Keep original names" checkbox
- `BatchSamplePreview` — modal with 3 random before/after samples before committing to full run
- `zip-download.ts` — `fflate` level-0 ZIP bundler with filename deduplication
- `fs-access.ts` — `showDirectoryPicker()` wrapper + ZIP fallback
- App mode switch: single-image (1 file) ↔ batch (2+ files) automatic

## What Was Done (Phase 1)
- Complete single-image processing pipeline: drop → build operations → live preview → download
- Worker-based architecture: wasm-vips runs off-thread, keeping UI responsive
- Operations: resize (6 modes), pad (3 fill modes), convert (4 formats), compress (with perceptual SSIM), strip metadata, rename
- Perceptual compression: 8×8-block luminance SSIM, quality search algorithm
- 3-pane responsive UI: drop zone / pipeline builder / live preview with draggable divider

## Known Deferred Items
- Drag-to-reorder ops → Phase 6
- SSIM tuning → may expose in app-settings if users request
- Worker cooperative cancellation mid-pipeline → Phase 5
- Vite dual-bundle of vips-es6 → Phase 6 bundle audit
- Tauri native folder picker → Phase 7
- Unit tests for all utilities → Phase 6
- `saveToFolder` / `saveGroupedToFolder` parallel writes may need serialization for very large batches → Phase 6
