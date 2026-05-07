/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Set to "false" at build time to exclude the RMBG-1.4 advanced model
   * from a build (web demo). Defaults to true for dev and Tauri builds, so
   * the offline desktop bundle ships the full feature set.
   */
  readonly VITE_RMBG_AVAILABLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
