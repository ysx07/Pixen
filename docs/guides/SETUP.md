# Setup Guide

## Prerequisites

- **Node.js:** 18+ LTS (for all development)
- **Git:** v2.30+
- **pnpm or npm:** Bundled with Node.js
- **For Desktop Development:** Rust toolchain (for Tauri builds)
  - Windows: `rustup-init.exe`
  - macOS: `brew install rust`
  - Linux: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

## Quick Start

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/ysx07/Pixen.git
cd Pixen
npm install
```

### 2. Environment Setup

Copy the example env file:
```bash
cp .env.example .env
```

Fill in `.env` with any required API keys (currently none for MVP; will be needed for ONNX model hosting):
```env
# .env (leave blank for MVP)
ONNX_MODEL_BASE_URL=https://example.com/models
```

### 3. Development Server (Web)

```bash
npm run dev
```

Opens http://localhost:5173 with Vite HMR enabled.

### 4. Build for Web (PWA)

```bash
npm run build
```

Outputs to `dist/` with PWA manifest.

### 5. Build & Run Desktop (Tauri)

```bash
npm run tauri dev
```

Opens the app in a native window with HMR. File: `src-tauri/` contains the Rust backend.

To build a redistributable binary:
```bash
npm run tauri build
```

## Project Structure

```
pixen/
├── src/                          # React frontend
│   ├── main.tsx                  # Entry point
│   ├── App.tsx                   # Root component
│   ├── components/               # Reusable React components
│   │   ├── PipelineBuilder.tsx   # Pipeline UI
│   │   ├── PreviewSystem.tsx      # Canvas preview
│   │   └── ...
│   ├── hooks/                    # Custom React hooks
│   ├── utils/                    # Utility functions
│   │   ├── wasm-vips.ts          # Image processing wrapper
│   │   ├── onnx-runtime.ts       # AI inference wrapper
│   │   └── ...
│   ├── types/                    # TypeScript definitions
│   ├── assets/                   # Static assets
│   └── styles/                   # CSS/Tailwind
├── public/                       # Static files (favicon, manifest)
├── src-tauri/                    # Tauri backend (Rust)
│   ├── src/main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── dist/                         # Build output (web)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
├── docs/SPEC.md                  # Feature spec & architecture decisions
├── docs/
│   ├── ARCHITECTURE.md           # Public architecture overview
│   ├── CHANGELOG.md              # Version history
│   ├── decisions/                # ADRs (architecture decision records)
│   ├── guides/                   # Setup, deployment, troubleshooting
│   └── checklists/               # Phase completion, pre-deploy, security
├── .agent/
│   ├── context/                  # Tech stack, architecture, data model
│   ├── memory/                   # Persistent session state
│   ├── system-prompt.md          # Agent behavioral rules
│   └── coding-standards.md       # Code quality standards
└── .claude/
    ├── settings.json             # Claude Code configuration
    └── hooks/                    # Automated hooks
```

## AI Tool Configuration

### Claude Code
- **CLAUDE.md** is read automatically on session start (root level)
- **Slash commands** available in `.claude/commands/`
- **Settings** in `.claude/settings.json`

### Development Workflow
1. Ask Claude to read [docs/SPEC.md](../../docs/SPEC.md) for the spec
2. Reference [docs/ARCHITECTURE.md](../ARCHITECTURE.md) for system design
3. Check [.agent/context/tech-stack.md](.agent/context/tech-stack.md) for approved technologies

### Gemini / Antigravity
- **GEMINI.md** is read automatically on session start
- Skills available in `.agent/skills/`

## Verify Setup

```bash
# Test Node.js and npm
node --version   # Should be 18+
npm --version    # Should be 9+

# Test the dev server
npm run dev      # Should open http://localhost:5173

# Test TypeScript compilation
npm run type-check

# Run tests
npm run test
```

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (web) |
| `npm run build` | Build for web (dist/) |
| `npm run type-check` | Type check (no emit) |
| `npm run lint` | Lint TypeScript/JSX |
| `npm run format` | Format code (Prettier) |
| `npm run test` | Run tests (Vitest) |
| `npm run test:ui` | Test UI dashboard |
| `npm run tauri dev` | Dev server with Tauri window |
| `npm run tauri build` | Build desktop binary |

## Troubleshooting

### Vite Build Fails
Check that Node.js is 18+. Clear `node_modules/` and `.vite/` cache:
```bash
rm -rf node_modules .vite
npm install
npm run build
```

### wasm-vips Loading Issues
wasm-vips requires CORS headers. In development, Vite handles this. In production, ensure Cloudflare Pages is configured with COOP/COEP headers (see `_headers` file).

### Tauri Build Fails (Windows/macOS)
Ensure Rust is installed:
```bash
rustup update
rustup target add x86_64-pc-windows-msvc  # Windows only
```

For more help, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).
