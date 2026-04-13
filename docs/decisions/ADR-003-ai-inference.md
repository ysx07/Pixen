---
status: accepted
created: 2025-04-13
---

# ADR-003: AI Inference Engine — ONNX Runtime Web

## Decision

Use **ONNX Runtime Web** for AI inference (background removal, upscaling). Post-MVP feature.

## Context

Post-MVP, Pixen will support background removal and image upscaling via AI models. These require:
- Fast inference in the browser (100ms - 15s depending on model)
- Automatic fallback from GPU to CPU
- Model caching to avoid re-downloads
- Clear performance expectations across browsers

## Rationale

### ONNX Runtime Web chosen because:

1. **Production-Ready:** Used in production vision apps since 2023
2. **Auto-Backend Detection:** Detects and uses best available compute (WebGPU → WASM SIMD → WASM single-thread)
3. **Model Caching:** IndexedDB caching eliminates re-download on subsequent runs
4. **Graceful Degradation:** Falls back cleanly if GPU unavailable
5. **Ecosystem:** ONNX is the open standard for ML models (vendor-neutral)
6. **Performance:** WebGPU backend matches native GPU performance in interactive scenarios

### Backend Priority Chain

```
WebGPU (Chrome/Edge, ~85% of users)
  → WASM SIMD + Threads (~remaining desktop)
  → WASM single-thread (iOS Safari, legacy)
  → Degrade with warning (unsupported browsers)
```

### Alternatives Considered

#### TensorFlow.js
- **Pros:** Mature, large ecosystem
- **Cons:** Larger bundle, less flexible backend selection, slower inference than ONNX
- **Verdict:** ONNX Runtime is more purpose-built for this use case

#### ml5.js
- **Pros:** Simpler API
- **Cons:** Abstracts away backend control, limited model selection
- **Verdict:** Need explicit backend control for our performance expectations

#### Native Web GPU / WebNN
- **Pros:** Native browser APIs
- **Cons:** Fragmented, early-stage, no standard model format yet
- **Verdict:** ONNX Runtime provides a stable abstraction layer

## Performance Expectations (from roadmap)

Communicate these clearly to users:

| Operation | WebGPU | WASM SIMD | WASM Single-Thread |
|-----------|--------|-----------|-------------------|
| Background Removal | 100-500ms | 3-8s | >30s (warn) |
| 2x Upscale | 2-5s | 10-20s | >60s (warn) |
| 4x Upscale | 5-15s | 30-60s | >120s (warn) |

**Key constraint:** Sequential queue only. Never parallel AI operations (VRAM safety).

## Model Management

### Caching Strategy
1. Download model on first use
2. Store in IndexedDB (persistent across sessions)
3. Check cache before download
4. Implement version checking (re-download if model updates)

### Supported Models (Post-MVP)
- Background removal: RMBG (ONNX)
- Upscaling: Real-ESRGAN (2x, 4x)

### Model Sources
- Host models on CDN or embed in app (user-controlled via env var)
- GitHub Releases as fallback
- Individual model size: 50-200 MB (download once, cache forever)

## Consequences

### Positive
- GPU acceleration for modern browsers
- Graceful CPU fallback for older browsers
- Model caching eliminates re-downloads
- Industry-standard model format (vendor-neutral)

### Negative
- Model binary size is large (50-200 MB per model, though cached)
- GPU inference time still perceptible (100ms-15s depending on model)
- First-time users experience initial download delay
- Sequential queue constraint limits batch throughput

## Implementation Notes

1. Lazy-load ONNX Runtime (only on first AI operation)
2. Show backend info on app init: "Using WebGPU" or "GPU unavailable, using CPU"
3. Implement progress callbacks for long operations
4. Cache models in IndexedDB with version tracking
5. Implement batch queue with sequential processing
6. Show time estimate before running batch with AI ops
7. Allow user to cancel long-running inference

## Related ADRs

- ADR-001: Frontend Framework (React for complex async UI)
- ADR-004: Desktop Framework (Tauri can offload heavy AI to native Rust if needed)
