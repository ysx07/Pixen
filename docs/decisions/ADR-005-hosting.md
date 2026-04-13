---
status: accepted
created: 2025-04-13
---

# ADR-005: Web Hosting — Cloudflare Pages

## Decision

Host the Pixen web app on **Cloudflare Pages** (not Firebase or other platforms).

## Context

The web version requires a hosting platform that:
1. Serves with COOP/COEP headers (required for wasm-vips multi-threading)
2. Has zero-config or one-click setup
3. Supports static site deployment
4. Offers free tier with good performance
5. Integrates with GitHub

## Rationale

### Cloudflare Pages chosen because:

1. **COOP/COEP Support:** Native support via `_headers` file configuration
   ```
   /*
     Cross-Origin-Opener-Policy: same-origin
     Cross-Origin-Embedder-Policy: require-corp
   ```
   This is required for wasm-vips `SharedArrayBuffer` support.

2. **Zero-Config Deployment:** Automatic builds from GitHub, no manual CI/CD setup
3. **Global CDN:** Distributed across Cloudflare's global network (~200+ edge locations)
4. **Free Tier:** Unlimited deployments, requests, and bandwidth
5. **Performance:** Blazingly fast (typically <100ms global latency)

### Critical: Why NOT Firebase Hosting

**Firebase Hosting does NOT support custom COOP/COEP headers cleanly.**

Firebase has these limitations:
- Cannot set custom headers on all routes easily
- Header configuration is nested in `firebase.json` and requires workarounds
- No native support for COEP/COOP headers in the UI

**This is a dealbreaker for wasm-vips.** If forced to use Firebase:
- Must fall back to single-threaded wasm-vips build
- Performance degrades by 2-3x
- Not acceptable for this project's requirements

### Alternatives Considered

#### Vercel
- **Pros:** Similar to Cloudflare, great DX
- **Cons:** Paid tier required for COOP/COEP headers; no native support
- **Verdict:** Cloudflare free tier is better value

#### Netlify
- **Pros:** Good documentation, easy setup
- **Cons:** No native COOP/COEP support; paid edge functions required
- **Verdict:** Same issue as Firebase

#### Self-Hosted (AWS EC2, DigitalOcean)
- **Pros:** Full control over headers
- **Cons:** Requires server management, costs money, more complex
- **Verdict:** Cloudflare Pages is simpler and faster

#### GitHub Pages
- **Pros:** Free, integrated with repo
- **Cons:** No custom headers support, static-only, limited features
- **Verdict:** Cloudflare Pages is strictly better

## Configuration

### `_headers` File

Create `public/_headers` in the project root:

```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
```

Cloudflare Pages will serve these headers with every response.

### Deployment Steps

1. Push code to GitHub
2. Go to Cloudflare Pages dashboard
3. Connect GitHub repo
4. Cloudflare auto-detects Vite; sets build command to `npm run build`
5. Deploy happens automatically on every push

### Environment Variables

In Cloudflare Pages dashboard, set production environment variables:
```
ONNX_MODEL_BASE_URL=https://cdn.example.com/models
VITE_ANALYTICS_ID=your-tracking-id
```

## Monitoring COOP/COEP Success

Check browser DevTools after deploy:
1. Network tab → Response Headers
2. Look for: `Cross-Origin-Opener-Policy: same-origin`
3. Look for: `Cross-Origin-Embedder-Policy: require-corp`
4. Open Console → check for "SharedArrayBuffer available" message

If headers are missing, wasm-vips will fall back to single-threaded (slower).

## Consequences

### Positive
- Zero-effort deployment (git push → live)
- Free tier covers all expected traffic
- Global CDN with excellent performance
- Native COOP/COEP support (unique advantage)
- Security headers easy to configure

### Negative
- Requires GitHub account (not a blocker)
- Limited to Cloudflare's infrastructure (acceptable for this use case)
- No easy way to run server-side code (if needed in future)

## Future Considerations

If the project needs server-side functionality in the future (e.g., recipe sharing, user accounts):
1. Can add Cloudflare Workers as a backend
2. Or migrate to AWS/GCP with custom header configuration
3. Or switch to self-hosted solution

For MVP, Pixen is 100% client-side and has zero server needs.

## Related ADRs

- ADR-002: Processing Engine (wasm-vips requires COOP/COEP)
- ADR-006: Distribution (where to host desktop binaries)
