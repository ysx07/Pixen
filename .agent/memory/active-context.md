# Active Context

## Current State
**Phase 1 (Core Processing) — COMPLETE.** Single-image pipeline working end-to-end. All manual tests passing. Ready for Phase 2.

## What Was Done (Phase 1)
- Complete single-image processing pipeline: drop → build operations → live preview → download
- Worker-based architecture: wasm-vips runs off-thread, keeping UI responsive
- Operations: resize (6 modes), pad (3 fill modes), convert (4 formats), compress (with perceptual SSIM), strip metadata, rename
- Perceptual compression: 8×8-block luminance SSIM, quality search algorithm
- 3-pane responsive UI: drop zone / pipeline builder / live preview with draggable divider
- Fixed 3 critical bugs: infinite loop (useEffect deps), memory leaks (Vips heap), pad band mismatch

**Commits:** a1aba87, acafb02, b1a0101 (all Opus 4.6)

## Key Technical Decisions
- **Web Worker requirement:** wasm-vips can block for seconds; off-thread processing is essential
- **Explicit memory management:** Emscripten GC insufficient; all Vips images deleted deterministically
- **SSIM for perceptual search:** 8×8 blocks, non-overlapping, sufficient for codec tuning without full implementation
- **Typed worker protocol:** Discriminated unions enforce request/response symmetry; scales to Phase 2 batch + Phase 5 AI

## Next Phase (Phase 2 — Batch Processing)
From roadmap:
1. Multi-file input + folder drag
2. Virtualized batch queue UI
3. Sequential worker loop
4. Progress reporting + error recovery
5. Batch preview (3–5 random samples)
6. ZIP download (browser) or File System Access (Chromium)
7. Tauri: native folder picker + recursive scan

**Ready:** Batch store scaffolded, worker protocol extensible, dev tooling solid.

## Known Deferred Items
- Drag-to-reorder ops → Phase 6 (arrow buttons sufficient for MVP)
- SSIM tuning (target 0.95, step 5) → may expose in app-settings if users request
- Worker cancellation mid-pipeline → Phase 2 (plumbing in place, needs checkpoints)
- Vite dual-bundle of vips-es6 → Phase 6 bundle audit
