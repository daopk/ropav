# Ropav

Experimental UI component library for Vue Vapor.

## Install

```bash
pnpm add ropav vue
```

## Usage

```ts
import 'ropav/base.css';
import { Button, Input } from 'ropav';
```

Deep imports are available for individual components:

```ts
import { Button } from 'ropav/button';
```

## Theming and tokens

`ropav/base.css` exposes the public runtime token API as CSS custom properties. These
tokens are intended for stable theme axes that consumers may override without
rebuilding the library:

- semantic colors, surfaces, text, borders, focus rings, overlays, `on-*`, and
  `*-fg`
- typography: `--rp-font-family`, `--rp-font-size-*`, `--rp-font-weight-*`, and
  `--rp-line-height-*`
- density and control primitives: `--rp-spacing-*`, `--rp-size-control-*`,
  `--rp-border-width-*`, and `--rp-opacity-disabled`
- radius, shadows, and transitions

Sass tokens exported through `ropav/scss/*` are implementation/build-time tokens.
They may include raw palette values, z-index values, component layout constants,
and mixin inputs that are not part of the runtime CSS variable contract.

Component-local custom properties that start with `--_` are private implementation
details. They are not versioned API and may change between releases.

Migration note: Ropav only supports the allowlisted runtime tokens above as public
CSS variables. Raw palette variables such as `--rp-color-gray-*`,
`--rp-color-white`, `--rp-color-black`, z-index variables, component layout
variables, and component-state variables such as `--rp-button-solid-hover-bg` are
not public runtime tokens.

## Development

```bash
pnpm install
pnpm dev
pnpm lint
pnpm format:check
pnpm test
pnpm build
```
