---
status: accepted
created: 2025-04-13
---

# ADR-002: Processing Engine — wasm-vips

## Decision

Use **wasm-vips** (libvips compiled to WebAssembly) as the core image processing engine.

## Context

The project requires fast, high-quality image processing in the browser for resize, pad, compress, format conversion, metadata stripping, and color profile handling. Pure JavaScript image processing is too slow; alternatives exist but have critical tradeoffs.

## Rationale

### wasm-vips chosen because:

1. **Streaming API:** Processes pixel data in streams rather than loading full images into memory—critical for batch processing large files
2. **Color Profile Preservation:** Preserves sRGB ICC profiles by default; ImageMagick silently strips them
3. **Performance:** ~6x faster than pure JavaScript, ~2-4x slower than native libvips (acceptable for consumer use)
4. **Production-Ready:** Battle-tested, used in production image tools since 2020
5. **Comprehensive API:** Full libvips library (resize, convert, compress, pad, metadata, color management)
6. **Bundle Size:** ~4.6 MB brotli-compressed from 20 MB raw WASM binary

### Alternatives Considered

#### Canvas 2D API
- **Pros:** Built-in, no dependencies, lightweight
- **Cons:** No color profile handling, limited format support, no metadata manipulation, no resize quality options
- **Verdict:** Use for real-time preview only, not production batch processing

#### ImageMagick (via wasm binding)
- **Pros:** Comprehensive, widely known
- **Cons:** Larger bundle, slower, loses color profiles, more memory overhead
- **Verdict:** wasm-vips is better optimized for browser constraints

#### Pure JavaScript (Jimp, pica)
- **Pros:** No dependencies, full control
- **Cons:** Extremely slow (50x slower for JPEG encoding than libvips), no format conversion
- **Verdict:** Unacceptable for batch processing performance expectations

## Critical Requirements: Cross-Origin Isolation

wasm-vips uses `SharedArrayBuffer` for multi-threading. Browsers only allow this in "cross-origin isolated" contexts:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

**Cloudflare Pages supports this natively via `_headers` file.**
**Firebase does NOT handle this cleanly.**

### Fallback Strategy

If cross-origin isolation is unavailable:
1. Fall back to single-threaded wasm-vips build
2. Inform user: "GPU acceleration disabled. Processing will be slower."
3. Performance degrades to ~2-3x slower but remains functional

## Performance Baselines (from roadmap)

| Operation | Time per Image | Notes |
|-----------|----------------|-------|
| Resize (any mode) | <50ms | Streaming, no memory spike |
| Pad | <50ms | Extends image bounds |
| Compress (quality slider) | <50ms | Variable by image |
| Convert (JPEG → PNG) | 20-100ms | Format dependent |
| Strip metadata + ICC | <20ms | No re-encoding |
| Full pipeline (resize + pad + compress + convert) | <200ms | All ops combined |

## Consequences

### Positive
- Excellent performance for batch processing
- Handles large images without memory issues
- Professional-quality output (color profiles preserved)
- Supports advanced resize modes (fit, fill, cover, longest-side)

### Negative
- Requires COOP/COEP headers (hosting constraint)
- Single-threaded fallback is significantly slower
- WASM binary adds to bundle (4.6 MB)
- Requires fallback handling for cross-origin isolation failure

## Implementation Notes

1. Wrap wasm-vips in a TypeScript module (`src/utils/wasm-vips.ts`)
2. Implement lazy-loading of WASM binary (load on first use)
3. Check cross-origin isolation on app init; warn user if unavailable
4. Test both threaded and single-threaded builds
5. Monitor bundle size; consider brotli compression in production

## Related ADRs

- ADR-005: Hosting (Cloudflare Pages for COOP/COEP support)
