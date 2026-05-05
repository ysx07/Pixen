# Phase 2 Complete: Batch Processing

**Date Completed:** 2026-05-05
**Agent(s) Used:** Claude Code / Sonnet 4.6

## Objectives (from Roadmap)

- [x] Multi-file and folder input — ✅ Done
- [x] Batch queue UI: virtualized list, status per item — ✅ Done
- [x] Sequential processing loop in worker (one image at a time) — ✅ Done
- [x] Overall progress bar + per-item indicators — ✅ Done
- [x] Error handling: failed items don't stop the batch — ✅ Done
- [x] Batch preview: apply to 3 random samples before full run — ✅ Done (modal)
- [x] Cancel mid-batch — ✅ Done
- [x] Download all as ZIP (browser fallback output) — ✅ Done (`fflate`)
- [x] File System Access API integration for direct folder output (Chromium) — ✅ Done
- [ ] Tauri: native folder picker and output, recursive input traversal — ⏭️ Deferred to Phase 7

## What Was Implemented

**Mode switching:** Dropping a single file keeps Phase 1 single-image mode unchanged. Dropping 2+ files or a folder automatically switches to batch mode. "Clear & start over" returns to single mode.

**Multi-file input:** `DropZone` now accepts multiple files via `<input multiple>`, a folder via `webkitdirectory`, and drag-drop of entire folder trees via the `FileSystem Entry API` (recursive directory reader). All inputs are filtered to images only before reaching the store.

**Batch queue:** `BatchQueue` renders the item list with `@tanstack/react-virtual`, keeping scrolling smooth at 200–500 items. Each row shows a status icon (○ pending / ◐ processing / ● done / ✕ error), a live progress bar while processing, and an inline error message for failures. Pending items can be individually removed.

**Processing loop:** `useBatchProcessor` runs `runPipeline()` calls sequentially, one item at a time, against the shared worker. An `AbortController` is checked between items — the current item always completes before the batch stops. Failed items are marked with their error message and the loop continues to the next item.

**"Keep original filenames" checkbox:** Default on. When checked, the Rename operation in the pipeline is bypassed and the output filename is the original basename with the format extension replaced (e.g., `photo.jpg` → `photo.webp` after a Convert op). When unchecked, the pipeline's Rename op is applied as-is.

**Sample preview modal:** "Preview 3 samples" picks 3 random items from the queue, runs them through the pipeline concurrently (concurrent is fine for previews — they're small, independent jobs), and shows before/after pairs in a modal overlay. The "Run full batch" button is disabled until all 3 samples complete. Escape or backdrop click closes the modal without running the batch.

**Output:** After the batch completes, "Save to folder" (`window.showDirectoryPicker()`) and "Download ZIP" (`fflate` level 0) appear side by side. The "Save to folder" button is hidden on browsers that don't support the File System Access API. ZIP compression level 0 is intentional — images are already compressed and re-compressing wastes CPU.

**Overall progress:** `BatchControls` shows a live `X of Y done` counter and a filled progress bar. Error count is shown separately in red when non-zero.

## Key Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/DropZone.tsx` | Modified | Multi-file + folder input, `File[]` output, `webkitdirectory` + FileSystem Entry API |
| `src/hooks/useBatchProcessor.ts` | Created | Sequential batch loop, `AbortController` cancellation, "keep original names" logic |
| `src/components/BatchQueue.tsx` | Created | Virtualized item list with per-item status, progress bar, error display |
| `src/components/BatchControls.tsx` | Created | Overall progress, Run/Cancel/output buttons, keep-names checkbox |
| `src/components/BatchSamplePreview.tsx` | Created | Modal overlay with 3-sample before/after grid |
| `src/utils/zip-download.ts` | Created | `fflate`-based ZIP bundler with filename deduplication |
| `src/utils/fs-access.ts` | Created | `showDirectoryPicker()` wrapper with ZIP fallback |
| `src/App.tsx` | Modified | Mode switch (single vs batch), batch layout wiring |
| `package.json` | Modified | Added `fflate`, `@tanstack/react-virtual` |

## Decisions Made During This Phase

| Decision | Rationale | ADR Link |
|----------|-----------|----------|
| Sample preview as modal, not inline | Keeps the queue visible and avoids layout reflow; modal is dismissible without side effects | — |
| "Keep original names" as a checkbox (default on) | Batch pipelines typically apply the same Rename pattern to all files, producing collisions; preserving original names is the safer default | — |
| "Save to folder" and "Download ZIP" as equal options | Different users prefer different workflows; feature-detecting File System Access hides the folder button on unsupported browsers rather than showing a disabled state | — |
| `fflate` at level 0 (no compression) | Images are already compressed; level 0 just archives them into a ZIP container without wasting CPU on a second compression pass | — |
| Sample previews run concurrently | 3 small jobs; concurrency here is fine and makes the modal feel fast. Full batch is still sequential to avoid wasm-vips memory pressure | — |
| Tauri folder picker deferred to Phase 7 | Phase 7 is the dedicated desktop phase. Implementing Tauri IPC now would add scope without user-facing benefit in the browser build | — |
| Cancellation stops between items | Cooperative cancellation inside the wasm-vips pipeline would require checkpoints that don't exist yet. Stopping between items is safe and predictable | — |

## Testing Summary

- **Automated Tests Added:** 0 — Phase 2 is primarily UI/integration work; unit tests for `useBatchProcessor` and `zip-download` are deferred to a test pass
- **Automated Tests Passing:** N/A
- **Manual Tests Performed:**
  - [x] Drop single image → single-image mode unchanged ✅ Pass
  - [x] Drop 2+ images → batch mode, queue populates ✅ Pass
  - [x] Drop folder → all images collected recursively ✅ Pass
  - [x] Build pipeline → "Preview 3 samples" → modal opens with before/after ✅ Pass
  - [x] "Run full batch" from modal → all items process sequentially ✅ Pass
  - [x] Per-item progress bars animate during processing ✅ Pass
  - [x] Cancel mid-batch → current item finishes, remaining stay pending ✅ Pass
  - [x] Failed item error shown inline, batch continues to next item ✅ Pass
  - [x] "Download ZIP" triggers download with correct filenames ✅ Pass
  - [x] "Keep original names" off → rename op applied ✅ Pass
  - [x] "Keep original names" on → original basename preserved, ext updated ✅ Pass
  - [x] "Clear & start over" → returns to single-image drop zone ✅ Pass
- **Edge Cases Verified:** Empty pipeline disables "Preview 3 samples"; batches smaller than 3 items show all items as samples; filename collisions in ZIP are deduplicated with `-1`, `-2` suffixes

## Deviations from Roadmap

- **Tauri folder input** — Deferred to Phase 7 as planned (noted in roadmap as a Phase 7 concern).
- **Virtualized list** — Implemented as planned with `@tanstack/react-virtual` rather than a custom windowing approach.
- **No new worker message types** — The existing `runPipeline` protocol was sufficient for batch; no `runBatch` worker message was needed. The batch loop runs in the main thread, calling the worker per-item.

## Known Issues / Tech Debt

| Issue | Severity | Planned Resolution |
|-------|----------|-------------------|
| No unit tests for `useBatchProcessor` or `zip-download` | Low | Phase 6 test pass |
| `react-hooks/incompatible-library` lint suppression on `useVirtualizer` | Cosmetic | TanStack Virtual upstream — suppress is correct, revisit if React Compiler is adopted |
| Worker cancellation mid-pipeline still not cooperative | Medium | Phase 5 (AI ops need it more urgently) |
| Sample previews run concurrently — if wasm-vips is under memory pressure with large images, 3 concurrent jobs could OOM | Low | Could serialize if reports emerge; no issues seen in testing |
| "Save to folder" writes files in parallel (`Promise.all`) — on very large batches this could overwhelm the browser's file writer | Low | Serialize writes if issues emerge in Phase 6 polish |

## Handoff Notes for Phase 3 (Organization & Grouping)

**What's working and stable:**
- `useBatchProcessor` — solid, reusable. Phase 3's organize step slots in after the processing loop, taking the `completedOutputs: ZipEntry[]` array and applying grouping rules before output.
- `useBatchStore` — `items` array has `outputFile: File` per item after processing. Organization can read filenames and EXIF from these.
- Output path (`fs-access.ts`, `zip-download.ts`) — Phase 3 will need to write to named subfolders. `saveToFolder` currently writes all files flat; it will need to accept a `(fileName) => subfolderName` mapper or a pre-grouped structure.

**Phase 3 entry points to modify:**
- `src/utils/fs-access.ts` → extend `saveToFolder` to accept a folder-grouped structure `{ [subfolder: string]: ZipEntry[] }`
- `src/utils/zip-download.ts` → extend `downloadZip` similarly — `fflate` supports paths with `/` in filenames natively (e.g., `"2024-03/photo.jpg"`)
- `src/components/BatchControls.tsx` → the output buttons section will grow to show the organization preview ("8.4 GB → 5 folders of ~2 GB") before running

**EXIF note:** Phase 3 needs EXIF date extraction for "group by date". No EXIF library is installed yet — `exifr` is the recommended lightweight option (tree-shakeable, handles JPEG/HEIC/TIFF).

**Batch store already has what Phase 3 needs:** `BatchItem.outputFile` holds the processed `File` object. EXIF reads should be done on the *original* `BatchItem.file` (not the output) to get capture date rather than processing date.
