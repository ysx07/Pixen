# Phase 5 Manual Test Plan

Companion to [PHASE_5_COMPLETE.md](PHASE_5_COMPLETE.md). Run through this before the Phase 5 sign-off commit.

---

## Setup

```bash
# Full desktop build (all features available)
npm run dev                     # development mode
# OR
npm run build && npm run preview

# Web demo build (RMBG-1.4 stripped)
npm run build:web && npm run preview
```

All tests assume Chrome/Edge unless otherwise stated. Each section is independent.

---

## A. Desktop / Full Build

### A1. Background Removal — IS-Net (default)

- [ ] Add a portrait or product image to the queue
- [ ] Add a `Remove Background (AI)` op; leave the model dropdown on `IS-Net (default, AGPL-3.0)`
- [ ] First run: Network tab shows model fetch from `staticimgly.com/...` (~84MB total across multiple files)
- [ ] Output is a PNG with transparent background; alpha covers hair/edges reasonably
- [ ] Refresh the page and re-run: **no model fetch in Network tab** (imgly's IndexedDB cache hit)
- [ ] Open DevTools → Application → IndexedDB → look for imgly's database; confirm cached entries

### A2. Background Removal — RMBG-1.4 (advanced opt-in)

- [ ] Tick the non-commercial license checkbox; the RMBG-1.4 dropdown option becomes selectable
- [ ] Select RMBG-1.4 and run; Network tab shows fetch of `/models/rmbg-1.4-fp16.onnx` (~88MB) on first call only
- [ ] DevTools → Application → IndexedDB → `pixen-models` → `weights` → entry `rmbg-1.4-fp16` exists
- [ ] Refresh page and re-run: no second fetch
- [ ] DevTools console: ORT logs `webgpu` provider when `navigator.gpu` exists; otherwise `wasm`
- [ ] Output quality should be subjectively comparable to IS-Net; expect slight differences on hair edges
- [ ] Untick the license checkbox while RMBG-1.4 is selected → dropdown reverts to IS-Net option being usable; existing pipeline behavior is unchanged on next run

### A3. Upscaling

- [ ] Add `Upscale (AI)` op, scale `4×`, run on a small (256–512px) image
- [ ] Network: fetch of `/models/realesr-general-x4v3.onnx` (~5MB) on first call only
- [ ] Output dimensions = input × 4
- [ ] Switch to `2×` and run again: output dimensions = input × 2; faster than 4× because of the box-downsample
- [ ] Try a larger image (~1024px+): progress bar shows tile counter (`tile X/Y`); inspect output at 100% zoom — seams between tiles should not be visible
- [ ] Test edge case: image smaller than 256px (one tile) — should still work

### A4. Pipeline Order — Split AI/VIPS Stages

- [ ] **Pipeline:** `Resize → Background Removal → Compress`
  - Output is a PNG (compress's lossy path skipped because alpha is present, OR the format is dictated by a Convert op if added)
  - Confirm via output file name extension and `image/png` content-type
- [ ] **Pipeline:** `Background Removal → Resize → Convert (webp)`
  - Output is WebP at the resized dimensions
  - Alpha channel preserved (open the file in an image viewer that shows transparency)
- [ ] **Pipeline:** `Upscale 2× → Resize`
  - Output dimensions match the final Resize, not the upscaled intermediate
  - Console / progress shows sequential execution

### A5. Memory & Repeated Runs

- [ ] Run upscale on 10 images sequentially in batch mode
- [ ] DevTools → Performance Monitor: JS heap should plateau, not climb
- [ ] After batch completes: total memory < 1GB (the held ONNX session is the floor)
- [ ] Run a second 10-image batch immediately after — no model re-fetch, no slowdown for first item

### A6. Cancellation

- [ ] Start a 10-image batch with upscaling, click Cancel mid-batch
- [ ] **Expected:** Current image finishes processing; remaining items stay `pending`
- [ ] **Expected:** Cancel does NOT stop mid-`session.run()` — this is an ORT runtime limitation, documented in [src/workers/ai-worker.ts:51](../../src/workers/ai-worker.ts#L51)

### A7. Recipes Regression

- [ ] Save a recipe that includes an AI op (e.g. "Resize 1024 + Background Removal")
- [ ] Reload page; load the recipe — pipeline restored with the AI op
- [ ] Export recipe → JSON contains the AI op
- [ ] Import the same JSON in a fresh session → loads correctly

### A8. Single-image Preview Mode

- [ ] Drop an image in single-image mode
- [ ] Add a Resize op + Background Removal op
- [ ] Adjust the Resize width — preview should debounce (no stutter while typing)
- [ ] No infinite re-process loop (visible as repeated network requests for imgly model)

### A9. Sample Preview (3-image batch sample)

- [ ] In batch mode, click "Preview samples" with an AI op in the pipeline
- [ ] 3 random samples render; before/after comparison shows AI op results
- [ ] **Note:** Sample previews currently run AI ops in parallel via `Promise.all` ([App.tsx:223](../../src/App.tsx#L223)). This is a known minor inconsistency with the "sequential AI queue only" policy. Acceptable because samples are 3 images and small.

---

## B. Web Demo Build

```bash
npm run build:web && npm run preview
```

### B1. UI Gating

- [ ] Add a `Remove Background (AI)` op
- [ ] Open the model dropdown — RMBG-1.4 option shows `— desktop only` and is disabled
- [ ] The non-commercial license checkbox is hidden, replaced by an explainer panel
- [ ] IS-Net default works as in A1

### B2. Upscaling Still Works

- [ ] Add `Upscale (AI)` 4× op; run on a small image
- [ ] Network: fetch of `/models/realesr-general-x4v3.onnx` (~5MB) succeeds (same-origin)
- [ ] Output = 4× input dimensions

### B3. Defense-in-Depth: Recipe Imported from Desktop

- [ ] On the desktop build, save a recipe with `Background Removal` set to RMBG-1.4 → export to JSON
- [ ] Load that JSON in the web demo
- [ ] Run the pipeline — should silently fall back to IS-Net (no 404, no error)
- [ ] **Note:** Currently no UI surfaces this fallback. See "Known Issues" in PHASE_5_COMPLETE.md.

### B4. Build Output Sanity

- [ ] `dist/models/` contains only `realesr-general-x4v3.onnx` (~5MB)
- [ ] `dist/models/rmbg-1.4-fp16.onnx` does NOT exist
- [ ] `du -sh dist/` shows ~36MB total

---

## C. Cross-Browser Matrix (web demo)

For each browser, verify upscaling at least once. Background removal via IS-Net should also work, but IS-Net's CDN may have its own quirks.

| Browser | Backend Expected | Status |
|---|---|---|
| Chrome / Edge desktop | WebGPU | [ ] |
| Firefox desktop | WASM-SIMD-threaded (no WebGPU) | [ ] |
| Safari (macOS) | WASM-SIMD-threaded | [ ] |
| Mobile Safari | WASM single-threaded; expect 5–10× slower | [ ] |

Verify on each:
- [ ] Cross-origin isolation header present (DevTools → Application → Frames → top → "Cross-Origin Isolated: yes")
- [ ] No console errors during normal AI op execution

To confirm the active backend: in `useAiWorker`, `backend` will be `'webgpu'` or `'wasm'`. Console-log it in `App.tsx` if you want a quick check.

---

## D. Negative / Error-Path Tests

- [ ] Drop a corrupt image into a batch with AI ops → that item shows `error`, subsequent items continue
- [ ] Disconnect network mid-fetch of the RMBG model on first run → fetch fails with a clear error message; retry works after reconnect
- [ ] Manually clear the IndexedDB `pixen-models` database while the worker is running → next run re-downloads (cache miss is non-fatal)
- [ ] Add 50 images to a batch with upscaling → no out-of-memory crash; performance plateaus

---

## E. What's Explicitly NOT Tested

- ONNX inference numerical correctness against a reference run (would require a known-input fixture; deferred to Phase 6 if needed)
- Tiled-upscale seam visibility under extreme magnification (acceptable noise level not yet defined)
- Long-running session memory leak detection beyond ~50 images (not exercising the batch limits roadmap targets — 200–500 web, 1000+ desktop)
- Tauri-bundled AI inference (not yet built; blocked on Tauri scaffolding which is its own phase)

These are tracked in PHASE_5_COMPLETE.md "Known Issues" and "Handoff Notes for Phase 6".

---

## Sign-off

When all relevant boxes pass, update `.agent/memory/active-context.md` with the test sign-off date and proceed to commit. Suggested commit message:

```
feat(phase-5): AI features — hybrid bg removal, upscaling, web/desktop build modes
```
