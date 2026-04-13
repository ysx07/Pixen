# Project Roadmap

## Project Overview

**Vision:**
A fully client-side image processing and organization tool — no server, no uploads, no accounts. "Squoosh for batches, with an organizer built in."

**Target Users:**
Non-technical users who need to batch-process and organize images (resize, pad, compress, convert) and power users managing large media libraries for cloud upload or archival.

**MVP Scope:**
1. Composable processing pipeline (resize → pad → compress → convert → strip metadata → rename)
2. Real-time before/after preview with size delta
3. Batch processing (200–500 images in browser, 1000+ on desktop)
4. Image organization/grouping (by date, filename pattern, size limit)
5. File output via File System Access API (Chromium) or ZIP download (fallback)

**Tech Stack:**
React 19 + Vite + TypeScript, Tailwind CSS, Zustand, wasm-vips (processing), ONNX Runtime Web (AI inference), Tauri 2.x (desktop), Cloudflare Pages (web hosting), Hugging Face Hub (model hosting), GitHub Releases (binary distribution), Vitest + Playwright (testing), GitHub Actions (CI/CD)

---

## Phase Complexity Guide

Use this to choose the right model for each phase. Complexity is driven by algorithmic difficulty, cross-system integration risk, and how much the code must reason about non-obvious failure modes.

| Phase | Complexity | Recommended Model | Why |
|-------|------------|-------------------|-----|
| 0 — Foundation | Low | Haiku 4.5 | Config, scaffolding, CI YAML — mechanical work with no algorithmic decisions |
| 1 — Core Processing | High | Opus 4.6 | wasm-vips Web Worker architecture, perceptual compression (SSIM), real-time preview loop |
| 2 — Batch Processing | Medium | Sonnet 4.6 | Worker queue + File System Access API are tricky, but patterns are established in Phase 1 |
| 3 — Organization | Medium | Sonnet 4.6 | Size-packing algorithm and EXIF parsing need care, but scope is well-defined |
| 4 — Recipe System | Low | Haiku 4.5 | CRUD, JSON schema validation, URL encoding — no novel algorithms |
| 5 — AI Features | Very High | Opus 4.6 | ONNX + WebGPU fallback chain, spatial tiling, IndexedDB caching, sequential queue — highest risk phase |
| 6 — Polish | Medium | Sonnet 4.6 | Visual judgment and a11y require reasoning; PWA manifest is config-level |
| 7 — Desktop Binary | High | Opus 4.6 | Tauri IPC, Rust sidecar evaluation, cross-platform build pipeline |

---

## Phase 0: Foundation

**Goal:** Project skeleton, tooling, and deployment pipeline running before writing a single feature.

**Complexity:** Low — **Recommended model: Haiku 4.5**

**Exit criteria:** Visiting the deployed URL initializes wasm-vips in a Web Worker without errors. Tauri binary builds successfully.

- [ ] Initialize React + Vite + TypeScript project
- [ ] Configure Tailwind CSS with design tokens
- [ ] Set up Zustand stores (pipeline, batch, recipes, app settings)
- [ ] Integrate wasm-vips — confirm it initializes correctly with COOP/COEP headers
- [ ] Configure Cloudflare Pages deployment with correct COOP/COEP headers via `_headers` file
- [ ] Set up GitHub Actions CI (lint, type-check, build, deploy on push)
- [ ] Set up Tauri project wrapping the frontend
- [ ] Confirm Tauri builds for Windows, macOS from CI
- [ ] Set up GitHub Releases automated binary publishing on tag

---

## Phase 1: Core Processing

**Goal:** Single-image processing pipeline working end-to-end with preview.

**Complexity:** High — **Recommended model: Opus 4.6**

**Exit criteria:** A user can drop an image, build a resize → pad → compress → convert pipeline, see a live before/after preview with size delta, and download the result.

- [ ] File drop zone + file picker UI
- [ ] Pipeline builder UI: ordered list of operations with add/remove/reorder
- [ ] Implement operations via wasm-vips: resize, convert, compress, pad, strip metadata
- [ ] Real-time before/after preview with drag divider
- [ ] Delta display: input size → output size, dimension changes, format change
- [ ] Perceptual compression mode (SSIM-based)
- [ ] Web Worker communication: pipeline execution off main thread
- [ ] Progress reporting from worker to UI
- [ ] Download single processed image

---

## Phase 2: Batch Processing

**Goal:** Pipeline works on many files simultaneously.

**Complexity:** Medium — **Recommended model: Sonnet 4.6**

**Exit criteria:** A user can drop 200 images, build a pipeline, preview 3 samples, run the batch, and download the results either directly to a folder or as a ZIP.

- [ ] Multi-file and folder input
- [ ] Batch queue UI: virtualized list, status per item
- [ ] Sequential processing loop in worker (one image at a time)
- [ ] Overall progress bar + per-item indicators
- [ ] Error handling: failed items don't stop the batch
- [ ] Batch preview: apply to 3 random samples before full run
- [ ] Cancel mid-batch
- [ ] Download all as ZIP (browser fallback output)
- [ ] File System Access API integration for direct folder output (Chromium)
- [ ] Tauri: native folder picker and output, recursive input traversal

---

## Phase 3: Organization & Grouping

**Goal:** The upload-ready chunking feature — solving the cloud upload bottleneck from the origin story.

**Complexity:** Medium — **Recommended model: Sonnet 4.6**

**Exit criteria:** A user can take a flat folder of mixed-date images, group by month, split each month into 2GB chunks, and receive a folder structure ready for phased cloud upload.

- [ ] Organize step as the terminal pipeline node
- [ ] Group by date: EXIF extraction, date-based folder hierarchy, configurable pattern
- [ ] Group by size limit: algorithm to pack files into N-GB folders
- [ ] Group by filename pattern: prefix match + regex
- [ ] Combined mode: date-then-size
- [ ] Preview panel: "Your 8.4GB library → 5 folders of ~2GB"
- [ ] Output folder structure visualization before running
- [ ] Named subfolders in ZIP output (browser)
- [ ] Named subfolders directly on disk (Tauri + File System Access)

---

## Phase 4: Recipe System

**Goal:** Pipelines are reusable, saveable, and shareable.

**Complexity:** Low — **Recommended model: Haiku 4.5**

**Exit criteria:** A user can save their Instagram preset recipe, export it as JSON, and a different user can import it and run it.

- [ ] Save current pipeline as named recipe
- [ ] Recipe library UI: list, preview, load, delete, duplicate
- [ ] Built-in platform presets: Instagram, Shopify, Twitter, Web General, Archive
- [ ] Export recipe as JSON file
- [ ] Import recipe from JSON file
- [ ] Recipe JSON schema validation on import
- [ ] Encode recipe in URL query param (shareable link)
- [ ] Recipe card: shows operations at a glance, platform tag

---

## Phase 5: AI Features

**Goal:** Background removal and upscaling running client-side with proper UX.

**Complexity:** Very High — **Recommended model: Opus 4.6**

**Exit criteria:** A user can add background removal to their pipeline, see the model download once with progress, and process a batch of 20 images with clear per-image progress. On a device without WebGPU, the fallback path works with an honest timing warning.

- [ ] Integrate ONNX Runtime Web
- [ ] Background removal model (decide Option A or B at Phase 5 start)
  - [ ] Download + progress UI ("this only happens once")
  - [ ] IndexedDB caching
  - [ ] Processing in AI worker thread
  - [ ] Sequential queue with cancel
  - [ ] Performance display (detected backend + estimated time)
  - [ ] WebGPU → WASM fallback with user notification
- [ ] Upscaling model (realesr-general-x4v3, ~5MB)
  - [ ] Same infrastructure as background removal
  - [ ] Spatial tiling implementation (mandatory)
  - [ ] Desktop-only note in web UI for full model
- [ ] AI operations as pipeline steps (placed before organize step)
- [ ] Hardware capability detection on app load (report to UI)

---

## Phase 6: Polish & Portfolio Readiness

**Goal:** The app is portfolio-ready. Everything works well enough to show. Story is documented.

**Complexity:** Medium — **Recommended model: Sonnet 4.6**

**Exit criteria:** A non-technical user can land on the page, understand what the app does in 5 seconds, drag in their photos, and process them without needing any instructions.

- [ ] UI polish pass: spacing, transitions, empty states, loading states, error states
- [ ] Onboarding: 3-step first-run guide (add images → build pipeline → run)
- [ ] Keyboard shortcuts for power users
- [ ] Accessibility audit (WCAG 2.1 AA minimum)
- [ ] Performance audit: Lighthouse, WASM init time, large batch timing
- [ ] README: project story, architecture decisions, open source attributions
- [ ] Portfolio entry copy: lead with origin stories, highlight pipeline architecture and perceptual compression
- [ ] App name, logo, favicon
- [ ] PWA manifest: installable, offline support for core features
- [ ] Landing page with clear value proposition above the fold

---

## Phase 7: Desktop Binary

**Goal:** Tauri binary is published and working for the scenarios browsers can't handle.

**Complexity:** High — **Recommended model: Opus 4.6**

**Exit criteria:** A user can download and install the app on Windows and macOS, process a 5GB folder of images with full recursive traversal, and run the full-quality upscaling model.

- [ ] Audit all features that work differently in Tauri vs browser
- [ ] Native filesystem differences: recursive folder scan, watch folder (optional)
- [ ] Rust sidecar evaluation: is WebGPU in Tauri's WebView stable enough for AI ops?
- [ ] Full upscaling model (x4plus, 67MB): desktop-only, gated behind Tauri detection
- [ ] Installer build pipeline: Windows (.exe + .msi), macOS (.dmg), Linux (.AppImage)
- [ ] Auto-update support (Tauri updater plugin)
- [ ] GitHub Releases publishing automation
- [ ] Desktop-specific UI adjustments: window title bar, native menus (minimal)
