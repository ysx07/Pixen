# Task Plan

## Current Phase
Phase 3: Organization & Grouping — **COMPLETE**
Phase 4: Recipe System — **pending (next)**

---

## Phase 3 Decisions (archived)
- OrganizeConfig in its own Zustand store (not part of pipeline ops)
- EXIF reads lazy at organize time, from item.file (original not output)
- OrganizePanel at bottom of PipelineBuilder as terminal section
- OrganizePreview in left pane after batch completes
- Combined mode = date-then-size (implemented — it is the origin story scenario)
- Single-level folder paths only (`2024-03` not `2024/2024-03`)

---

## Phase 4: Recipe System

**Goal:** Pipelines are reusable, saveable, and shareable.

**Complexity:** Low — Haiku 4.5 recommended (CRUD, JSON schema, URL encoding — no novel algorithms)

**Exit criteria:** A user can save their Instagram preset recipe, export it as JSON, and a different user can import it and run it.

### Key entry points
- `src/stores/recipes.ts` — scaffolded in Phase 0, needs implementing
- `src/types/index.ts` `Recipe` interface — ready (`id`, `name`, `version`, `created`, `operations`, `organize?`)
- Storage: `localStorage` for web (key `pixen_recipes`), JSON serialization only
- No new worker types needed

### Tasks

#### Storage / CRUD
- [ ] Implement `src/stores/recipes.ts` — `recipes: Recipe[]`, `save`, `load`, `delete`, `duplicate`, `import`, `export` actions; persistence via `localStorage` using `zustand/middleware` persist

#### Built-in presets
- [ ] Define 5 presets in `src/utils/recipe-presets.ts`:
  - Instagram 1:1 — resize 1080×1080 cover + compress perceptual web-optimized + convert webp
  - Shopify Product — resize 2000×2000 contain + pad white + compress perceptual + convert jpeg
  - Twitter/X Post — resize 1200×675 cover + compress perceptual + convert jpeg
  - Web General — convert webp + compress perceptual web-optimized
  - Archive — convert png + strip metadata (lossless)

#### Recipe validation
- [ ] `src/utils/recipe-schema.ts` — JSON schema validator (lightweight, manual check — no ajv dep needed for Phase 4); validates `version`, `operations[]` each have known `type`

#### Import / Export
- [ ] Export: serialize `Recipe` to JSON and trigger download (`recipe-name.json`)
- [ ] Import: file input → JSON parse → schema validate → add to store; show inline error on bad schema
- [ ] URL encode: `btoa(JSON.stringify(recipe))` → `?recipe=<base64>` query param; load on mount if present

#### UI
- [ ] `src/components/RecipeLibrary.tsx` — drawer or panel; recipe list with: name, op summary, tags; Load / Delete / Duplicate / Export buttons per item
- [ ] `src/components/RecipeCard.tsx` — compact card showing op icons/labels at a glance, platform tag
- [ ] "Save as recipe" button in PipelineBuilder header — opens a name input dialog, saves to store
- [ ] "Recipes" button to open RecipeLibrary panel
- [ ] Import recipe button (file input, hidden `<input type="file">`)
- [ ] "Share recipe" button — copies URL with encoded recipe to clipboard

#### Wire up
- [ ] `src/App.tsx` — on mount, check `?recipe=` query param and load if valid; wire RecipeLibrary open/close

### Files to create
| File | Purpose |
|------|---------|
| `src/utils/recipe-presets.ts` | 5 built-in platform presets |
| `src/utils/recipe-schema.ts` | Lightweight recipe JSON validator |
| `src/components/RecipeLibrary.tsx` | Full recipe list panel/drawer |
| `src/components/RecipeCard.tsx` | Compact recipe card |

### Files to modify
| File | Change |
|------|--------|
| `src/stores/recipes.ts` | Implement full CRUD + persist |
| `src/components/PipelineBuilder.tsx` | "Save as recipe" + "Recipes" buttons in header |
| `src/App.tsx` | URL param loading on mount, RecipeLibrary wiring |
| `package.json` | No new deps expected |
