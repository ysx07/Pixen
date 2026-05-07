/**
 * Build-time feature flags.
 *
 * The full app ships in the desktop (Tauri) bundle and runs offline. The
 * portfolio web demo build strips the RMBG-1.4 advanced model (88MB) to
 * stay within Cloudflare Pages' per-file size limit. The default
 * background-removal model (IS-Net via @imgly) and the upscale model
 * (~5MB, vendored) ship in both targets.
 */

export const RMBG_AVAILABLE: boolean =
  (import.meta.env.VITE_RMBG_AVAILABLE ?? 'true') !== 'false';
