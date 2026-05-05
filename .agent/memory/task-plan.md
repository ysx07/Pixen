# Task Plan

## Current Phase
Phase 2: Batch Processing — **complete** (pending user manual-test sign-off)

## Tasks

### Setup
- [x] Install `fflate` + `@tanstack/react-virtual`

### Input
- [x] Upgrade `DropZone` — multi-file + folder (`webkitdirectory`), emit `File[]`, filter images

### Processing
- [x] `useBatchProcessor` hook — sequential `runPipeline()` loop, `AbortController` cancellation, updates batch store
- [x] "Keep original names" checkbox — when checked, bypass Rename op, update extension from output format

### UI — Batch Queue
- [x] `BatchQueue.tsx` — virtualized list (`@tanstack/react-virtual`), per-item: name, status icon, progress bar, error
- [x] `BatchControls.tsx` — overall progress bar, Run / Cancel buttons, sample preview trigger

### UI — Batch Sample Preview (Modal)
- [x] `BatchSamplePreview.tsx` — modal overlay, 3 random items, before/after per sample, "Run full batch" | "Back" actions

### Output
- [x] `src/utils/zip-download.ts` — collect output `ArrayBuffer`s, bundle via `fflate`, trigger download
- [x] `src/utils/fs-access.ts` — `window.showDirectoryPicker()` wrapper, ZIP fallback when unsupported
- [x] Output buttons — "Save to folder" + "Download ZIP" shown side-by-side after batch completes

### App wiring
- [x] `App.tsx` — mode switch (single vs batch), batch layout (pipeline left, queue+controls right)

### Quality
- [x] Type-check + lint + build green

## Decisions
- Tauri native folder picker → deferred to Phase 7
- Batch preview = modal overlay (not inline)
- Output naming = "Keep original names" checkbox (default on), bypasses Rename op, updates ext from format
- File System Access + ZIP = equal side-by-side options
- Cancellation = stops after current item; in-progress item runs to completion

## Awaiting
- Manual test checklist sign-off by user.
