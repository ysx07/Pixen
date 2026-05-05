/**
 * Bridge to onnxruntime-web's bundled types.
 *
 * The package's `package.json` `exports` field does not include a "types"
 * subpath, so the TS bundler resolver can't reach `types.d.ts` on its own.
 * We re-export from the relative path inside node_modules.
 */
declare module 'onnxruntime-web' {
  // The real declarations live at node_modules/onnxruntime-web/types.d.ts
  // which itself re-exports from onnxruntime-common.
  export * from 'onnxruntime-common';
}
