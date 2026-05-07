# Phase 5 Handoff: AI Feature Implementation & Testing

**Date:** 2026-05-08
**Status:** Implementation Complete, 80% Tested
**Primary Goal:** Finalize and verify Phase 5 (AI Background Removal & Upscaling).

---

## 1. Project Context
Pixen is a high-performance image processing pipeline. Phase 5 adds AI-powered operations using **ONNX Runtime Web**. Due to memory pressure from `wasm-vips`, AI operations run in a dedicated `ai-worker.ts` to keep the heaps separate.

## 2. Key Architecture & Files

### Worker Tier
- **`src/workers/ai-worker.ts`**: The core AI runtime. 
    - Manages warmed `InferenceSession` instances.
    - Handles tiled upscaling (Real-ESRGAN) with feathered seams.
    - Handles RMBG-1.4 masking logic.
- **`src/workers/ai-protocol.ts`**: The typed message contract for worker communication.

### Hook/Utility Tier
- **`src/hooks/useAiWorker.ts`**: Singleton hook that manages the worker lifecycle and provides a promise-based `runTask` API.
- **`src/hooks/useAiPipelineRunner.ts`**: The "brain" of the execution. It partitions a pipeline into segments:
    - Non-AI ops → VIPS Worker.
    - AI ops → AI Worker.
    - Threads the output of one as the input of the next.
- **`src/utils/model-cache.ts`**: IndexedDB-backed caching for ONNX models (~90MB total assets).
- **`src/utils/model-registry.ts`**: Registry of URLs and metadata for all supported models.

### Integration
- **`src/utils/bg-removal.ts`**: Dispatcher that chooses between `@imgly/background-removal` (default) and the custom `ai-worker` path for RMBG-1.4.
- **`src/utils/upscale.ts`**: Wrapper for the upscale task.

## 3. The "Vite/WASM" Blocker (Crucial Context)
The development environment (Vite) has a conflict with `onnxruntime-web`'s dynamic loading of WebAssembly helpers (`.mjs` files). 

**Current Fix Applied:**
1. **`vite.config.ts`**: Added `onnxruntime-web` to `optimizeDeps.exclude`. This is mandatory to prevent Vite from transforming the library's internal loader.
2. **`src/workers/ai-worker.ts`**: `ort.env.wasm.wasmPaths` is set to `'/'`.
3. **`public/`**: Contains all necessary `.wasm` and `.mjs` helper files (copied from `node_modules/onnxruntime-web/dist/`).

## 4. Test Environment
I have prepared a full suite of test assets in `test-images/`:
- `portrait.png`, `product.png`: Real-world scenarios.
- `small.png`, `large.png`: For upscaling limits and tiled processing.
- `corrupt.png`: For negative testing (error boundaries).
- `.env.local`: Contains `VITE_RMBG_AVAILABLE=true` to enable advanced features for testing.

## 5. Next Steps for Successor
1. **Verify Upscale (A3)**:
   - Upload `small.png`, add `Upscale (AI) 4x`, and run.
   - It may take ~5-10 seconds for the initial model download/warm-up.
2. **Verify Sample Preview (A9)**:
   - Use the 'Preview 3 samples' button with an AI op added. Ensure 'After' images render.
3. **Final Sign-off**:
   - Once verified, update `PHASE_5_COMPLETE.md` and commit the changes.

## 6. Known Issues
- **Initialization Latency**: The first AI operation in a session is slow due to WASM compilation. This is expected.
- **Cancellation**: Cancellation works at the *segment boundary*. We cannot cancel a running ONNX inference mid-execution due to library limitations.

---
*End of Handoff*
