# Decisions Log

<!-- Log architectural and technical decisions here as you make them -->
<!-- For significant decisions, also create an ADR in docs/decisions/ -->

| Date | Decision | Rationale | ADR Link |
|------|----------|-----------|----------|
| 2026-05-05 | Batch loop runs in main thread, not worker | Existing worker protocol is per-file; adding a batch orchestrator to the worker would require a new message type and complicate cancellation. Main-thread loop calling `runPipeline()` sequentially is simpler and correct. | — |
| 2026-05-05 | `fflate` at compression level 0 | Images are already compressed. Re-compressing wastes CPU for no size benefit. Level 0 archives without compressing. | — |
| 2026-05-05 | Sample previews run concurrently | 3 independent small jobs. Concurrency makes the modal feel responsive. Full batch stays sequential to avoid wasm-vips memory pressure. | — |
| 2026-05-05 | "Keep original names" defaults to ON | Batch Rename op produces the same name for every file (no per-file pattern yet), causing collisions. Preserving originals is safer by default. | — |
| 2026-05-05 | Batch sample preview as modal overlay | Keeps queue visible without layout reflow. Modal is dismissible without side effects. Simpler than an inline expand. | — |
| 2026-05-05 | Tauri folder picker deferred to Phase 7 | Phase 7 is the dedicated desktop phase. No user-facing benefit in browser build. | — |
| 2026-05-05 | File System Access + ZIP as equal options | Both are valid for different users. Feature-detecting the API hides the button rather than disabling it, reducing confusion. | — |
| 2026-05-04 | wasm-vips in dedicated Web Worker | wasm-vips can block for seconds on large images. Off-thread processing is essential to keep UI responsive. | — |
| 2026-05-04 | SSIM for perceptual compression search | 8×8 non-overlapping blocks give sufficient signal for codec quality tuning without a full SSIM implementation. | — |
| 2026-05-04 | Explicit Vips image memory management | Emscripten GC is insufficient for large images processed in a loop. All `Vips.Image` objects are deleted deterministically after each operation. | — |
