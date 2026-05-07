# Task Plan

## Current Phase
Phase 6: Testing & Optimization — **IN PROGRESS**

---

## Phase 5: AI Features (COMPLETE)

**Goal:** Background removal and upscaling running client-side with proper UX.

**Complexity:** Very High — **Recommended model: Opus 4.6**

**Exit criteria:** A user can add background removal to their pipeline, see the model download once with progress, and process a batch of 20 images with clear per-image progress. On a device without WebGPU, the fallback path works with an honest timing warning.

---

### Tasks

#### Infrastructure
- [x] Install `onnxruntime-web`
- [x] Create `src/workers/ai-worker.ts` — ONNX InferenceSession lifecycle, message handling
- [x] Extend `src/workers/protocol.ts` — AI worker message types (load model, run inference, progress, cancel)
- [x] `src/hooks/useAiPipelineRunner.ts` — orchestrator for AI + VIPS pipeline segments

#### Model download & caching
- [x] IndexedDB read/write for ONNX model ArrayBuffers; key by model name + version
- [x] Download-with-progress UI: "Downloading model..." inline in operation editor
- [x] "This only happens once" messaging

#### Background removal
- [x] Select model: RMBG-1.4
- [x] Implement inference in `ai-worker.ts`: load model → preprocess → run → postprocess → composite
- [x] `OperationEditor` case for `background-removal`
- [x] Sequential AI job queue — never run two ONNX sessions in parallel
- [x] Cancel support — segment-level cancellation

#### Upscaling
- [x] Model: Real-ESRGAN general x4 v3
- [x] Spatial tiling — 256px tiles with feathered seams
- [x] `OperationEditor` case for `upscale`: scale factor picker (2× / 4×)

#### Hardware detection
- [x] Detect WebGPU availability
- [x] Detect WASM SIMD support
- [x] WebGPU → WASM fallback chain: attempt WebGPU, fallback to WASM on kernel error

#### Verification
- [x] **Verify Upscale**: Tested with `small.png`, confirmed tiling and fallback.
- [x] **Verify Sample Preview**: Tested batch preview modal with AI ops.
- [x] **Final Sign-off**: Created `PHASE_5_COMPLETE.md`.

---

## Phase 6: Testing & Optimization

**Goal:** Ensure production stability and polish performance.

**Tasks:**
- [ ] **Unit Tests**:
    - [ ] `src/utils/vips-ops.ts` — verify image math
    - [ ] `src/utils/ai-tiling.ts` — verify tile splitting/merging logic
    - [ ] `src/hooks/useBatchProcessor.ts` — verify orchestration logic
- [ ] **Folder Picker**:
    - [ ] Recursive file discovery
    - [ ] Improved ingestion performance for 100+ images
- [ ] **UI Polish**:
    - [ ] Drag-to-reorder for operations in the pipeline
    - [ ] Custom scrollbars for the batch queue
    - [ ] Responsive fixes for small viewports
- [ ] **Bundle Optimization**:
    - [ ] Code splitting for ONNX models
    - [ ] Analysis of `wasm-vips` bundle size
