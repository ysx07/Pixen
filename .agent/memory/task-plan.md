# Task Plan

## Current Phase
Phase 1: Core Processing — **complete** (pending user manual-test sign-off).

## Tasks
- [x] App shell & 3-pane layout
- [x] File drop zone
- [x] wasm-vips operations (resize/pad/convert/compress/stripMetadata/rename)
- [x] Worker pipeline executor + message protocol
- [x] Worker client hook
- [x] Pipeline builder UI (add/remove/reorder via arrows, per-op config)
- [x] Before/after preview with draggable divider
- [x] Delta display (bytes, dims, format, Δ%)
- [x] Perceptual compression via SSIM search
- [x] Progress reporting from worker
- [x] Download processed image
- [x] type-check + lint + build green

## Awaiting
- Manual test checklist sign-off by user.

## Next Phase (Phase 2 — Batch Processing)
See `docs/PROJECT_ROADMAP.md` §Phase 2. Key deps already in place: `batch` store, worker message protocol (add `runBatch` request type).
