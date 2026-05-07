#!/usr/bin/env node
/**
 * Web demo build.
 *
 * Produces a Cloudflare-Pages-compatible bundle:
 *   - VITE_RMBG_AVAILABLE=false → UI gates RMBG-1.4, runner falls back to IS-Net
 *   - dist/models/rmbg-1.4-fp16.onnx is removed post-build (88MB exceeds CF
 *     Pages' per-file size limit)
 *   - The 5MB upscale model is kept; default IS-Net background removal loads
 *     from imgly's CDN
 *
 * Use `npm run build` for the desktop / Tauri build (full feature set).
 */

import { spawnSync } from 'node:child_process';
import { existsSync, rmSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

const env = { ...process.env, VITE_RMBG_AVAILABLE: 'false' };

function run(cmd, args) {
  const r = spawnSync(cmd, args, {
    cwd: repoRoot,
    env,
    stdio: 'inherit',
    shell: true,
  });
  if (r.status !== 0) {
    console.error(`[build:web] step failed: ${cmd} ${args.join(' ')}`);
    process.exit(r.status ?? 1);
  }
}

run('npx', ['tsc']);
run('npx', ['vite', 'build']);

const stripPath = resolve(repoRoot, 'dist/models/rmbg-1.4-fp16.onnx');
if (existsSync(stripPath)) {
  const bytes = statSync(stripPath).size;
  rmSync(stripPath);
  const mb = (bytes / 1024 / 1024).toFixed(1);
  console.log(`[build:web] stripped dist/models/rmbg-1.4-fp16.onnx (${mb} MB)`);
} else {
  console.log('[build:web] no rmbg-1.4-fp16.onnx in dist/models/ — already absent');
}

console.log('[build:web] done. dist/ is ready for Cloudflare Pages.');
