# Task Plan

## Current Phase
Phase 4: Recipe System — **COMPLETE**
Phase 5: AI Features — **next**

---

## Phase 4 Decisions (archived)
- RecipeLibrary as inline toggle view inside PipelineBuilder (no modals)
- Zustand `persist` middleware replaces manual localStorage
- Store-local `Recipe` type (superset of `types/index.ts`) — avoids inverting dependency direction
- `btoa(encodeURIComponent(json))` for safe Unicode URL encoding
- `preset-*` ID prefix routes export/share inline without hitting the store
- `loadRecipeIntoPipeline` as a store action for cross-store coordination

---

## Phase 5: AI Features

**Goal:** Background removal and upscaling running client-side with proper UX.

**Complexity:** Very High — **Recommended model: Opus 4.6**

**Exit criteria:** A user can add background removal to their pipeline, see the model download once with progress, and process a batch of 20 images with clear per-image progress. On a device without WebGPU, the fallback path works with an honest timing warning.

---

### Decision to make FIRST (before writing code)

**Background removal model — SPEC §6.1 Option A vs B:**
- Option A: `briaai/RMBG-1.4` — 176MB ONNX model, high quality, needs download + IndexedDB cache
- Option B: `mediapipe` selfie segmentation — 2MB, lower quality, different API (not ONNX)

Evaluate VRAM requirements and WebGPU support surface for RMBG-1.4 before committing. If WebGPU is unavailable on most target devices, Option B may produce better perceived performance at lower quality.

---

### Architecture: Separate AI Worker

The existing `src/workers/processing-worker.ts` runs wasm-vips. AI ops must run in a **separate** `src/workers/ai-worker.ts` — ONNX Runtime and wasm-vips both have large WASM heaps and should not share a worker scope.

The existing worker already receives `background-removal` and `upscale` op types via the protocol — they are currently no-ops/stubs. Phase 5 routes them out of the vips worker and into the AI worker.

---

### Tasks

#### Infrastructure
- [ ] Install `onnxruntime-web` (confirm version — 1.20+ has breaking API changes)
- [ ] Create `src/workers/ai-worker.ts` — ONNX InferenceSession lifecycle, message handling
- [ ] Extend `src/workers/protocol.ts` — AI worker message types (load model, run inference, progress, cancel)
- [ ] `src/hooks/useAiWorker.ts` — hook for AI worker communication (parallel to `useProcessingWorker`)

#### Model download & caching
- [ ] `src/utils/model-cache.ts` — IndexedDB read/write for ONNX model ArrayBuffers; key by model name + version
- [ ] Download-with-progress UI: "Downloading model (47 MB)..." inline in operation editor on first use
- [ ] "This only happens once" messaging

#### Background removal
- [ ] Select model (RMBG-1.4 or mediapipe — decide at Phase 5 start)
- [ ] Implement inference in `ai-worker.ts`: load model → preprocess image → run session → postprocess mask → composite
- [ ] `OperationEditor` case for `background-removal`: model name display, threshold slider (if applicable)
- [ ] Sequential AI job queue — never run two ONNX sessions in parallel (VRAM safety)
- [ ] Cancel support — check `AbortSignal` between vips step and AI step

#### Upscaling
- [ ] Model: `realesr-general-x4v3` (~5MB) from ONNX export
- [ ] Spatial tiling — mandatory: split image into overlapping tiles, run inference per tile, stitch
- [ ] `OperationEditor` case for `upscale`: scale factor picker (2× / 4×)
- [ ] Desktop-only note in web UI for the larger 4× model (67MB `x4plus`)

#### Hardware detection
- [ ] Detect WebGPU availability on app load (`navigator.gpu !== undefined`)
- [ ] Detect WASM SIMD support
- [ ] Store detected backend in `src/stores/app-settings.ts`
- [ ] Show detected backend in UI ("Running on WebGPU" / "Running on WASM — expect slower inference")
- [ ] WebGPU → WASM fallback chain: attempt WebGPU session, catch and retry with WASM on failure

#### Pipeline integration
- [ ] `src/workers/processing-worker.ts`: intercept `background-removal` + `upscale` op types, dispatch to AI worker instead of vips
- [ ] Add cooperative cancellation checkpoint between vips step and AI step
- [ ] Progress reporting per AI op in batch (e.g., "Background removal: 3/20")

---

### Files to create
| File | Purpose |
|------|---------|
| `src/workers/ai-worker.ts` | ONNX Runtime session, model load/cache, tiling, inference |
| `src/hooks/useAiWorker.ts` | React hook for AI worker communication |
| `src/utils/model-cache.ts` | IndexedDB model caching (download once) |

### Files to modify
| File | Change |
|------|--------|
| `src/workers/processing-worker.ts` | Route AI ops to AI worker; add cancel checkpoint |
| `src/workers/protocol.ts` | Add AI worker message types |
| `src/components/OperationEditor.tsx` | Add editor panels for `background-removal` + `upscale` |
| `src/stores/app-settings.ts` | Add `detectedBackend`, `backendFallbackReason` |
| `src/App.tsx` | Hardware detection on mount; render backend badge in UI |
| `package.json` | Add `onnxruntime-web` |
