# Active Context

## Current State
**Phase 2 (Batch Processing) — COMPLETE.** All manual tests passing. Ready for Phase 3.

## What Was Done (Phase 2)
- Multi-file + folder input via DropZone (FileSystem Entry API, `webkitdirectory`, multi-select)
- `useBatchProcessor` hook — sequential worker loop, `AbortController` cancellation, keep-original-names logic
- `BatchQueue` — virtualized list (`@tanstack/react-virtual`), per-item status/progress/error
- `BatchControls` — overall progress bar, run/cancel/output buttons, "Keep original names" checkbox
- `BatchSamplePreview` — modal with 3 random before/after samples before committing to full run
- `zip-download.ts` — `fflate` level-0 ZIP bundler with filename deduplication
- `fs-access.ts` — `showDirectoryPicker()` wrapper + ZIP fallback
- App mode switch: single-image (1 file) ↔ batch (2+ files) automatic

**Commits:** Phase 2 — pending commit

## What Was Done (Phase 1)
- Complete single-image processing pipeline: drop → build operations → live preview → download
- Worker-based architecture: wasm-vips runs off-thread, keeping UI responsive
- Operations: resize (6 modes), pad (3 fill modes), convert (4 formats), compress (with perceptual SSIM), strip metadata, rename
- Perceptual compression: 8×8-block luminance SSIM, quality search algorithm
- 3-pane responsive UI: drop zone / pipeline builder / live preview with draggable divider

## Next Phase (Phase 3 — Organization & Grouping)
From roadmap:
1. Organize step as terminal pipeline node
2. Group by date: EXIF extraction, date-based folder hierarchy, configurable pattern
3. Group by size limit: algorithm to pack files into N-GB folders
4. Group by filename pattern: prefix match + regex
5. Combined mode: date-then-size
6. Preview panel: "Your 8.4GB library → 5 folders of ~2GB"
7. Output folder structure visualization before running
8. Named subfolders in ZIP output + named subfolders on disk (File System Access)

**Key entry points for Phase 3:**
- Extend `src/utils/fs-access.ts` → `saveToFolder` to accept grouped structure `{ [subfolder: string]: ZipEntry[] }`
- Extend `src/utils/zip-download.ts` → `downloadZip` with path-prefixed filenames (fflate supports `/` in names natively)
- Add `exifr` for EXIF date extraction (install at Phase 3 start)
- EXIF reads should target `BatchItem.file` (original), not `outputFile`

## Known Deferred Items
- Drag-to-reorder ops → Phase 6
- SSIM tuning → may expose in app-settings if users request
- Worker cooperative cancellation mid-pipeline → Phase 5
- Vite dual-bundle of vips-es6 → Phase 6 bundle audit
- Tauri native folder picker → Phase 7
- Unit tests for `useBatchProcessor` + `zip-download` → Phase 6
- `saveToFolder` parallel writes may need serialization for very large batches → Phase 6
