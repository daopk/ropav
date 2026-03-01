# Ropav

**Ropav** (_Vapor_ reversed) is an experimental UI component library for [Vue Vapor](https://github.com/vuejs/vue-vapor).
It provides reusable components with a lightweight theming system based on CSS custom properties.

## Installation

```bash
pnpm add ropav vue
```

## Quick Start

```ts
// main.ts
import 'ropav/base.css'
import { Button, Avatar } from 'ropav'
```

For tree-shaking, you can import components individually:

```ts
import { Button } from 'ropav/button'
import { Avatar } from 'ropav/avatar'
```

## Theming

Ropav exposes design tokens via CSS variables. Override them after importing `base.css`.
Default tokens already include dark mode values through the `html.dark` selector, so dark theme works out of the box when your app toggles that class.

```css
/* app.css */
:root {
  --rp-color-primary: #e11d48;
  --rp-color-secondary: #7c3aed;
  --rp-font-family: 'Geist', system-ui, sans-serif;
  --rp-radius-lg: 1rem;
}
```

You can also scope overrides to a container (for example, dark mode):

```css
html.dark {
  --rp-color-primary: #60a5fa;
  --rp-color-text: #fafafa;
  --rp-color-background: #09090b;
}
```

### SCSS Override (Advanced)

If your project uses Sass, override defaults at compile time:

```scss
@use 'ropav/scss/_variables.scss' with (
  $color-primary: #e11d48,
  $color-secondary: #7c3aed,
  $font-family-base: 'Geist' system-ui sans-serif
);

@use 'ropav/scss/_tokens.scss';
```

## Development

```bash
pnpm install
pnpm storybook
pnpm build
```
