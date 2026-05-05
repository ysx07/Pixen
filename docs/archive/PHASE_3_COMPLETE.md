# Phase 3 Complete: Organization & Grouping

**Date Completed:** 2026-05-05
**Agent(s) Used:** Claude Code / Sonnet 4.6

## Objectives (from Roadmap)

- [x] Organize step as the terminal pipeline node — ✅ Done (OrganizePanel at bottom of PipelineBuilder, batch mode only)
- [x] Group by date: EXIF extraction, date-based folder hierarchy, configurable pattern — ✅ Done
- [x] Group by size limit: algorithm to pack files into N-GB folders — ✅ Done
- [x] Group by filename pattern: prefix match + regex — ✅ Done
- [x] Combined mode: date-then-size — ✅ Done
- [x] Preview panel: "Your 8.4GB library → 5 folders of ~2GB" — ✅ Done (OrganizePreview)
- [x] Output folder structure visualization before running — ✅ Done (post-batch)
- [x] Named subfolders in ZIP output (browser) — ✅ Done (`downloadGroupedZip`)
- [x] Named subfolders directly on disk (File System Access) — ✅ Done (`saveGroupedToFolder`)
- [ ] Named subfolders on disk via Tauri — ⏭️ Deferred to Phase 7

## What Was Implemented

**OrganizeConfig store:** A dedicated Zustand store (`src/stores/organize.ts`) holds organization settings separately from pipeline operations. Defaults: mode=none, granularity=month, EXIF source, 2GB size limit.

**Group by Date:** `group-by-date.ts` reads EXIF `DateTimeOriginal`/`CreateDate` via `exifr` (dynamically imported to avoid loading ~40KB unless needed), falling back to `file.lastModified`. Supports year (`2024`), month (`2024-03`), and day (`2024-03-15`) granularity. Date source is configurable: EXIF or file modification date.

**Group by Filename Pattern:** `group-by-pattern.ts` applies a user-provided regex; capture group 1 becomes the folder name. Files that don't match go into a configurable fallback folder. Invalid regex silently falls back to putting everything in the fallback.

**Group by Size Limit:** `group-by-size.ts` bin-packs files sequentially (in filename order) into bins that stay under the byte limit. Output bins are named `Batch_001`, `Batch_002`, etc. A single file larger than the limit gets its own bin. Uses output file sizes (`item.outputFile.size`) if available, falling back to input size.

**Combined mode:** `organize.ts` runs date grouping first, then for each date group that exceeds the size limit, runs a second-pass size split. Date groups that fit within the limit stay as-is (`2024-03`). Those that overflow are split into `2024-03_001`, `2024-03_002`. This is the origin story scenario: a friend with 3 months of media wanting phased uploads with date context preserved.

**Grouped ZIP output:** `downloadGroupedZip` in `zip-download.ts` prefixes each entry's filename with its folder path (`"2024-03/photo.webp"`). fflate's support for `/` in key names creates the folder hierarchy natively inside the ZIP. Deduplication is per-folder.

**Grouped folder output:** `saveGroupedToFolder` in `fs-access.ts` splits folder paths by `/` and calls `getDirectoryHandle(segment, { create: true })` recursively to create nested subdirectories. Falls back to `downloadGroupedZip` on browsers without File System Access API.

**OrganizePanel:** Config form lives at the bottom of the PipelineBuilder in batch mode (terminal section, visually separated by a divider). Includes: mode picker (5 modes), date granularity buttons, EXIF/file-date source picker, regex + fallback inputs, size limit presets (1/2/4 GB) and a custom number input.

**OrganizePreview:** Shows after batch completes when organize mode ≠ none. Displays per-folder breakdown: `2024-03/ · 47 files · 1.2 GB`. Shows a totals line and a "Computing…" spinner while EXIF reads are in flight. Appears in the left pane above the output buttons.

**BatchControls integration:** When `organizeGroups` is provided, the output buttons switch to "Save organized" / "Download ZIP" (grouped). When mode is none, the original flat buttons are shown.

## Key Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `src/stores/organize.ts` | Created | Zustand store for OrganizeConfig |
| `src/utils/group-by-date.ts` | Created | Async EXIF date grouping |
| `src/utils/group-by-pattern.ts` | Created | Regex/prefix grouping |
| `src/utils/group-by-size.ts` | Created | Bin-packing size-limit algorithm |
| `src/utils/organize.ts` | Created | Grouping dispatcher + `toGroupedZipEntries` |
| `src/components/OrganizePanel.tsx` | Created | Config form UI |
| `src/components/OrganizePreview.tsx` | Created | Post-batch folder summary |
| `src/utils/zip-download.ts` | Modified | Added `downloadGroupedZip` |
| `src/utils/fs-access.ts` | Modified | Added `saveGroupedToFolder` |
| `src/components/PipelineBuilder.tsx` | Modified | `showOrganize` prop, terminal OrganizePanel section |
| `src/components/BatchControls.tsx` | Modified | `organizeGroups` prop, grouped output buttons |
| `src/App.tsx` | Modified | Organize effect, OrganizePreview in left pane |
| `src/types/index.ts` | Modified | OrganizeConfig aligned with spec §7.3 |
| `package.json` | Modified | Added `exifr@7.1.3` |

## Decisions Made During This Phase

| Decision | Rationale |
|----------|-----------|
| OrganizeConfig in its own store, not a pipeline operation | Organize runs post-batch on all completed outputs; it's routing, not per-image processing |
| EXIF reads are lazy (at organize time, not on file add) | No wasted work if user doesn't use organize; reading EXIF on 500 files upfront would be expensive |
| exifr dynamically imported | Keeps the exifr bundle (~40KB) out of the initial load; only fetched when organize runs |
| OrganizePreview computed after batch completes | Uses real output file sizes (post-compression) for accurate size-limit previews |
| Single-level folder paths only | Simpler for both ZIP and File System Access — no nested path confusion; can be revisited in Phase 6 |
| Combined mode = date-then-size with `_001` suffix | Matches the origin story scenario exactly; keeps date context visible in folder names |
| No "Apply" button — settings apply live | Fast feedback; recompute is inexpensive for typical batch sizes. Known minor UX concern — may add debounce or explicit Apply in Phase 6 |

## Testing Summary

- **Automated Tests Added:** 0 — Phase 3 is primarily logic + UI; unit tests deferred to Phase 6 test pass
- **Manual Tests Performed (user-verified):**
  - [x] Mode "None" → flat output buttons appear, no OrganizePreview ✅
  - [x] Mode "By Date (Month)" → OrganizePreview shows month folders with file counts and sizes ✅
  - [x] Mode "By Date (Month)" + Download ZIP → ZIP contains correct subfolder structure ✅
  - [x] Mode "By Date (Month)" + Save organized → folders created on disk ✅
  - [x] Mode "By Size" → `Batch_001`, `Batch_002` folders appear at correct size boundaries ✅
  - [x] Mode "Date + Size" → date groups appear; months exceeding limit split into `_001`/`_002` ✅
  - [x] Mode "By Filename" with regex → matching groups correct, non-matching go to fallback ✅
  - [x] OrganizePreview updates live as settings change ✅
  - [x] "Clear & start over" → OrganizePreview disappears ✅

## Deviations from Roadmap

- **Tauri folder output** — Deferred to Phase 7 (dedicated desktop phase).
- **"Output folder structure visualization before running"** — Visualization runs post-batch rather than pre-batch. Pre-batch would require EXIF reads before processing and would use input sizes (inaccurate for size-limit mode after compression). Post-batch is more accurate.

## Known Issues / Tech Debt

| Issue | Severity | Planned Resolution |
|-------|----------|-------------------|
| No Apply button — organize settings apply live and recompute on every change | Low | Add debounce (300ms) or an explicit Apply button in Phase 6 polish |
| No unit tests for grouping utilities | Low | Phase 6 test pass |
| `saveGroupedToFolder` writes files in parallel per folder — may need serialization for very large batches | Low | Serialize if issues emerge in Phase 6 |
| `exifr` fallback: files with no EXIF and no `lastModified` (e.g. synthetic File objects) get epoch date | Low | Edge case; acceptable for MVP |

## Handoff Notes for Phase 4 (Recipe System)

**What's stable and reusable:**
- `OrganizeConfig` type (spec §7.3) and `useOrganizeStore` are the source of truth for grouping config — Phase 4 recipes should serialize/deserialize this directly.
- `src/types/index.ts` `Recipe` interface already has `organize?: OrganizeConfig` — Phase 4 can use it as-is.
- `usePipelineStore` operations array is the other half of a recipe — Phase 4 serializes both.

**Phase 4 entry points:**
- `src/stores/recipes.ts` already exists (scaffolded in Phase 0) — needs implementing
- `src/types/index.ts` `Recipe` interface is ready; just needs the CRUD layer
- No new worker types needed — Phase 4 is pure JSON/localStorage/import-export
