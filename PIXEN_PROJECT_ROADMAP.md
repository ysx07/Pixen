# PROJECT ROADMAP
## Pixen — Client-Side Image Processing & Organization Tool

> **For implementation agents:** This document is the single source of truth for this project.
> Read it fully before making any architectural or feature decision. Where multiple options are
> presented, they are intentional — evaluate them against the current state of development and
> discuss before committing. Do not default to the most familiar option; default to the most
> appropriate one based on the criteria given.

---

## Table of Contents

1. [Vision & Origin Story](#1-vision--origin-story)
2. [What We Are Building](#2-what-we-are-building)
3. [Competitive Positioning](#3-competitive-positioning)
4. [Feature Specification](#4-feature-specification)
5. [Technical Architecture](#5-technical-architecture)
6. [AI Model Decisions](#6-ai-model-decisions)
7. [Data Models & Core Abstractions](#7-data-models--core-abstractions)
8. [Development Phases](#8-development-phases)
9. [Distribution & Hosting Strategy](#9-distribution--hosting-strategy)
10. [Design Philosophy](#10-design-philosophy)
11. [Open Questions & Deferred Decisions](#11-open-questions--deferred-decisions)

---

## 1. Vision & Origin Story

### Why this exists

This project did not start from a technology trend or a desire to learn a new library. It started from two real, observed problems.

**Problem 1 — The screenshot folder.** Screenshots taken during debugging sessions accumulate rapidly. They vary wildly in dimensions — sometimes a full screen capture, sometimes a cropped detail. They are all PNG by default, which is the worst possible format for screenshots at scale. Converting them to JPEG saves significant storage, but the inconsistent sizes meant every image came out at a different dimension. That's where padding became a real feature requirement: the ability to bring images to a consistent aspect ratio by filling negative space rather than cropping content.

**Problem 2 — The cloud upload bottleneck.** A friend had three months of accumulated media and needed to upload it to cloud storage. The sheer volume caused upload timeouts, file manager crashes, and hours of frustration. The only solution was to manually split the library into smaller folders — checking sizes by hand, dragging files, guessing at chunk boundaries. That's where the batch organizer was born: a tool that reads a folder and splits it into subfolders of a user-defined size limit, ready for phased uploads.

These two stories matter because they define the project's philosophy:

> **Software should solve real problems that real people experience, invisibly, without requiring them to become technical.** The best tools give people their time back.

### Core philosophy

- Identify real friction points in how people manage and prepare images
- Build solutions that feel obvious in hindsight, not clever in the moment
- Respect the user's data — it never leaves their machine
- Embrace open source not as a constraint but as a value: cooperation between developers produces better outcomes than competition
- Maintain a high execution standard; this is portfolio work and everything in it should reflect deliberate decisions

---

## 2. What We Are Building

**A fully client-side image processing and organization tool** that runs entirely on the user's machine — no server, no uploads, no accounts.

Two words define the product: **Process. Organize.**

Users can build a processing pipeline (resize → pad → compress → convert) and then route the output through an organization step (group by date, split by size, sort by name pattern) — all in a single, unified workflow.

### Delivery targets

| Target | Purpose | Tech |
|---|---|---|
| Web App (PWA) | Primary distribution, zero-install, instant demo | React + Vite + WASM |
| Desktop Binary (.exe / .dmg) | Power users, large libraries, AI features | Tauri wrapping same frontend |

### What it is NOT

- Not a photo editor (no layers, no brushes, no filters)
- Not a cloud service
- Not another single-image compressor (Squoosh already does that better than we can)
- Not a subscription product

---

## 3. Competitive Positioning

### The market gap — confirmed across all 8 research reports

The image tool market splits cleanly into four quadrants:

```
                    CLIENT-SIDE
                         |
     XnConvert       |       Squoosh
     IrfanView        |       Bulk Resize
     (powerful,       |       (private,
     desktop-only,    |       single op,
     dated UI)        |       no batch)
                      |
PIPELINE ─────────────┼───────────────── SINGLE-OP
                      |
     ImageMagick      |       iLoveIMG
     Sharp CLI        |       Compressor.io
     (powerful,       |       (easy UI,
     CLI-only,        |       server-side,
     no GUI)          |       privacy risk)
                      |
                    SERVER-SIDE
```

**The top-right quadrant — client-side + pipeline-capable + non-technical UI — is completely empty for web tools.** This is where we build.

### Differentiation statement

> "Squoosh for batches, with an organizer built in. No uploads. Ever."

### What no competitor offers simultaneously

1. **Visual, composable pipeline** — only XnConvert has real recipe support but it's desktop-only, dated, and has no AI
2. **Size-based folder splitting** — only Vovsoft Folder Splitter ($20, Windows-only, no image processing)
3. **Combined process + organize workflow** — zero tools offer this
4. **Client-side AI without subscriptions** — Remove.bg charges per image; Canva requires Pro
5. **Non-technical UX with professional capability** — every powerful tool either requires a CLI or a steep learning curve

---

## 4. Feature Specification

### 4.1 Processing Pipeline

The pipeline is the core of the product. Users build an ordered sequence of operations that is applied to every image in the batch.

#### Pipeline Operations (MVP)

| Operation | Parameters | Notes |
|---|---|---|
| **Resize** | Width, Height, Mode (exact / fit / fill / cover / longest-side / percent) | Preserve aspect ratio option |
| **Pad** | Target aspect ratio or exact dimensions, fill mode (solid color / blur / transparent) | Core differentiator — born from the screenshot problem |
| **Convert Format** | Target format: JPG, PNG, WebP, AVIF | AVIF support via wasm-vips |
| **Compress** | Quality slider OR perceptual target mode | See note on perceptual compression below |
| **Strip Metadata** | EXIF, ICC profile (with option to preserve ICC) | Privacy and size reduction |
| **Rename** | Pattern-based: `{name}`, `{index}`, `{date}`, `{width}`, `{height}`, `{format}` | |

#### Pipeline Operations (Post-MVP)

| Operation | Parameters | Notes |
|---|---|---|
| **Background Removal** | Model selection, threshold | AI-powered, lazy-loaded |
| **Upscale** | Scale factor (2x, 4x), model selection | AI-powered, desktop-preferred |
| **Flatten Transparency** | Fill color | Convert RGBA → RGB with background color |

#### Perceptual Compression (important detail)

Rather than exposing a raw quality slider (0–100), the default mode should target a perceptual quality threshold. The algorithm:
1. Encode the image at decreasing quality steps
2. Compute a lightweight similarity metric (SSIM or equivalent) against the original
3. Stop when the quality delta crosses a threshold the user sets semantically ("Maximum Quality", "Web Optimized", "Aggressive Reduction")
4. Report the actual file size saved

This is non-obvious behavior that shows algorithmic thinking and produces genuinely better results than a raw quality slider. Expose the raw slider as "Advanced" for users who need exact control.

#### Recipe System

A recipe is a named, saved, exportable pipeline configuration.

```json
{
  "id": "uuid",
  "name": "Instagram Product Photos",
  "version": 1,
  "created": "2025-01-01T00:00:00Z",
  "operations": [
    { "type": "resize", "params": { "mode": "fit", "width": 1080, "height": 1080 } },
    { "type": "pad", "params": { "aspect": "1:1", "fill": "blur" } },
    { "type": "convert", "params": { "format": "webp" } },
    { "type": "compress", "params": { "mode": "perceptual", "target": "web" } }
  ],
  "organize": {
    "enabled": false
  }
}
```

Recipes are:
- Saved to localStorage (web) / app data directory (desktop)
- Exportable as JSON files
- Importable by other users via file drag-drop or URL
- Shareable — a core community mechanic

Include a small set of built-in platform presets:
- Instagram 1:1 Grid
- Shopify Product (2000×2000)
- Twitter / X Post
- LinkedIn Banner
- Web General (WebP, perceptual compression)
- Archive (lossless PNG, strip metadata)

### 4.2 Image Grouping & Organization

This runs as the **terminal step** of the pipeline — after all processing is complete, images are routed into organized subfolders.

#### Grouping Modes

**Group by Date**
- Source: EXIF `DateTimeOriginal` → fallback to file `lastModified`
- Granularity: Year / Year-Month / Year-Month-Day (user selectable)
- Default pattern: `YYYY/YYYY-MM` (most common convention in photography communities)
- Custom pattern support: `{YYYY}/{MM}/{DD}` tokens

**Group by Filename Pattern**
- Prefix match: all files starting with `IMG_` go into one folder
- Regex: advanced users can write a capture group — `(\d{4}-\d{2}-\d{2}).*` → use first group as folder name
- Fuzzy match: group visually similar filenames together

**Group by Size Limit (the cloud upload feature)**
- User sets a maximum folder size: 1GB, 2GB, 4GB, or custom
- Algorithm:
  1. Sort files by date (or filename, user-configurable)
  2. Accumulate files into current batch until size limit is approached
  3. Create new subfolder, continue
  4. Name pattern: `Batch_001`, `Batch_002` OR `2024-01_part1`, `2024-01_part2`
- Show preview: "Your 8.4GB library will become 5 folders of ~2GB each"

**Group by Custom Rule**
- Combine modes: "Group by month, then split each month into 2GB chunks"
- This handles the real scenario: friend with 3 months of media wanting phased uploads with date context preserved

#### Output Options

- Flat folder (no grouping, just processed files)
- Subfolders in a new output directory
- Download as ZIP (browser fallback — see File System Access API note in tech section)
- Write directly to disk (Tauri + File System Access API on supported browsers)

### 4.3 Batch Import

- Drag and drop: individual files or folders
- File picker with multi-select
- Folder picker (recursive, desktop and Chromium browsers via File System Access API)
- Supported input formats: JPG, PNG, WebP, AVIF, GIF, TIFF, HEIC (via wasm-vips)
- Maximum practical browser batch: ~200–500 images (warn user; no hard cap)
- Large batches (1000+): recommend desktop binary

### 4.4 Preview System

Before running the full batch, users should be able to:
- Select any image from the queue as a preview target
- See real-time before/after with a drag divider (Squoosh-style)
- See the delta: original size → output size, dimension changes, format change
- Run the pipeline on the preview image instantly as settings change
- Batch preview: apply to 3–5 random samples from the queue before committing

The "blind batch" is a documented major pain point — the preview system directly addresses user anxiety about running settings across thousands of files without seeing the result.

---

## 5. Technical Architecture

### 5.1 Frontend Framework

**Decision: React + Vite**

**Rationale:**
- React is more widely recognized in portfolio context — visitors who review the code will be immediately oriented
- Vite gives fast builds and excellent WASM handling
- Strong ecosystem for the UI components needed (drag-and-drop, virtualized lists for large batches, slider comparisons)
- The team (you + agentic coders) is likely more productive in React

**Alternative considered: Svelte + Vite**
- Pros: Smaller bundle, faster runtime, excellent for tool-oriented UIs, fewer abstractions
- Cons: Less portfolio recognition, smaller ecosystem for complex UI components
- Verdict: Valid choice if you prefer it. The performance difference is real but not decisive for this use case. Discuss with implementation agents at project start and commit to one.

### 5.2 Processing Engine

**Decision: wasm-vips (libvips compiled to WASM)**

This is the non-negotiable core of the processing pipeline.

**Why wasm-vips:**
- Full libvips API in the browser: resize, convert, compress, pad, strip metadata, color profile handling
- ~4.6MB binary (Brotli compressed from ~20MB raw)
- Streams pixel data rather than loading full images into memory — critical for large batches
- Significantly faster than ImageMagick; ~6x faster than pure JS for JPEG operations
- ~2–4x slower than native libvips, which is acceptable for consumer batch processing
- Color profile preservation (sRGB ICC) — ImageMagick strips these silently; wasm-vips does not

**Critical deployment requirement — COOP/COEP headers:**
wasm-vips requires `SharedArrayBuffer` for multi-threading. Browsers only allow this in "cross-origin isolated" contexts. You must serve the app with:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Cloudflare Pages supports this via `_headers` file configuration. Firebase does not handle this cleanly. **This is why Cloudflare Pages is the hosting recommendation — see Section 9.**

**Option: Use a non-threaded wasm-vips build as fallback**
A single-threaded build avoids the COOP/COEP requirement but is significantly slower. Use the threaded build as default, fall back to single-threaded if cross-origin isolation fails. Inform the user of degraded performance.

**Supplementary: Canvas 2D API**
Use Canvas for real-time previews, simple composites, and operations too lightweight to warrant wasm-vips overhead. Do not use Canvas for production batch processing.

### 5.3 AI Inference Engine

**Decision: ONNX Runtime Web**

- Mature, production-ready (used in production vision apps since 2023)
- Supports WebGPU backend (primary), WASM backend (fallback), WebNN (future)
- Auto-detects available backend and falls back gracefully
- Used in existing browser background removal demos with interactive speeds
- Models are cached in IndexedDB after first download — no re-download on subsequent use

**Inference priority chain:**
```
WebGPU (Chrome/Edge, 85% of users) 
  → WASM SIMD + Threads (~remaining desktop) 
  → WASM single-thread (iOS Safari, legacy)
  → "GPU required for this feature" warning (last resort)
```

**Performance expectations (communicate clearly to users):**
- Background removal on modern WebGPU: 100–500ms per image ✓
- Background removal on WASM: 3–8 seconds per image — warn user
- Upscaling on WebGPU: 2–15 seconds per image depending on model
- Batch AI processing: sequential queue only, never parallel (VRAM safety)

### 5.4 Desktop Distribution

**Decision: Tauri 2.x**

| Metric | Tauri | Electron |
|---|---|---|
| Installer size | 2.5–10MB | 80–150MB |
| Idle RAM | 30–40MB | 150–300MB |
| WASM behavior | Uses OS WebView — same WASM pipeline | Bundled Chromium — predictable but heavy |
| File system | Full native access via Rust backend | Full access via Node.js |
| Build pipeline | GitHub Actions cross-compile | Same |

**Tauri-specific advantages for this project:**
- Native file system access eliminates the File System Access API / ZIP fallback problem
- Rust sidecar support: if WebGPU in the WebView proves unstable for heavy AI ops, offload to a native Rust binary via IPC — this is the escape hatch for batch upscaling
- Full recursive folder traversal — 10,000+ image libraries are a real use case for desktop users
- App bundle size is small enough that users will actually download it

**Build targets:** Windows (.exe via NSIS/MSI), macOS (.dmg), Linux (.AppImage / .deb)

**Distribution:** GitHub Releases exclusively. Never host binaries on Firebase or Cloudflare. GitHub provides free CDN-backed binary hosting with no bandwidth cost and is where technical visitors will look first.

**CI/CD:** GitHub Actions builds and signs on tag push. Automate this from day one.

### 5.5 File System Access

**Browser (Chromium, ~72% of users):**
- Use File System Access API for folder picker and direct write
- Full recursive input folder traversal
- Write organized output directly to a user-chosen directory — no ZIP needed

**Browser (Firefox / Safari fallback):**
- Drag-and-drop for input
- Download as ZIP for output
- OPFS (Origin Private File System, 95%+ support) for caching WASM binaries and AI models between sessions

**Desktop (Tauri):**
- Native filesystem APIs via Rust backend
- No restrictions — full access to any directory
- Watch folders (advanced, post-MVP)

**Implementation guidance:**
Detect File System Access API availability at runtime. If available, offer "Save to folder" as the primary output mode. If not, offer "Download ZIP" with a note explaining why and a recommendation to try the desktop app for large batches.

### 5.6 Model Delivery & Caching

AI models must never block the initial page load.

**Strategy:**
1. Models are hosted on **Hugging Face Hub** (free, no bandwidth cap, purpose-built for this)
2. Models are fetched **lazily** — only when the user adds an AI operation to their pipeline
3. After first download, models are stored in **IndexedDB** via the Cache API
4. On subsequent visits, models load from IndexedDB — effectively instant, zero bandwidth cost
5. Show download progress UI clearly: "Downloading background removal model (44MB)... this only happens once"

**Never host models on Cloudflare Pages, Firebase, or any metered CDN.** The only exception is the wasm-vips binary (~5MB Brotli), which is part of the app shell and cached via Service Worker.

### 5.7 Web Worker Architecture

All heavy processing must run off the main thread.

```
Main Thread (UI)
  ├── React rendering
  ├── User interactions
  └── Progress event listeners

Worker Thread (processing)
  ├── wasm-vips initialization
  ├── Pipeline execution per image
  ├── File I/O (read input, write output)
  └── Progress postMessage → Main Thread

Worker Thread (AI inference)
  ├── ONNX Runtime Web
  ├── Model loading from IndexedDB
  ├── Sequential inference queue
  └── Result postMessage → Main Thread
```

Use `OffscreenCanvas` for preview rendering in workers where available.

### 5.8 State Management

- **Zustand** (lightweight, no boilerplate, excellent for tool-style state machines)
- Pipeline state, batch queue, processing progress, recipe library — all in Zustand stores
- Persist recipe library to localStorage (web) and app data directory (desktop)
- Do not use Redux — overkill for this architecture

### 5.9 Technology Stack Summary

```
Frontend:        React 19 + Vite
Styling:         Tailwind CSS + CSS variables (minimal custom CSS)
State:           Zustand
Processing:      wasm-vips (libvips WASM)
AI Inference:    ONNX Runtime Web (WebGPU → WASM fallback)
Desktop:         Tauri 2.x (Rust)
Hosting:         Cloudflare Pages (web), GitHub Releases (binary)
Model Hosting:   Hugging Face Hub
Language:        TypeScript throughout
Testing:         Vitest (unit), Playwright (E2E for critical flows)
CI/CD:           GitHub Actions
```

---

## 6. AI Model Decisions

> **This section contains licensing-critical information. Read carefully before implementing any AI feature.**

### 6.1 Background Removal

#### ⚠️ RMBG-1.4 Licensing Warning

RMBG-1.4 by BRIA AI is **not open source**. It is "source-available" with a non-commercial restriction. Despite widespread community use, the license explicitly prohibits use in commercial products, production pipelines, or monetized tools without a paid enterprise agreement. As an open-source portfolio project that may eventually generate revenue or be used as a professional demonstration, using RMBG-1.4 as the default model carries real legal risk.

**Do not use RMBG-1.4 as the default model.**

#### Model Options for Background Removal

| Model | Size | License | Quality | Browser Feasibility | Recommendation |
|---|---|---|---|---|---|
| **IS-Net via @imgly** | 84MB FP16 | AGPL-3.0 | ★★★★☆ | ✅ Production-proven npm package | **Recommended default** |
| **U2-Net Small (u2netp)** | ~4.7MB | MIT | ★★★☆☆ | ✅ Excellent | Good lightweight option |
| **MODNet** | ~6MB | Apache 2.0 | ★★★★☆ (portraits only) | ✅ Fast | Portrait-specific use case |
| **InSPyReNet** | ~30–60MB | MIT | ★★★★☆ | ✅ Viable | Good general alternative |
| **RMBG-1.4** | 44–176MB | Non-commercial ⚠️ | ★★★★★ | ✅ Technically | Not for default; optional advanced |
| **RMBG-2.0** | Similar | Non-commercial ⚠️ | ★★★★★ | ✅ Technically | Same restriction |

#### Recommended Strategy

**Option A (Recommended):** Use `@imgly/background-removal` (IS-Net, AGPL-3.0) as the default. This is a production-proven npm package with ONNX Runtime Web built in. The AGPL-3.0 license is compatible with an open-source project — it requires derivative works to also be open source, which aligns with the project philosophy.

**Option B:** Use U2-Net Small (4.7MB) as the default for the web app — the tiny size means no download wait and it's MIT licensed. Offer IS-Net as a "high quality" upgrade that downloads on demand. This is the most user-friendly first experience.

**Option C (Advanced toggle):** Provide RMBG-1.4 as a manually enabled option with a clear disclaimer: "This model is non-commercial use only. Do not use it if you are processing images for commercial purposes." This shifts legal responsibility to the user while still offering the best quality for personal users. Implement this only if Option A or B is already in place.

**Discuss with implementation agents:** Choose Option A or B at project start. Do not implement Option C before the default is working well.

### 6.2 Upscaling

| Model | Size | License | Quality | Browser Feasibility |
|---|---|---|---|---|
| **realesr-general-x4v3** | ~5MB | BSD-3-Clause | ★★★★☆ | ✅ Best browser option |
| **Real-CUGAN 4x** | ~2.9MB | GPL-3.0 ⚠️ | ★★★★☆ | ✅ Fastest option |
| **RealESRGAN_x4plus** | 67MB | BSD-3-Clause | ★★★★★ | ❌ Too heavy for web |
| **SwinIR (8-bit quantized)** | ~50MB | Apache 2.0 | ★★★★☆ | ⚠️ Viable but slow on CPU |

#### Recommended Strategy

**Default:** `realesr-general-x4v3` (~5MB, BSD-3) — best balance of size, quality, and license for browser deployment.

**Note on Real-CUGAN:** It is 5–10x faster than Real-ESRGAN with comparable quality, but carries a GPL-3.0 license. This is compatible with open-source projects but would require any derivative work to also be GPL. If the project ever considers a proprietary tier, this is a constraint. Discuss licensing implications with implementation agents before including Real-CUGAN.

**Tiling requirement:** Any upscaling implementation must tile large images. Processing a full image in one pass will crash consumer GPUs. Tile size: 64–256px with overlap. The stitching algorithm is non-trivial — allocate proper engineering time for this.

**Desktop vs. web:** Full-quality upscaling (x4plus, 67MB) is desktop-only. The web demo shows the compact model only. Be explicit about this distinction in the UI.

### 6.3 AI UX Requirements

These are non-negotiable regardless of which models are chosen:

1. **Lazy loading only.** AI models never load on initial page visit. They download only when the user explicitly adds an AI step to their pipeline.
2. **Download progress UI.** A clear progress indicator with the file size and the message "this only happens once" must appear during the first model download.
3. **Performance transparency.** Show estimated processing time per image based on detected hardware capability. "~0.3s per image on your GPU" or "~5s per image (no GPU detected)."
4. **Sequential queue.** Never run AI inference on multiple images simultaneously. Process one at a time, show progress.
5. **Cancel option.** Users must be able to cancel mid-batch AI processing.
6. **Graceful fallback.** If WebGPU is unavailable, inform the user clearly and offer the WASM path with realistic timing expectations.

---

## 7. Data Models & Core Abstractions

These define the architecture. Implementation agents should design around these from day one.

### 7.1 Operation

```typescript
type OperationType =
  | 'resize'
  | 'pad'
  | 'convert'
  | 'compress'
  | 'rename'
  | 'strip_metadata'
  | 'background_removal'
  | 'upscale'
  | 'flatten_transparency';

interface Operation {
  id: string;           // uuid
  type: OperationType;
  enabled: boolean;     // can be toggled off without removing from pipeline
  params: Record<string, unknown>; // operation-specific, validated per type
}
```

### 7.2 Recipe

```typescript
interface Recipe {
  id: string;           // uuid
  name: string;
  description?: string;
  version: number;      // schema version for forward compatibility
  created: string;      // ISO timestamp
  modified: string;
  operations: Operation[];
  organize?: OrganizeConfig;
  meta?: {
    author?: string;
    tags?: string[];
    platform?: string;  // e.g. "instagram", "shopify"
  };
}
```

### 7.3 OrganizeConfig

```typescript
type OrganizeMode = 'none' | 'date' | 'name_pattern' | 'size_limit' | 'combined';

interface OrganizeConfig {
  mode: OrganizeMode;
  date?: {
    granularity: 'year' | 'month' | 'day';
    pattern: string;          // e.g. "{YYYY}/{YYYY-MM}"
    source: 'exif' | 'modified' | 'created';
    fallback: 'modified' | 'created' | 'skip';
  };
  namePattern?: {
    regex: string;            // capture group (1) becomes folder name
    fallback: string;         // folder name if no match
  };
  sizeLimit?: {
    bytes: number;            // max bytes per output folder
    namingPattern: string;    // e.g. "{base}_part{index:03d}"
  };
  combined?: {
    first: OrganizeConfig;    // primary grouping
    then?: OrganizeConfig;    // secondary grouping within primary
  };
}
```

### 7.4 BatchItem

```typescript
type BatchItemStatus =
  | 'queued'
  | 'processing'
  | 'done'
  | 'error'
  | 'skipped';

interface BatchItem {
  id: string;
  file: File;
  name: string;
  size: number;
  dimensions?: { width: number; height: number };
  status: BatchItemStatus;
  progress?: number;        // 0–100
  error?: string;
  result?: {
    blob: Blob;
    name: string;
    size: number;
    dimensions: { width: number; height: number };
    folder?: string;        // assigned output subfolder
  };
}
```

### 7.5 ProcessingSession

```typescript
interface ProcessingSession {
  id: string;
  recipe: Recipe;
  items: BatchItem[];
  startedAt?: string;
  completedAt?: string;
  stats?: {
    totalInput: number;     // bytes
    totalOutput: number;    // bytes
    saved: number;          // bytes
    savedPercent: number;
    itemsProcessed: number;
    itemsFailed: number;
    durationMs: number;
  };
}
```

---

## 8. Development Phases

### Phase 0 — Foundation (Week 1–2)

**Goal:** Project skeleton, tooling, deployment pipeline running before writing a single feature.

Tasks:
- Initialize React + Vite + TypeScript project
- Configure Tailwind CSS with design tokens
- Set up Zustand stores (pipeline, batch, recipes, app settings)
- Integrate wasm-vips — confirm it initializes correctly with COOP/COEP headers
- Configure Cloudflare Pages deployment with correct headers
- Set up GitHub Actions CI (lint, type-check, build, deploy on push)
- Set up Tauri project wrapping the frontend
- Confirm Tauri builds for Windows, macOS from CI
- Set up GitHub Releases automated binary publishing on tag

**Exit criteria:** Visiting the deployed URL initializes wasm-vips in a Web Worker without errors. Tauri binary builds successfully.

---

### Phase 1 — Core Processing (Week 3–5)

**Goal:** Single-image processing pipeline working end-to-end with preview.

Tasks:
- File drop zone + file picker UI
- Pipeline builder UI: ordered list of operations with add/remove/reorder
- Implement operations via wasm-vips: resize, convert, compress, pad, strip metadata
- Real-time before/after preview with drag divider
- Delta display: input size → output size, dimension changes
- Perceptual compression mode (SSIM-based)
- Web Worker communication: pipeline execution off main thread
- Progress reporting from worker to UI
- Download single processed image

**Exit criteria:** A user can drop an image, build a resize → pad → compress → convert pipeline, see a live before/after preview with size delta, and download the result.

---

### Phase 2 — Batch Processing (Week 6–8)

**Goal:** Pipeline works on many files simultaneously.

Tasks:
- Multi-file and folder input
- Batch queue UI: virtualized list (react-virtuoso or similar), status per item
- Sequential processing loop in worker (one image at a time)
- Overall progress bar + per-item indicators
- Error handling: failed items don't stop the batch
- Batch preview: apply to 3 random samples before full run
- Cancel mid-batch
- Download all as ZIP (browser fallback output)
- File System Access API integration for direct folder output (Chromium)
- Tauri: native folder picker and output, recursive input traversal

**Exit criteria:** A user can drop 200 images, build a pipeline, preview 3 samples, run the batch, and download the results either directly to a folder or as a ZIP.

---

### Phase 3 — Organization & Grouping (Week 9–11)

**Goal:** The upload-ready chunking feature. The cloud upload problem from the origin story.

Tasks:
- Organize step as the terminal pipeline node
- Group by date: EXIF extraction, date-based folder hierarchy, configurable pattern
- Group by size limit: algorithm to pack files into N-GB folders
- Group by filename pattern: prefix match + regex
- Combined mode: date-then-size (the key real-world scenario)
- Preview panel: "Your 8.4GB library → 5 folders of ~2GB"
- Output folder structure visualization before running
- Named subfolders in ZIP output (browser)
- Named subfolders directly on disk (Tauri + File System Access)

**Exit criteria:** A user can take a flat folder of mixed-date images, group by month, split each month into 2GB chunks, and receive a folder structure ready for phased cloud upload — matching exactly the origin story scenario.

---

### Phase 4 — Recipe System (Week 12–13)

**Goal:** Pipelines are reusable, saveable, and shareable.

Tasks:
- Save current pipeline as named recipe
- Recipe library UI: list, preview, load, delete, duplicate
- Built-in platform presets: Instagram, Shopify, Twitter, Web General, Archive
- Export recipe as JSON file
- Import recipe from JSON file
- Recipe JSON schema validation on import
- Encode recipe in URL query param (shareable link)
- Recipe card: shows operations at a glance, platform tag

**Exit criteria:** A user can save their Instagram preset recipe, export it as JSON, and a different user can import it and run it.

---

### Phase 5 — AI Features (Week 14–17)

**Goal:** Background removal and upscaling running client-side with proper UX.

> Allocate more time than you think this needs. Model integration, tiling, fallback handling, and UX for slow operations is non-trivial.

Tasks:
- Integrate ONNX Runtime Web
- Background removal model (see Section 6.1 — decide Option A or B at Phase 5 start)
  - Download + progress UI
  - IndexedDB caching
  - Processing in AI worker thread
  - Sequential queue with cancel
  - Performance display (detected backend + estimated time)
  - WebGPU → WASM fallback with user notification
- Upscaling model (realesr-general-x4v3, ~5MB)
  - Same infrastructure as above
  - Spatial tiling implementation (mandatory)
  - Desktop-only note in web UI for full model
- AI operations as pipeline steps (placed before organize step)
- Hardware capability detection on app load (report to UI)

**Exit criteria:** A user can add background removal to their pipeline, see the model download once with progress, and process a batch of 20 images with clear per-image progress. On a device without WebGPU, the fallback path works with an honest timing warning.

---

### Phase 6 — Polish & Portfolio Readiness (Week 18–20)

**Goal:** The app is portfolio-ready. Everything works well enough to show. Story is documented.

Tasks:
- UI polish pass: spacing, transitions, empty states, loading states, error states
- Onboarding: 3-step first-run guide (add images → build pipeline → run)
- Keyboard shortcuts for power users
- Accessibility audit (WCAG 2.1 AA minimum)
- Performance audit: Lighthouse, WASM init time, large batch timing
- README: project story, architecture decisions, open source attributions
- Portfolio entry copy: lead with origin stories, highlight pipeline architecture and perceptual compression
- App name, logo, favicon
- PWA manifest: installable, offline support for core features (excluding model downloads)
- Landing page with clear value proposition above the fold

**Exit criteria:** A non-technical user can land on the page, understand what the app does in 5 seconds, drag in their photos, and process them without needing any instructions.

---

### Phase 7 — Desktop Binary (Week 21–22)

**Goal:** Tauri binary is published and working for the scenarios browsers can't handle.

Tasks:
- Audit all features that work differently in Tauri vs browser
- Native filesystem differences: recursive folder scan, watch folder (optional)
- Rust sidecar evaluation: is WebGPU in Tauri's WebView stable enough for AI, or do we need sidecar offload?
- Full upscaling model (x4plus, 67MB): desktop-only, gated behind Tauri detection
- Installer build pipeline: Windows (.exe + .msi), macOS (.dmg), Linux (.AppImage)
- Auto-update support (Tauri updater plugin)
- GitHub Releases publishing automation
- Desktop-specific UI adjustments: window title bar, native menus (minimal)

**Exit criteria:** A user can download and install the app on Windows and macOS, process a 5GB folder of images with full recursive traversal, and run the full-quality upscaling model.

---

## 9. Distribution & Hosting Strategy

### Web App

**Platform: Cloudflare Pages**

Reasons:
- Free tier includes unlimited bandwidth — critical for WASM file serving
- Supports COOP/COEP header injection via `_headers` file — required for wasm-vips threading
- Edge CDN with global presence — low WASM/JS load times worldwide
- R2 object storage (if needed): $0.015/GB/month, no egress fees

**Headers configuration (`_headers` file):**
```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Resource-Policy: cross-origin
```

**Do not use Firebase Hosting** for this project. Its free tier has a 360MB/day bandwidth limit. The WASM binary alone is ~5MB; 72 users per day exhausts the free tier. Cloudflare Pages has no such limit.

### AI Model Files

**Platform: Hugging Face Hub**

- Purpose-built for ML model hosting
- No bandwidth cost, no download limits
- Models fetch on demand from HF, cache in browser IndexedDB
- Cloudflare Pages never sees the model traffic

### Desktop Binaries

**Platform: GitHub Releases**

- Free CDN-backed binary hosting
- Native integration with GitHub Actions for automated publishing
- Where technical visitors look first
- `gh release create` in CI on tag push

### Launch Channels

In rough priority order:
1. **Hacker News (Show HN)** — highest quality initial spike for developer tools
2. **Reddit:** r/webdev, r/DataHoarder, r/photography, r/InternetIsBeautiful, r/SideProject
3. **Product Hunt** — unpredictable but worth submitting; don't build around its success
4. **GitHub trending** — a well-documented README with clear screenshots can drive organic traffic

**SEO opportunity:** "compress image without uploading", "resize photos offline", "batch resize images free" — these are less competitive than generic "compress image" (dominated by TinyPNG) and match the tool's positioning exactly. The portfolio writeup and landing page copy should reflect these phrases naturally.

---

## 10. Design Philosophy

> **This is not a suggestion — it is a constraint.** The design must communicate competence. Clutter communicates the opposite.

### Principles

**Minimal.** Every UI element must justify its presence. If it's not essential to the current task, it is hidden or absent.

**Intentional.** Whitespace is a design choice, not an absence of content. Use it deliberately.

**Sharp.** Crisp typography, precise alignment, consistent spacing system. No rounded corners on everything, no gradient abuse, no unnecessary shadows.

**Fast first impression.** A person who lands on the page for the first time must understand what the product does within 5 seconds, without reading a paragraph of text.

### Specific guidance for implementation agents

- Use a spacing scale (e.g. 4px base unit: 4, 8, 12, 16, 24, 32, 48, 64). Do not use arbitrary values.
- Typography: one variable font, two weights maximum in the UI (regular + medium). Headlines should be distinctive but not decorative.
- Color: near-monochromatic base with a single accent color. The accent should be used sparingly — only on primary actions and active states.
- The pipeline builder is the center of the UI. It should feel like a professional tool, not a form with dropdowns.
- Error states must be human-readable. "Something went wrong" is not acceptable. "This image format is not supported — try converting to JPG first" is.
- Empty states should explain what to do, not just what's missing.
- Dark mode from day one. Implement via CSS variables, not two separate stylesheets.

---

## 11. Open Questions & Deferred Decisions

These require a decision at the development phase indicated. Do not resolve them prematurely.

### Resolve at project start (Phase 0)

**Q1: React or Svelte?**
Default recommendation is React for portfolio recognition. If there is a strong reason to use Svelte (familiarity, performance requirements), commit to it at Phase 0 and do not change later.

### Resolve at Phase 5 start

**Q2: Background removal model — Option A or Option B?**
- Option A: IS-Net via `@imgly/background-removal` (AGPL-3.0, 84MB, production-proven npm package)
- Option B: U2-Net Small (MIT, 4.7MB) as default + IS-Net as "high quality" lazy upgrade
Recommendation: Option B for better first-time UX, but Option A is simpler to implement. Discuss.

**Q3: RMBG-1.4 as an optional advanced model?**
This is only worth implementing if the default model (Option A or B above) is working well. Do not prioritize it. If included, it must carry a visible non-commercial-use disclaimer.

### Resolve at Phase 7 start

**Q4: Rust sidecar for AI on desktop?**
If WebGPU in Tauri's WebView is stable and fast enough for upscaling (test this at Phase 5), no sidecar is needed. If it crashes or is too slow for large batches, implement a Rust sidecar using `ort` (ONNX Runtime Rust bindings). This is more work but provides native GPU performance.

**Q5: Watch folder support?**
Automatically re-process new images dropped into a monitored input folder. This is a power-user feature for photographers on active shoots. Desktop-only. Scope it in Phase 7 only if time allows.

### Deferred indefinitely

**Q6: Recipe marketplace / sharing hub**
A community recipe store where users can share and download recipes. High engagement potential. Do not build until Phase 6 is complete and the core product is stable.

**Q7: CLI companion tool**
A Sharp-based CLI that reads recipe JSON files and processes images via terminal. Useful for developers who want to integrate the recipe system into build pipelines. High credibility signal. Deferred until Phase 6.

**Q8: Monetization**
The project ships free and open source. Monetization decisions (ad-supported, Pro tier, desktop license) are made after the product has real users and real feedback. Do not let monetization considerations affect any Phase 1–6 architecture decisions.

---

## Appendix A — Research Summary

Eight independent research agents were run against this market. The following findings appeared consistently across all reports and are treated as reliable:

**Confirmed gaps (all 8 agents agree):**
1. No web-based tool offers composable, saveable processing pipelines
2. No consumer tool combines processing + organization in a single workflow
3. Size-based folder splitting is genuinely underserved — only niche Windows-only paid tools
4. Privacy anxiety about server-side tools is the #1 cited frustration across Reddit and review platforms
5. Squoosh's #1 user complaint is the absence of batch processing

**Confirmed technical facts:**
1. wasm-vips is production-ready and the correct processing engine choice
2. ONNX Runtime Web + WebGPU is mature enough for browser AI inference
3. RMBG-1.4 is non-commercial only — confirmed across 6 of 8 reports
4. Real-ESRGAN compact variant (~5MB) is the viable browser upscaling option
5. Tauri is significantly superior to Electron for this use case
6. Cloudflare Pages is the correct hosting platform; Firebase is not

**Notable divergence between reports:**
- Model quality estimates vary slightly — treat all benchmark numbers as indicative, not precise
- Some reports suggest RMBG-1.4 can be used; others flag it as a licensing blocker. **Default to caution — do not use it commercially without a license.**
- Browser support estimates for WebGPU range from 65% to 85% depending on source and date. Use 75% as a working estimate for planning purposes.

---

## Appendix B — Open Source Attributions (Anticipated)

The following libraries and models are expected to be used. Their licenses must be respected and attributed in the project README.

| Dependency | License | Attribution Required |
|---|---|---|
| wasm-vips | LGPL-3.0 (libvips) | Yes |
| ONNX Runtime Web | MIT | Yes |
| @imgly/background-removal (IS-Net) | AGPL-3.0 | Yes |
| Real-ESRGAN variants | BSD-3-Clause | Yes |
| Tauri | MIT / Apache-2.0 | Yes |
| React | MIT | Standard |
| Zustand | MIT | Standard |

**If U2-Net is used:** MIT licensed, attribution to the original paper authors.
**If RMBG-1.4 is used (optional/advanced):** Requires explicit non-commercial disclaimer in UI.
**If Real-CUGAN is used:** GPL-3.0 — review implications for project licensing.

---

*Last updated: April 2026. Maintained by project author. Update this document when significant architectural decisions are made during development.*
