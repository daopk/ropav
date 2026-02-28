# Ropav

**Ropav** (_Vapor_ reversed) — an experimental UI component library built for [Vue Vapor](https://github.com/vuejs/vue-vapor), with customizable design tokens.

## Installation

```bash
pnpm add ropav vue
```

## Quick Start

```ts
// main.ts
import 'ropav/base.css'  // design tokens (CSS custom properties)

import { Button, Avatar } from 'ropav'
```

Components can also be imported individually for tree-shaking:

```ts
import { Button } from 'ropav/button'
import { Avatar } from 'ropav/avatar'
```

## Customizing Styles

Ropav uses CSS Custom Properties (CSS variables) for all design tokens. There are two ways to override them depending on your needs.

### Option 1: CSS Custom Properties (recommended)

Override any token by redefining CSS variables after importing `base.css`. No Sass required.

```css
/* your-app.css */
:root {
  --rp-color-primary: #e11d48;
  --rp-color-secondary: #7c3aed;
  --rp-font-family: 'Geist', system-ui, sans-serif;
  --rp-radius-lg: 1rem;
}
```

You can scope overrides to specific containers:

```css
.dark-theme {
  --rp-color-primary: #60a5fa;
  --rp-color-text: #fafafa;
  --rp-color-background: #09090b;
}
```

### Option 2: SCSS Source Override (advanced)

If you have Sass in your build pipeline, you can override SCSS variables at compile time. This lets you change the defaults before CSS custom properties are generated.

```scss
// Import variables with your overrides
@use 'ropav/scss/_variables.scss' with (
  $color-primary: #e11d48,
  $color-secondary: #7c3aed,
  $font-family-base: 'Geist' system-ui sans-serif
);

// Then import tokens to generate :root CSS vars from your overridden values
@use 'ropav/scss/_tokens.scss';
```

### Available Tokens

| Token | CSS Variable | Default |
|---|---|---|
| **Font** | | |
| Font family | `--rp-font-family` | `system-ui, -apple-system, ...` |
| **Colors** | | |
| Primary | `--rp-color-primary` | `#3b82f6` |
| Secondary | `--rp-color-secondary` | `#6366f1` |
| Success | `--rp-color-success` | `#22c55e` |
| Warning | `--rp-color-warning` | `#f59e0b` |
| Danger | `--rp-color-danger` | `#ef4444` |
| Info | `--rp-color-info` | `#06b6d4` |
| Text | `--rp-color-text` | `#18181b` |
| Text secondary | `--rp-color-text-secondary` | `#71717a` |
| Border | `--rp-color-border` | `#e4e4e7` |
| Background | `--rp-color-background` | `#ffffff` |
| **Font sizes** | | |
| XS | `--rp-font-size-xs` | `0.75rem` |
| SM | `--rp-font-size-sm` | `0.875rem` |
| Base | `--rp-font-size-base` | `1rem` |
| LG | `--rp-font-size-lg` | `1.125rem` |
| XL | `--rp-font-size-xl` | `1.25rem` |
| **Spacing** | | |
| 1 | `--rp-spacing-1` | `0.25rem` |
| 2 | `--rp-spacing-2` | `0.5rem` |
| 3 | `--rp-spacing-3` | `0.75rem` |
| 4 | `--rp-spacing-4` | `1rem` |
| 6 | `--rp-spacing-6` | `1.5rem` |
| 8 | `--rp-spacing-8` | `2rem` |
| **Border radius** | | |
| SM | `--rp-radius-sm` | `0.125rem` |
| Base | `--rp-radius-base` | `0.25rem` |
| MD | `--rp-radius-md` | `0.375rem` |
| LG | `--rp-radius-lg` | `0.5rem` |
| XL | `--rp-radius-xl` | `0.75rem` |
| Full | `--rp-radius-full` | `9999px` |
| **Component sizes** | | |
| SM | `--rp-size-sm` | `32px` |
| MD | `--rp-size-md` | `40px` |
| LG | `--rp-size-lg` | `48px` |
| **Shadows** | | |
| SM | `--rp-shadow-sm` | `0 1px 2px 0 rgba(0,0,0,0.05)` |
| Base | `--rp-shadow-base` | `0 1px 3px ...` |
| MD | `--rp-shadow-md` | `0 4px 6px ...` |
| LG | `--rp-shadow-lg` | `0 10px 15px ...` |
| **Transitions** | | |
| Fast | `--rp-transition-fast` | `150ms ease` |
| Base | `--rp-transition-base` | `200ms ease` |
| Slow | `--rp-transition-slow` | `300ms ease` |

## Font

Ropav uses the system font stack by default (`system-ui, -apple-system, Segoe UI, Roboto, ...`). To use a custom font, override the CSS variable:

```css
:root {
  --rp-font-family: 'Your Font', system-ui, sans-serif;
}
```

## Development

```bash
pnpm install
pnpm storybook    # dev with Storybook
pnpm build        # build library
```
