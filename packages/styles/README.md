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
- the default theme: tokens for light and dark
- utilities and custom variants

### Importing only what you need

```css
@import "tailwindcss";

@import "@ropav/styles/components/button.css" layer(components);
@import "@ropav/styles/components/chip.css" layer(components);
@import "@ropav/styles/themes/shared/theme.css";
@import "@ropav/styles/themes/default";
```

> The granular subpaths — `./components/*.css`, `./base`, `./base/*.css`, `./themes/*`, `./themes/*.css`,
> `./utilities`, `./variants` — exist **only in the published tarball**; `clean-package.config.json` writes them into
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
│   ├── default.css        # Default theme — hand-written, light and dark token sets
│   ├── sky.css … rabbit.css  # Ten more themes — generated, do not edit
│   ├── all.css            # Every bundled theme, for docs and playgrounds
│   └── shared/
│       └── theme.css      # @theme block — derived values, radius scale, easing curves
├── utilities/index.css    # Tailwind v4 @utility definitions
├── variants/index.css     # Tailwind v4 @custom-variant definitions
├── scripts/themes/        # Build-time theme generator — not published
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

**Every `ropav` component takes a `class` prop**, merged through its `tv()` recipe rather than
concatenated, so a utility that conflicts with one the recipe already carries replaces it. That is
the first thing to reach for. It cannot reach a part drawn in `::before`/`::after`, and it flattens
every state of whatever property it sets — see [State colors](#state-colors) for the way round both.

## Theming

Two independent axes. `data-theme` picks the palette, a `light`/`dark` class picks the appearance:

```html
<html data-theme="netflix" class="dark"></html>
```

Either can be left out. With no `data-theme` you get the default theme; with no class you get light.
The default theme also answers to `[data-theme="light"]` and `[data-theme="dark"]`, which is what it
did before the other themes existed.

### Bundled themes

The default one, plus a theme per brand ported from HeroUI's gallery — `hero` among them, being
HeroUI's own palette. The default is already in `@ropav/styles`; the others are opt-in, one file
each:

```css
@import "@ropav/styles";
@import "@ropav/styles/themes/netflix";
```

| `data-theme` | | `data-theme` | | `data-theme` |
| --- | --- | --- | --- | --- |
| `default` | | `mint` | | `coinbase` |
| `hero` | | `netflix` | | `airbnb` |
| `sky` | | `uber` | | `discord` |
| `lavender` | | `spotify` | | `rabbit` |

Each carries both a light and a dark palette, so a theme is a brand rather than an appearance. There is
no `netflix-dark` — it is `data-theme="netflix"` plus `class="dark"`.

`themes/all.css` pulls in all of them at once. That is for docs and playgrounds; an app should import
only the themes it actually offers, since each is around 10 kB before compression.

Every theme but `default` and `hero` is **generated** — edit `scripts/themes/presets.ts` and run
`pnpm generate:themes`, never the CSS. A preset is four numbers (accent lightness, chroma and hue, plus
the chroma of the neutral ramp), a radius pair, and any exact brand colours that should beat the
calculated ones.

Those two stay hand-written, each file's header saying what the generator cannot reproduce about it.
Their presets carry the label and the presentation order; the CSS is the source of truth for their
tokens.

### Retheming

Every token is a CSS custom property, so overriding them in your own stylesheet is enough — no rebuild
of this package, and no need to go through a theme file at all:

```css
:root {
  --accent: oklch(0.62 0.19 253.83);
  --radius: 0.5rem;
}
```

Author CSS outside a cascade layer outranks everything here, so these win wherever you put them.

To add a theme rather than change the default one, write the same token block under your own attribute.
It has to redeclare the *derived* tokens too, not just the authored ones: a custom property substitutes
`var()` where it is declared, so an `--accent-hover` inherited from `:root` would still be mixed from
the root's `--accent`. Copy a generated theme and edit it, or generate one.

```css
@layer theme {
  [data-theme="ocean"] {
    color-scheme: light;
    --accent: oklch(0.62 0.14 220);
    --accent-hover: color-mix(in oklab, var(--accent) 90%, var(--accent-foreground) 10%);
    /* … */
  }
}
```

A theme only needs to carry colours. Everything keyed on neither the palette nor the appearance —
`--spacing`, `--cursor-*`, the primitives, the shadows, `--backdrop` — stays on `:root` and `.dark` in
`themes/default.css`, both of which keep matching an element that carries a `data-theme`.

### Tokens

Base colors (`--background`, `--surface`, `--overlay`, `--muted`), interactive and status colors
(`--accent`, `--success`, `--warning`, `--danger`, each with a `-foreground` and a derived `-hover` and
`-soft`), form fields (`--field-background`, `--field-border`, `--field-radius`, …), layout knobs
(`--spacing`, `--border-width`, `--radius`, `--ring-offset-width`, `--cursor-interactive`), the
scrollbar set, and shadows.

**`themes/default.css` is the source of truth — read it rather than a list in a README**, which goes
stale the moment a token moves. `themes/shared/theme.css` holds what is derived from those tokens: the
`--radius-xs` … `--radius-4xl` scale and the easing curves.

### State colors

A component's own properties are the third tier, declared on its block and private to its file —
`--button-bg`, `--switch-control-bg-checked-hover`, `--sidebar-rail-line`. The convention:

> **A color a state rule paints goes through a custom property.**

That is what makes one state retunable on its own. A color written straight into the rule is not:
the resting and the lit value are the same property on the same element, so the one declaration a
caller writes to change either beats every state rule at once — and a utility beats them all
whatever their specificity, `utilities` being a later layer than `components`. The only way left is
to restate the whole state set behind `:not()`, which drifts silently the day a state is added.

So a caller sets the property instead, and the states that read the others are left standing:

```html
<!-- No line at rest; it still flares on hover and while dragging. -->
<SidebarRoot class="[--sidebar-rail-line:transparent]">
```

Defaults chain, so retuning one carries the states below it unless they are set too —
`--sidebar-rail-line-dragging` follows `--sidebar-rail-line-hover`, the way `--button-bg-pressed`
follows `--button-bg-hover`. Read `components/button.css` for the shape and
`components/sidebar.css` for a part painted on a pseudo-element, which a class cannot reach at all.

Two limits. The properties are per component and resolve to the tokens above, so a palette change
belongs in a theme rather than here. And Forced Colors Mode is not covered: those blocks paint the
system keywords, which are the only colors exempt from the override and not a component's to
retune — `[--sidebar-rail-line:transparent]` leaves the line drawn under High Contrast, on purpose.

`state-colors.test.ts` in the `ropav` package holds the components not yet converted, each with the
count it is down to, and fails on a new state color anywhere else.

### Reduced motion

`data-reduce-motion="true"` on any ancestor forces animations off, `"false"` forces them on regardless
of the OS setting, and with neither the `prefers-reduced-motion` media query decides. Defined as the
`motion-reduce` / `motion-safe` variants in `variants/index.css`.

### Forced colors

Forced Colors Mode - Windows High Contrast - replaces author colours with the user's own palette and
strips `box-shadow` outright. That second part is what makes it more than a colour question here:
every ring in this library *is* a `box-shadow`, because that is what `ring-*` compiles to, and it sits
on top of `outline-none`. Left alone, a focused control would have no indicator at all.

Nothing to opt into. The three focus utilities - `focus-ring`, `focus-field-ring`,
`invalid-field-ring` - draw an outline back in `Highlight` under `forced-colors: active`, so any
component that goes through `status-focused`, `status-focused-field` or `status-invalid-field` is
covered without a line of its own. `status-disabled` picks up `GrayText` the same way.

The other half is state carried only by `background-color`, which the override flattens into its
surroundings. Where selection is *just* a background - a tag, a calendar day, a table row - apply
`forced-selected`, **as an `@apply` statement of its own**:

```css
.thing[data-selected="true"] {
  @apply bg-accent text-accent-foreground;
  @apply forced-selected;
}
```

Folded into the line above it, Tailwind sorts the list and hoists the nested media query over the
plain declarations, and the `background-color` it exists to override wins instead. Where selection
also moves a thumb or shows a glyph, the component writes its own `forced-colors` block, because
those parts need colours of their own - see `switch.css`, `radio.css`, `tabs.css`, `range-calendar.css`,
`slider.css` and `skeleton.css`.

Use the system colour keywords, not tokens: `Highlight` / `HighlightText` for a selected control,
`CanvasText` on `Canvas` for ordinary content, `ButtonBorder` for a control's edge, `GrayText` for
disabled. They are the only colours exempt from the override.

Watch for `transparent` used as a spacer. Forced colors preserves a transparent *background*, but a
transparent `border-color` is turned **opaque** - so a border held open purely to reserve layout space
(`slider.css` does this at both ends of the track) stops being invisible and renders as a solid block.
Restate those as `Canvas` inside the media query.

One trap, and `getComputedStyle` cannot see it. Chromium paints a `Canvas`-coloured **backplate**
behind the text of any element that has text, so that text over an image stays legible. It lands on
top of that element's own background, so a `Highlight` fill carrying `HighlightText` renders as a
solid plate with the label invisible inside it - the colours are all correct and the component is
unreadable. `forced-color-adjust: none` is what suppresses the backplate. `forced-selected` already
carries it; anything hand-rolling the same pairing needs it too, including the case where the fill
sits on a different element than the text (`tabs.css`, `range-calendar.css`). Reach for it only
alongside explicit system colours - on its own it just hands the author's palette back, which is the
opposite of the point.

Structure has to survive the mode as well as state. A component that is only a tinted fill and a
shadow - a card, an alert, a text field, a chip - renders as loose text once both are taken, which
reads as no component at all. So every container carries an inset `CanvasText` outline under the
mode and every control a `ButtonBorder` one, on the variants that actually paint; a transparent
surface is left alone, since framing it would invent a box that was never there. A separator is the
exception that proves it: the whole thing *is* its background, so it takes a colour rather than an
edge.

Two things guard it. `forced-colors.browser.test.ts` in the `ropav` package asserts the stylesheet
directly, and the Storybook package runs **every story** through an audit that renders it twice - the
mode off, then on over CDP - and fails on anything that painted something and stops painting it. The
second one exists because the first cannot see this class of bug on its own: the colour override runs
after the cascade and the backplate is painted later still, so a component reports every declared
colour correctly while rendering as a blank block. Three bugs shipped that way before the audit
existed.

To look at it by hand, use Chromium's rendering panel - DevTools, `Cmd+Shift+P`, "Show Rendering",
then *Emulate CSS media feature forced-colors* - and note that **macOS has no Forced Colors Mode at
all**: "Increase contrast" maps to `prefers-contrast: more`, so switching it on tests nothing. There
is deliberately no toolbar control in Storybook. `data-reduce-motion` is an attribute a decorator can
set, but this is a browser-level media feature an iframe cannot turn on for itself, and faking it with
a stylesheet of system colours would miss the `box-shadow` removal - the part that actually breaks.

## Build

```bash
pnpm --filter @ropav/styles build
```

Rolldown emits `dist/` as ES modules with `preserveModules` and one entry per component, `tsc` emits the `.d.ts`
files, the CSS is copied across untouched, and `@tailwindcss/cli` produces the minified `dist/ropav.min.css`.

`pnpm --filter @ropav/styles measure-size` prints a size report and writes `bundle-size.json`.

Only the published tarball needs the build. In the workspace, `exports` point straight at the sources
(`src/index.ts` and `index.css`), so editing a `.css` file shows up in Storybook and in the browser test suite
with no build step.

## License

Apache-2.0 — see `LICENSE` at the repo root, which keeps the original copyright.
