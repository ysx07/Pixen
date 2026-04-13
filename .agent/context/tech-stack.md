# Tech Stack

## Languages
- TypeScript 5.x
- JavaScript (modern ES2022+)
- HTML5 / CSS3

## Frameworks & Libraries
- **Frontend:** React 18+ with Vite
- **Image Processing:** wasm-vips (libvips compiled to WebAssembly)
- **AI Inference:** ONNX Runtime Web (WebGPU primary, WASM fallback)
- **UI Components:** TBD (consider Radix UI, shadcn/ui, or custom)
- **State Management:** TBD (context API, Zustand, or Jotai)
- **File Handling:** File System Access API (web), Tauri IPC (desktop)
- **Desktop Framework:** Tauri 2.x (Rust backend)

## Build & Tooling
- **Build tool:** Vite
- **Package manager:** npm
- **Linting:** ESLint + TypeScript
- **Formatting:** Prettier
- **Testing:** Vitest + React Testing Library (80% coverage minimum)
- **Type checking:** TypeScript strict mode
- **Git hooks:** Husky (optional)

## Deployment
- **Web:** Cloudflare Pages (required for COOP/COEP headers for wasm-vips)
- **Desktop:** GitHub Releases (Windows .exe, macOS .dmg, Linux .AppImage/.deb via GitHub Actions)
- **PWA:** Service Worker + manifest.json

## Development Tools
- Package manager: `npm`
- Task runner: `npm scripts` (no `just` required)
- IDE: Visual Studio Code (recommended)
- Node.js: 18+ LTS

## AI Tooling
- Claude Code (via `.claude/` configuration)
- Gemini / Antigravity (via `.gemini/` configuration)
- MCP Servers: See `.agent/mcp/mcp-registry.md`

## Critical Runtime Requirements

### Browser Support
- **Primary:** Chromium-based (Chrome, Edge, Brave) — ~72% of users
- **Secondary:** Safari (via File System Access API fallback / ZIP download)
- **Tertiary:** Firefox (ZIP download fallback)

### wasm-vips Threading
Requires `SharedArrayBuffer` support and cross-origin isolation:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```
Cloudflare Pages handles this via `_headers` file. Implement fallback to single-threaded build.

### GPU Inference (ONNX Runtime Web)
Priority chain:
1. WebGPU (Chrome/Edge, 85% of modern users)
2. WASM SIMD + Threads (~remaining desktop)
3. WASM single-thread (iOS Safari, legacy)
4. Degrade gracefully with warning
