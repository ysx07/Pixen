# Known Issues

<!-- Track known bugs, workarounds, and tech debt here -->

| Issue | Severity | Workaround | Planned Fix |
|-------|----------|-----------|-------------|
| Pipeline reorder is arrow-button only (no drag) | Low | Use ↑/↓ buttons on each op | Phase 6 polish — add @dnd-kit drag reorder |
| SSIM target (0.97) and quality step (5) are hard-coded in worker | Low | Edit `perceptualSearch` in `src/workers/processing-worker.ts` | Expose in `app-settings` if users request it |
| Worker cannot cancel mid-pipeline (sequential ops blocking) | Medium | Cancellation stops between items; debounce prevents redundant preview work | Phase 5 — needs cooperative cancellation checkpoints |
| `vips-es6.js` is bundled into both main and worker chunks by Vite | Low | Main chunk never executes — harmless cost | Audit in Phase 6 performance pass |
| wasm-vips emits `eval` warnings during build | Cosmetic | Expected — internal to Emscripten glue | None — wasm-vips upstream |
| Compress op on PNG is silently ignored (PNG is lossless) | Low | User sees `q` absent in delta display for PNG output | Could add UI hint in PipelineBuilder |
| No unit tests for `useBatchProcessor` or `zip-download` | Low | Manual testing done; logic is straightforward | Phase 6 test pass |
| `react-hooks/incompatible-library` suppressed on `useVirtualizer` | Cosmetic | Suppress is correct; React Compiler not in use | Revisit if React Compiler is adopted |
| `saveToFolder` writes files in parallel — could stress browser file writer at scale | Low | No issues seen up to ~100 files in testing | Serialize writes in Phase 6 if reports emerge |
| Sample previews run concurrently — 3 jobs at once could OOM on very large images | Low | No issues in testing | Serialize if reports emerge |
| OrganizePanel has no Apply button — recomputes on every setting change | Low | Fast enough for typical batches; can feel spammy on slow devices | Add 300ms debounce or explicit Apply button in Phase 6 polish |
| No unit tests for grouping utilities (group-by-date, group-by-pattern, group-by-size) | Low | Manual testing done | Phase 6 test pass |
| exifr: files with no EXIF and no `lastModified` get epoch date (1970) as fallback | Low | Edge case (synthetic File objects); real files always have lastModified | Acceptable for MVP |
| Clicking "Recipes" while "+ Add operation" picker is open leaves `adding: true` in hidden view | Low | Picker reappears open when returning to pipeline view | Set `setAdding(false)` before switching to library view — one-line fix |
| No unit tests for `recipe-schema.ts` validator or `stores/recipes.ts` store actions | Low | Manual testing done | Phase 6 test pass |
| Share URL embeds full recipe JSON — very long pipelines (10+ ops) produce ~600–800 char URLs | Low | Acceptable for MVP | Use `CompressionStream` + base64 if needed |
| Recipe `organize?` field preserves full config but does not reset organize store to `mode: 'none'` when loading a recipe without organize | Low | User's existing organize settings are preserved on recipe load | Acceptable for MVP; add explicit reset if users request it |
