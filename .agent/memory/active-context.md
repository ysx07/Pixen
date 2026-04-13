# Active Context

## Current State
Phase 1 (Core Processing) implemented. Single-image pipeline works end-to-end: drop → build ops → live before/after preview → download.

## What Was Done (Phase 1)
- Worker protocol in `src/workers/protocol.ts` — typed messages for init, runPipeline, progress, result.
- `src/utils/wasm-vips.ts` refactored to a worker-side init helper (dynamic import, threading detection).
- `src/workers/processing-worker.ts` — real pipeline executor: resize (cover/contain/fill/inside/outside/max), pad (color/extend/mirror), convert (jpeg/png/webp/avif), compress with quality, stripMetadata, rename (tokens `{name}`, `{date}`), skip stubs for background-removal/upscale.
- `src/utils/ssim.ts` — 8×8 block SSIM on luminance; used by perceptual compression search (starts from chosen quality, decrements by 5, stops when SSIM dips below 0.97).
- `src/hooks/useProcessingWorker.ts` — singleton worker + promise-based `runPipeline` client.
- UI components: `DropZone`, `PipelineBuilder`, `OperationEditor`, `Preview` (draggable divider), `DeltaDisplay`.
- `App.tsx` rewritten to 3-pane layout with 200ms debounced auto-run on pipeline/input change.
- `type-check`, `lint`, `build` all pass. wasm bundle ~5.7MB (expected for wasm-vips).

## Next Steps
1. Phase 2: Batch Processing — multi-file queue, virtualized list, sequential execution, ZIP/File-System-Access output.
2. Deferred items from Phase 1 to revisit:
   - Drag-to-reorder pipeline steps (currently arrow buttons) — planned for **Phase 6 polish**.
   - SSIM target (0.97) and step size (5) are hard-coded — consider exposing in `app-settings` if users want to tune.
   - Worker `AbortController` wiring exists in client but worker itself does not currently honor cancellation mid-pipeline — Phase 2 needs real cancel.
   - wasm-vips double-chunking: Vite bundles `vips-es6.js` in both main and worker chunks. Main-thread chunk is only loaded if something triggers `getVips` on the main thread, which nothing does — but verify in Phase 6.
