---
name: Phase 1 Implementation Notes
description: Technical decisions, pitfalls, and lessons from Phase 1 Core Processing
type: reference
---

# Phase 1 Implementation Notes

## Critical Lessons

### Memory Management in wasm-vips
**Issue:** Every intermediate Vips.Image leaks ~MBs on Emscripten heap. After 2–3 runs, "out of memory" OOM error.
**Root:** wasm-vips doesn't auto-GC frequently enough during heavy operation sequences.
**Solution:** Explicit `.delete()` on all Vips objects, tracked in a disposables array, freed in finally block.
**For Phase 5:** AI models will require even stricter heap management. Consider pooling image buffers.

### useEffect Dependency Traps
**Issue:** Including `output` in deps → effect re-runs when output updates → re-processes forever.
**Root:** The effect *sets* output, so watching it creates a feedback loop.
**Solution:** Remove output from deps. Use `setOutput((prev) => ...)` for cleanup instead.
**Pattern:** Only depend on *inputs* (input, operations, ready), never on *outputs* you're writing.

### Pad Operation Band Mismatch
**Issue:** embed rejected [r,g,b] background on greyscale or RGBA images.
**Root:** embed's background parameter must have length matching image.bands.
**Solution:** backgroundForBands function adapts array length: 1 for grey, 3 for RGB, 4 for RGBA.
**For Phase 3:** Many other wasm-vips operations have band-count assumptions; audit them in Phase 6.

### Worker Asset Resolution
**Issue:** Vite returned index.html for vips.wasm instead of the binary — "expected magic word 00 61 73 6d".
**Root:** Emscripten tried to resolve vips.wasm relative to the bundled module; hit SPA fallback.
**Solution:** Import with `?url`, pass resolved URL to wasm-vips via locateFile hook. Exclude wasm-vips from optimizeDeps.
**Key:** wasm-vips is ESM + self-contained; pre-bundling breaks internal paths.

## Performance Tuning Opportunities

### SSIM Search Parameters
- Current: target 0.95, step 5 (quality), start from startQ - 5
- Trade-off: Higher target = smaller files, more search iterations
- Suggestion for Phase 2: Expose as user preference if batch processing reveals pain points

### Preview Debounce
- Current: 200ms
- Acceptable? Yes, for single image. Phase 2 may need adjustment when batch preview samples are being processed.

### Worker Threading Detection
- Current: check for SharedArrayBuffer
- Known fallback: single-threaded build (slower but functional)
- For Phase 6: Log threading state on init so user sees "threaded" vs "single-thread" indicator

## Architecture Decisions & Why

### Singular Worker Instance
**Why:** Reuse a single Worker across React re-renders instead of creating per-run.
**Benefit:** Worker heap persists; images can be reused or cached in Phase 2.
**Risk:** If worker crashes, need to detect and reinit. Currently no crash recovery — Phase 2 should add it.

### Discriminated Union Protocol
**Why:** Use `type` field to distinguish message kinds (init, runPipeline, progress, result, error).
**Benefit:** TypeScript enforces exhaustive matching. Scales to batch queue + multi-operation requests.
**Alternative:** Could use separate message channels, but union is simpler here.

### Deterministic Operation Order
**Why:** Apply ops in sequence, not in parallel, even though wasm-vips could theoretically parallelize.
**Benefit:** Predictable memory usage; each op frees the previous result.
**Risk:** Slower than parallel. Phase 2's batch loop will parallelize *across images*, not operations.

### No Image Caching Between Runs
**Why:** Each run loads the original file fresh, applies ops, returns output.
**Benefit:** Simple; no stale-image bugs.
**Risk:** Reloading the same file from disk is wasteful if user tweaks a single op.
**For Phase 2:** Could cache decoded input in worker to speed up multi-run preview iterations.

## Testing Gaps (for Future Phases)

1. **Unit tests for ssim.ts** — test SSIM on known-identical and known-different images
2. **Worker tests** — mock wasm-vips, verify message protocol and error handling
3. **Large image stress test** — 8K JPEG, extreme resize chains, memory stability
4. **Format coverage** — test all wasm-vips write options for jpeg/png/webp/avif
5. **Band count coverage** — greyscale, RGBA, CMYK (if libvips supports it)
6. **Browser compat** — test on Safari (File System Access fallback), Firefox (WASM single-thread)

## Code Review Checklist for Phase 2

When implementing batch processing, check:
- [ ] Worker queue maintains order (sequential, not parallel)
- [ ] Each batch item has progress tracking (0–100 %)
- [ ] Failed items don't block; batch continues
- [ ] Object URLs for preview samples are revoked before disposal
- [ ] Batch store integrates with existing pipeline/recipe stores
- [ ] Preview samples are random (use `generatePreviewIndices` in batch store)
- [ ] Cancellation signal is wired to worker (plumbing ready; needs checkpoints)

## Commit Reference

- `a1aba87`: Initial Phase 1 implementation (all 12 tasks)
- `acafb02`: wasm.wasm asset resolution (locateFile + Vite ?url)
- `b1a0101`: Memory leak + infinite loop + pad band fixes (critical for stability)

All by Opus 4.6.
