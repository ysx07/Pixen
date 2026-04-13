---
status: accepted
created: 2025-04-13
---

# ADR-004: Desktop Framework — Tauri 2.x

## Decision

Use **Tauri 2.x** to wrap the React frontend and provide native file system access for desktop distribution.

## Context

The project targets two distribution channels:
1. **Web (PWA):** Zero-install, instant demo, browser-based
2. **Desktop:** Power users, large libraries (1000+ images), native OS integration

The desktop version needs:
- Small installer (<10 MB)
- Efficient resource usage (for processing large batches)
- Full recursive folder traversal
- Direct file system write (bypass File System Access API limitations)
- Cross-platform (Windows, macOS, Linux)

## Rationale

### Tauri chosen because:

1. **Tiny Footprint:** 2.5-10 MB installer vs Electron's 80-150 MB
2. **Minimal Resource Usage:** 30-40 MB idle RAM vs Electron's 150-300 MB
3. **Code Reuse:** Same React codebase, no separate desktop implementation
4. **Native File I/O:** Rust backend provides direct file system access
5. **Rust Escape Hatch:** Can offload heavy AI computations to native Rust if WebGPU proves unstable
6. **GitHub Actions Support:** Native CI/CD for signing and code-signing across platforms

### Performance Comparison

| Metric | Tauri | Electron |
|--------|-------|----------|
| Installer Size | 2.5-10 MB | 80-150 MB |
| Idle RAM | 30-40 MB | 150-300 MB |
| Startup Time | <500ms | 1-2s |
| WASM Support | OS WebView WASM | Bundled Chromium WASM |
| File I/O | Native Rust | Node.js |

### Alternatives Considered

#### Electron
- **Pros:** Mature ecosystem, familiar to JS developers
- **Cons:** Large bundle, heavy resource usage, slower startup
- **Verdict:** Tauri's tiny footprint makes it much more user-friendly for download

#### PyInstaller + PyQt/Tkinter
- **Pros:** Native performance potential
- **Cons:** Completely separate codebase, Python distributions are also large
- **Verdict:** Reusing React code via Tauri is much faster

#### Native Swift/C# UI
- **Pros:** Best native performance
- **Cons:** Requires multiple codebases, massive development effort
- **Verdict:** Not viable for this project scope

## Build Targets

| Platform | Format | Notes |
|----------|--------|-------|
| Windows | `.exe` (NSIS or MSI) | Installer + portable option |
| macOS | `.dmg` (Intel + Apple Silicon) | Universal binary |
| Linux | `.AppImage` or `.deb` | AppImage for portability |

## Distribution Strategy

**Host on GitHub Releases exclusively.** Never use Firebase or Cloudflare for binary distribution.

**Why GitHub:**
- Free CDN-backed downloads
- No bandwidth limits
- Familiar to technical users
- Supports auto-update via `tauri-plugin-updater`
- Native CI/CD integration

## Tauri Architecture

```
┌─────────────────────────┐
│   React Frontend        │  (same as web)
│   (src/, dist/)         │
└────────────┬────────────┘
             │ IPC
    ┌────────▼──────────┐
    │  Tauri Core       │
    └────────┬──────────┘
             │
    ┌────────▼──────────┐
    │  Rust Backend     │  (src-tauri/)
    │  - File I/O       │
    │  - Native APIs    │
    │  - Sidecar Apps   │
    └───────────────────┘
```

### Key Tauri Features Used

1. **File System:** `fs` module for direct file system access (bypass File System Access API)
2. **IPC:** Message-passing between React and Rust for heavy operations
3. **Sidecar:** Optional native binary sidecar for GPU-intensive AI ops (escape hatch)
4. **Updater:** Automatic update checking + downloads
5. **File Dialog:** Native file/folder picker (more reliable than Web API)

## Consequences

### Positive
- Small, fast, user-friendly desktop experience
- Same codebase for web and desktop (minimal duplication)
- Can offload heavy work to Rust if needed
- Cross-platform with one codebase
- Built-in updater support

### Negative
- Requires Rust toolchain for builds (build complexity)
- Smaller ecosystem than Electron
- CI/CD matrix is more complex (cross-compile for different architectures)
- macOS code-signing requires Apple developer account (optional but recommended)

## Implementation Notes

1. Create `src-tauri/` with Rust backend scaffolding
2. Set up `tauri.conf.json` with file dialog and file system permissions
3. Implement Tauri commands for:
   - List directory recursively
   - Write processed images to disk
   - Native file picker
4. Share React code via same webpack build
5. Set up GitHub Actions for multi-platform builds
6. Implement auto-updater plugin for version management

## Related ADRs

- ADR-001: Frontend Framework (React code shared between web and desktop)
- ADR-006: Distribution (GitHub Releases for binaries)
