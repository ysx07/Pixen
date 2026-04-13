---
status: accepted
created: 2025-04-13
---

# ADR-001: Frontend Framework — React + Vite

## Decision

Use **React 18+** with **Vite** as the frontend framework and build tool.

## Context

The project needs a modern JavaScript framework with strong ecosystem support for:
- Complex interactive UI (drag-and-drop, real-time preview, operation composition)
- WASM integration (wasm-vips image processing)
- Fast development iteration (HMR)
- Good portfolio recognition for code review visitors

## Rationale

### React + Vite chosen because:

1. **Portfolio Recognition:** React is widely recognized. Code reviewers will be immediately oriented and can assess code quality without a learning curve.
2. **WASM Handling:** Vite has excellent built-in WASM support and optimizations
3. **HMR Performance:** Fast refresh cycles for development velocity
4. **Ecosystem:** Strong UI component libraries (Radix UI, shadcn/ui), state management options (Zustand, Jotai)
5. **Build Performance:** Vite's esbuild-based bundling is 10-100x faster than webpack

### Alternative Considered: Svelte + Vite

**Pros:**
- Smaller bundle size (~30% smaller)
- Faster runtime (less abstraction overhead)
- Excellent for tool-oriented UIs
- Leaner code (no props boilerplate)

**Cons:**
- Lower portfolio recognition outside the Svelte community
- Smaller ecosystem for complex UI components (e.g., specialized sliders, drag-drop)
- Fewer developers on the market familiar with Svelte
- Less suitable for "show your code to someone unfamiliar with your stack" scenario

**Decision:** React is the safer choice for portfolio work. If you prefer Svelte's development experience, that's a valid alternative and should be decided at project kickoff with implementation agents.

## Consequences

### Positive
- Code is familiar to most JavaScript developers
- Large ecosystem for UI components and utilities
- Strong TypeScript support
- Easy to hire or collaborate with other developers

### Negative
- Bundle size slightly larger than Svelte equivalent (~10-15% overhead)
- More boilerplate for simple components (props, hooks)
- Requires understanding of React patterns (hooks, closures, dependencies)

## Implementation Notes

- Use React 18 with TypeScript strict mode
- Prefer functional components and hooks
- Use Context API for state management initially; migrate to Zustand if complexity grows
- Implement React.lazy() for code splitting (Pipeline builder, AI features)
- Use React.memo() for preview canvas to avoid re-renders

## Related ADRs

- ADR-002: Processing Engine (wasm-vips)
- ADR-003: AI Inference Engine (ONNX Runtime Web)
