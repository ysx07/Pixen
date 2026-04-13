# Known Issues

<!-- Track known bugs, workarounds, and tech debt here -->

| Issue | Severity | Workaround | Planned Fix |
|-------|----------|-----------|-------------|
| Pipeline reorder is arrow-button only (no drag) | Low | Use ↑/↓ buttons on each op | Phase 6 polish — add @dnd-kit drag reorder |
| SSIM target (0.97) and quality step (5) are hard-coded in worker | Low | Edit `perceptualSearch` in `src/workers/processing-worker.ts` | Expose in `app-settings` if users request it |
| Worker cannot cancel mid-pipeline (sequential ops blocking) | Medium | Debounce prevents most redundant work on preview | Phase 2 — needs cooperative cancellation checkpoints |
| `vips-es6.js` is bundled into both main and worker chunks by Vite | Low | Main chunk never executes — harmless cost | Audit in Phase 6 performance pass |
| wasm-vips emits `eval` warnings during build | Cosmetic | Expected — internal to Emscripten glue | None — wasm-vips upstream |
| Compress op on PNG is silently ignored (PNG is lossless) | Low | User sees `q` absent in delta display for PNG output | Could add UI hint in PipelineBuilder |
