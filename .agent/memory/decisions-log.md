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
| 2026-05-05 | RecipeLibrary as inline toggle inside PipelineBuilder | App uses no modals/overlays anywhere (Phases 1–3). Inline conditional rendering matches OrganizePanel pattern. No layout reflow, no z-index stacking. | — |
| 2026-05-05 | Zustand `persist` middleware over manual localStorage | Replaces 3 bug-prone functions (load, save, missing save-on-update) with one declarative config. Auto-hydrates on store creation — eliminates the "recipes never restore on reload" bug. | — |
| 2026-05-05 | Store-local Recipe type is superset of `types/index.ts` | `types/index.ts` uses a generic `{ type, params }` operation bag for spec portability. Working app uses a discriminated union. Making `types/index.ts` import from `stores/pipeline.ts` would invert the dependency direction. Store owns the runtime representation. | — |
| 2026-05-05 | `btoa(encodeURIComponent(json))` for URL recipe encoding | Plain `btoa` throws on non-ASCII characters. `encodeURIComponent` round-trips all Unicode through base64 safely. | — |
| 2026-05-05 | Preset IDs prefixed `preset-` for inline export routing | Presets are not in the store, so `store.exportRecipe(id)` would throw. The prefix lets RecipeLibrary detect preset cards and handle export/share directly without touching the store. No extra state needed. | — |
| 2026-05-05 | `loadRecipeIntoPipeline` as a Zustand store action | Keeps cross-store coordination (pipelineStore.clearPipeline, addOperation, organizeStore.setState) in one authoritativr place. Components call one function. Zustand cross-store access via `getState()` at runtime avoids circular module imports. | — |
| 2026-05-04 | wasm-vips in dedicated Web Worker | wasm-vips can block for seconds on large images. Off-thread processing is essential to keep UI responsive. | — |
| 2026-05-04 | SSIM for perceptual compression search | 8×8 non-overlapping blocks give sufficient signal for codec quality tuning without a full SSIM implementation. | — |
| 2026-05-04 | Explicit Vips image memory management | Emscripten GC is insufficient for large images processed in a loop. All `Vips.Image` objects are deleted deterministically after each operation. | — |
