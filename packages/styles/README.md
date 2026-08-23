# @ropav/styles

The style layer behind [`ropav`](https://www.npmjs.com/package/ropav): plain CSS for every component,
themes, utilities, and custom variants, plus `tv()` variants that do nothing but map props to class names.
Framework-agnostic — not a line of Vue or React in it. `dependencies` are `tailwind-variants` and
`tw-animate-css`; the only peer is `tailwindcss`.

## Provenance

A derivative work of [`@heroui/styles@3.2.4`](https://github.com/heroui-inc/heroui/tree/v3.2.4/packages/styles),
vendored into this workspace so the style layer can be fixed in place. See the root [README](../../README.md).

## Installation

Inside this repo it is a workspace dependency:

```json
{"dependencies": {"@ropav/styles": "workspace:*"}}
```

Outside the repo you do not install it yourself — `ropav` depends on it and npm pulls it in.

## Usage

### Basic setup

Import the stylesheet once, from your app's main CSS file:

```css
@import "@ropav/styles";
```

That single line pulls in, in layer order (`theme, base, components, utilities`):

- Tailwind CSS v4 and `tw-animate-css`
- base styles and the scrollbar system
- the component layer — 85 files, one per component
- the default theme: variables for light and dark, plus per-component theme overrides
- utilities and custom variants

### Importing only what you need

```css
@import "tailwindcss";

@import "@ropav/styles/components/button.css" layer(components);
@import "@ropav/styles/components/chip.css" layer(components);
@import "@ropav/styles/themes/default" layer(theme);
```

> The granular subpaths — `./components/*.css`, `./base`, `./base/*.css`, `./themes/*`, `./utilities`,
> `./variants` — exist **only in the published tarball**; `clean-package.config.json` writes them into
> `exports` at `prepack` time. Inside the workspace, import the files from `packages/styles/` by relative path
> instead.

### Variants

```ts
import {buttonVariants, type ButtonVariants} from "@ropav/styles";

buttonVariants({variant: "primary", size: "sm"}); // "button button--primary button--sm"
```

Every component also has its own subpath so bundlers can drop the rest:
`@ropav/styles/components/button`.

## Package structure

```
packages/styles/
├── index.css              # Entry point — declares layer order, then imports everything below
├── base/
│   ├── base.css           # Layout tokens, typography, resets
│   └── scrollbar.css      # Scrollbar system
├── components/            # 85 CSS files, one per component
├── themes/
│   ├── default/
│   │   ├── variables.css  # Light and dark token sets
│   │   ├── index.css      # Theme entry point
│   │   └── components/    # Per-component theme overrides
│   └── shared/
│       └── theme.css      # @theme block — derived values, radius scale, easing curves
├── utilities/index.css    # Tailwind v4 @utility definitions
├── variants/index.css     # Tailwind v4 @custom-variant definitions
└── src/                   # TypeScript: tv() variants + shared utility class strings
```

## Class naming

BEM, so a class can be read without looking it up:

- **Block** — the component itself: `.button`, `.card`, `.alert`
- **Modifier** — a variation, double dash: `.button--primary`, `.button--lg`, `.button--icon-only`
- **Element** — a part of the component, double underscore: `.card__header`, `.alert__icon`

```html
<button class="button">Click me</button>
<button class="button button--primary">Save</button>
<button class="button button--primary button--sm">Small primary</button>
```

Two conventions the whole layer relies on:

**Default size lives in the base class.** `.button` already renders at the `--md` size, so `.button--md` is an
empty rule with a comment saying why. A component with no size modifier never looks broken.

**State keys on `data-*`, with a pseudo-class fallback.** Interactive rules are written as
`&:hover, &[data-hovered="true"]`, `&:active, &[data-pressed="true"]`, `&:focus-visible,
&[data-focus-visible="true"]` — so the same CSS works whether state comes from the browser or from a
component that publishes it as an attribute.

`components/button.css` is the densest example of both — read it before writing a new component file.

## Theming

Light is the default on `:root`; dark turns on with a `.dark` class or `[data-theme="dark"]`:

```html
<html data-theme="dark"></html>
```

Every token is a CSS custom property, so overriding them in your own stylesheet is enough to retheme — no
rebuild of this package:

```css
:root {
  --accent: oklch(0.62 0.19 253.83);
  --radius: 0.5rem;
  --field-radius: calc(var(--radius) * 1.5);
}
```

Tokens cover base colors (`--background`, `--surface`, `--overlay`, `--muted`), interactive and status colors
(`--accent`, `--success`, `--warning`, `--danger`, each with a `-foreground` and a derived `-hover`), form
fields (`--field-background`, `--field-border`, `--field-radius`, …), layout knobs (`--spacing`,
`--border-width`, `--radius`, `--ring-offset-width`, `--cursor-interactive`), the scrollbar set, and shadows.

**`themes/default/variables.css` is the source of truth — read it rather than a list in a README**, which goes
stale the moment a token moves. `themes/shared/theme.css` holds what is derived from those tokens: the
`--radius-xs` … `--radius-4xl` scale, `color-mix()` hover and soft variants, and the easing curves.

## Build

```bash
pnpm --filter @ropav/styles build
```

Rollup emits `dist/` as ES modules with `preserveModules` and one entry per component, `tsc` emits the `.d.ts`
files, the CSS is copied across untouched, and `@tailwindcss/cli` produces the minified `dist/ropav.min.css`.

`pnpm --filter @ropav/styles measure-size` prints a size report and writes `bundle-size.json`.

Only the published tarball needs the build. In the workspace, `exports` point straight at the sources
(`src/index.ts` and `index.css`), so editing a `.css` file shows up in Storybook and in the browser test suite
with no build step.

## License

Apache-2.0 — see `LICENSE` at the repo root, which keeps the original copyright.
