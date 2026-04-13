# Design System

<!-- This file defines the visual tokens for your website (code-first design path) -->
<!-- If using Stitch MCP, the design system lives in .stitch/DESIGN.md instead -->
<!-- Created during /site-design (Path B: Code-first) -->

## Visual Theme & Atmosphere
<!-- Mood, density, aesthetic philosophy -->
<!-- Example: "Clean and spacious with sharp typography. Editorial feel — content breathes." -->

## Color Palette

<!-- Use OKLCH for perceptual uniformity. Never pure black or pure white. -->
<!-- Tint all neutrals toward the brand hue (even chroma of 0.005-0.01 feels natural). -->

| Role | Name | Value | Usage |
|------|------|-------|-------|
| Primary | <!-- e.g., Deep Blue --> | <!-- oklch(55% 0.15 250) --> | CTAs, links, active states |
| Primary Light | | | Hover states, backgrounds |
| Primary Dark | | | Text on light, pressed states |
| Surface | | | Page background, card backgrounds |
| Surface Elevated | | | Cards, modals, dropdowns |
| Text | | | Primary body text |
| Text Muted | | | Secondary text, captions |
| Accent | | | Highlights, badges, decorative |
| Success | | | Confirmation states |
| Error | | | Error states, destructive actions |

## Typography

<!-- Choose distinctive fonts. Avoid: Inter, Roboto, Open Sans, Arial, Lato, Montserrat. -->
<!-- Better alternatives: Instrument Sans, Plus Jakarta Sans, Outfit, Fraunces, Newsreader -->

| Role | Font | Weight | Size | Line Height |
|------|------|--------|------|-------------|
| Display / H1 | | | | |
| H2 | | | | |
| H3 | | | | |
| Body | | | | |
| Small / Caption | | | | |
| Navigation | | | | |

**Font source**: <!-- Google Fonts URL or @fontsource packages -->

## Spacing Scale

<!-- Use a consistent base unit. Vary spacing for rhythm. -->
<!-- Example: 4px base → 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 -->

## Component Styles

### Buttons
<!-- Shape, padding, border-radius, hover/active/disabled states -->

### Cards / Containers
<!-- Border-radius, shadow, background, padding -->

### Inputs / Forms
<!-- Border style, focus state, label position, error styling -->

### Navigation
<!-- Layout, active indicator, mobile behavior -->

## Motion Principles

<!-- Easing curves — never use bounce/elastic (dated) -->
```css
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
```

<!-- Duration ranges -->
<!-- 100-150ms: Instant feedback (button, toggle) -->
<!-- 200-300ms: State changes (hover, menu) -->
<!-- 300-500ms: Layout changes (accordion, modal) -->
<!-- 500-800ms: Entrance animations (page load) -->

## Layout Principles
<!-- Grid system, max-width, breakpoints, whitespace strategy -->
<!-- Example: "Max content width 1200px. 16px gutter on mobile, 24px tablet, 32px desktop." -->
