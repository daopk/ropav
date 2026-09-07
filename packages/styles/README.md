# @ropav/styles

The style layer behind [`ropav`](https://www.npmjs.com/package/ropav): a rule set for every component,
themes and utilities, plus `tv()` variants that do nothing but map props to class names.
Framework-agnostic — not a line of Vue or React in it, no dependency, and no peer. Plain CSS
either way you take it.

**[Theming guide](https://ropav.netlify.app/theming/)** ·
[Tokens](https://ropav.netlify.app/theming/tokens) ·
[Class names](https://ropav.netlify.app/theming/class-names) ·
[State colors](https://ropav.netlify.app/theming/state-colors)

## Provenance

A derivative work of [`@heroui/styles@3.2.4`](https://github.com/heroui-inc/heroui/tree/v3.2.4/packages/styles),
vendored into this workspace so the style layer can be fixed in place. See
[`ropav`](https://www.npmjs.com/package/ropav) for the rest.

## Installation

Inside this repo it is a workspace dependency:

```json
{"dependencies": {"@ropav/styles": "workspace:*"}}
```

Outside the repo you do not install it yourself — `ropav` depends on it and npm pulls it in.

## Usage

### Basic setup

`@ropav/styles` is the entry, a list of `@import` statements for anything that follows them;
`@ropav/styles/bundled.css` is the same stylesheet already resolved, for a page with nothing to
follow them. Either one, once, from your app's main CSS file:

```css
/* your bundler resolves the imports */
@import "@ropav/styles";

/* already resolved */
@import "@ropav/styles/bundled.css";
```

The compiled file is also what the CDN fields point at, so a page can take it with no bundler:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ropav/styles" />
```

> Reach for `bundled.css` if nothing in your pipeline follows a CSS `@import`. The entry above is
> a set of them, so unresolved it succeeds and produces nothing — the app renders unstyled and
> nothing errors. That shipped once.

Either way you get, in layer order (`theme, base, components, utilities`):

- the scoped reset, and the keyframes the components animate through
- base styles and the scrollbar system
- the component layer — 88 files, one per component
- the default theme: tokens for light and dark, and every token a rule names directly
- the classes offered by name rather than through a component

The one thing it does not carry is the page's own `font-family` and `line-height`. The reset is
scoped to the `rp-` prefix, and a rule that stops at the component cannot set those — they live on
`html` and belong to the app. Any ordinary reset supplies them; without one the components inherit
the browser's default, which is a serif.

### Importing only what you need

Everything the components stand on comes first, once — the registrations, the motion switch and
the tokens are not optional, and leaving one out fails quietly rather than loudly:

```css
@import "@ropav/styles/base/reset.css";
@import "@ropav/styles/base/base.css" layer(base);
@import "@ropav/styles/base/scrollbar.css" layer(base);
@import "@ropav/styles/motion.css";
@import "@ropav/styles/slots.css";
@import "@ropav/styles/animations.css";
@import "@ropav/styles/themes/default";
@import "@ropav/styles/themes/shared/tokens.css";

@import "@ropav/styles/components/button.css" layer(components);
@import "@ropav/styles/components/chip.css" layer(components);
```

> `./bundled.css` and the pattern subpaths — `./components/*.css`, `./base`, `./base/*.css`, `./themes/*`,
> `./themes/*.css`, `./utilities` — exist **only in the published tarball**;
> `clean-package.config.json` writes them into `exports` at `prepack` time. Inside the workspace, import the
> files from `packages/styles/` by relative path instead.

### Variants

```ts
import {buttonVariants, type ButtonVariants} from "@ropav/styles";

buttonVariants({variant: "primary", size: "sm"}); // "rp-button rp-button--primary rp-button--sm"
```

Every component also has its own subpath so bundlers can drop the rest:
`@ropav/styles/components/button`.

## Package structure

```
packages/styles/
├── index.css              # Entry point — declares layer order, then imports everything below
├── motion.css             # `--rp-motion`, the switch every animated declaration reads
├── slots.css              # `@property` registrations the component rules compose through
├── animations.css         # Every keyframe, names being document-global
├── base/
│   ├── reset.css          # The reset, scoped to the `rp-` prefix
│   ├── base.css           # Layout tokens, typography
│   └── scrollbar.css      # Scrollbar system
├── components/            # 88 CSS files, one per component
├── themes/
│   ├── default.css        # Default theme — hand-written, light and dark token sets
│   ├── sky.css … rabbit.css  # Ten more themes — generated, do not edit
│   ├── all.css            # Every bundled theme, for docs and playgrounds
│   └── shared/
│       └── tokens.css     # Every token a rule spells directly — type scale, weights, curves
├── utilities/index.css    # The classes offered by name rather than through a component
├── scripts/themes/        # Build-time theme generator — not published
└── src/                   # TypeScript: tv() variants + shared utility class strings
```

## Class naming

Prefixed BEM, so a class can be read without looking it up and belongs to nobody else:

- **Prefix** — `rp-`, on every class the component layer defines
- **Block** — the component itself: `.rp-button`, `.rp-card`, `.rp-alert`
- **Modifier** — a variation, double dash: `.rp-button--primary`, `.rp-button--lg`, `.rp-button--icon-only`
- **Element** — a part of the component, double underscore: `.rp-card__header`, `.rp-alert__icon`

```html
<button class="rp-button">Click me</button>
<button class="rp-button rp-button--primary">Save</button>
<button class="rp-button rp-button--primary rp-button--sm">Small primary</button>
```

**The prefix is not decoration.** Component rules live in the `components` layer and a host app's
CSS is usually unlayered, so the host wins every property it declares — and what leaks onto it is
every property it never mentioned. A host element wearing a bare `menu` or `card` would inherit
half a component and no error anywhere. `rp-` is what stops the library from claiming names it does
not own; keyframes and `view-transition-class` names carry it for the same reason, being
document-global too. `tests/styles/class-prefix.test.ts` in `ropav` fails on any that does not.

Two conventions the whole layer relies on:

**Default size lives in the base class.** `.rp-button` already renders at the `--md` size, so
`.rp-button--md` is an empty rule with a comment saying why. A component with no size modifier
never looks broken.

**State keys on `data-*`, with a pseudo-class fallback.** Interactive rules are written as
`&:hover, &[data-hovered="true"]`, `&:active, &[data-pressed="true"]`, `&:focus-visible,
&[data-focus-visible="true"]` — so the same CSS works whether state comes from the browser or from a
component that publishes it as an attribute.

`components/button.css` is the densest example of both — read it before writing a new component file.

**Every `ropav` component takes a `class` prop**, appended to the classes its `tv()` recipe
carries. A utility passed that way wins on cascade order alone — component rules live in the
`components` layer, utilities in the later `utilities` one — so nothing has to be stripped for it
to take effect. That is the first thing to reach for. It cannot reach a part drawn in
`::before`/`::after`, and it flattens every state of whatever property it sets — see
[State colors](#state-colors) for the way round both.

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
stale the moment a token moves. `themes/shared/tokens.css` holds the rest of what a rule can name
directly: the type scale, the weights and the easing curves.

There is no `--radius-*` scale to read. A step is a multiple written where it is used —
`calc(var(--radius) * 3)` — so a `data-theme` setting its own `--radius` moves every corner at once,
which a scale declared on `:root` could not do.

### State colors

A component's own properties are the third tier, declared on its block and private to its file —
`--button-bg`, `--switch-control-bg-checked-hover`, `--sidebar-rail-line`. The convention:

> **A color a state rule paints goes through a custom property — where more than one state paints
> that property.**

That is what makes one state retunable on its own. A color written straight into the rule is not:
the resting and the lit value are the same property on the same element, so the one declaration a
caller writes to change either beats every state rule at once — and a utility beats them all
whatever their specificity, `utilities` being a later layer than `components`. The only way left is
to restate the whole state set behind `:not()`, which drifts silently the day a state is added.

So a caller sets the property instead, and the states that read the others are left standing:

```html
<!-- No line at rest; it still flares on hover and while dragging. -->
<Sidebar class="[--sidebar-rail-line:transparent]">
```

The qualifier is what keeps this from becoming surface for its own sake. Where exactly one state
paints a property, a caller can name that state from the call site — `hover:bg-*`, `focus-visible:outline-*` —
and there is no other state for it to flatten, so no property is minted. It is the second state
painting the same thing that makes the call site unable to tell them apart.

Defaults chain, so retuning one carries the states below it unless they are set too —
`--sidebar-rail-line-dragging` follows `--sidebar-rail-line-hover`, the way `--button-bg-pressed`
follows `--button-bg-hover`. Read `components/button.css` for the shape and
`components/sidebar.css` for a part painted on a pseudo-element, which a class cannot reach at all.

Two limits. The properties are per component and resolve to the tokens above, so a palette change
belongs in a theme rather than here. And Forced Colors Mode is not covered: those blocks paint the
system keywords, which are the only colors exempt from the override and not a component's to
retune — `[--sidebar-rail-line:transparent]` leaves the line drawn under High Contrast, on purpose.

`state-colors.test.ts` in the `ropav` package reads every component file and fails on a state color
that does not go through a property. Its ledger of exceptions is currently empty, so an entry
appearing there is debt to pay down rather than a licence to add more.

### Translucent surfaces

A `surface--transparent` paints nothing of its own, and so does a surface a caller has thinned to
let something through — a blurred header, a panel over an image, a window whose material the OS
draws. What sits on one of those has no way to know what is behind it, and that splits the palette
in two.

**Safe on anything: the tokens that are an alpha.** `--state-layer` is what a state paints, and
`--separator` and `--border` are the lines — each an alpha of `--surface-foreground` rather than a
neutral of its own. An alpha darkens or lightens whatever it lands on, so it holds its contrast
against a fill it was never tuned for: another surface, the far half of the theme, or a photograph.
The `-soft` family and `--scrollbar-thumb` are alphas too, which is why a selection is
`--accent-soft` wherever the library marks one.

**Not safe: the fills.** `--default`, `--accent`, the status colors, `--surface` and its secondary
and tertiary steps are opaque, and they are meant to be — a badge you can read the page through is a
broken badge. They assume a background because they *are* one. Use them to fill a box, never to mark
a state on a box that is already transparent.

`--surface-hover` sits on the fill side of that line despite the name: it is a surface that has been
tinted and stays opaque, for a component opaque at rest whose hover must stay that way.
`--state-layer` is the one for a component transparent at rest. Reaching for the wrong one fails
quietly — a translucent hover on an opaque tag shows the page through it, and a flat neutral on a
transparent row vanishes the moment the fill behind it matches.

The line between the two is what a color is for, not what it looks like. `--default` is a fine grey
until it is asked to be a state layer: then it is a fixed lightness laid on an unknown one, and the
day those two match it is gone with nothing to fail but the eye.

**Contrast on a translucent surface is the app's to guarantee.** `contrast.browser.test.ts` holds
the floor for text on the fills, where both sides are known. Once the background is whatever happens
to be behind the window, ropav cannot see it and does not claim to — an app that thins a surface
owns the legibility of what it puts there.

### Reduced motion

`data-reduce-motion="true"` on any ancestor forces animations off, `"false"` forces them on regardless
of the OS setting, and with neither the `prefers-reduced-motion` media query decides. The nearest
ancestor that answered is the one that counts.

The attribute sets `--rp-motion` — see `motion.css` — and every animated declaration leads with
`var(--rp-motion)`, which substitutes nothing when motion is allowed and invalidates the whole
declaration when it is not. Tailwind's own `motion-reduce` / `motion-safe`
variants read the media query directly and know nothing about the attribute.

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
surroundings. Where selection is *just* a background - a tag, a calendar day, a table row - state
it again in system colours, after the fill:

```css
.thing[data-selected="true"] {
  background-color: var(--accent);
  color: var(--accent-foreground);

  @media (forced-colors: active) {
    forced-color-adjust: none;
    background-color: Highlight;
    border-color: Highlight;
    color: HighlightText;
  }
}
```

The block has to come after the fill it overrides, which used to be a trap worth a paragraph: as
`@apply forced-selected` it had to stand as a statement of its own, because Tailwind sorted a list
and hoisted the nested media query above the plain declarations. Written out there is nothing to
sort. `.forced-selected` is still there as a class if a caller wants it. Where selection
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
files, the CSS is copied across untouched, and `scripts/bundle-css.mjs` produces the minified
`dist/ropav.min.css`.

That last step is Lightning CSS: it follows the `@import` graph, lowers nesting for the browser
floor and minifies. The floor is stated in that file rather than queried from a browserslist,
because a floor that moves on a lockfile bump is not a floor. `packages/ropav` builds its own
`ropav.min.css` through the same function, and `bundled.browser.test.ts` in that package renders
the result against the source to check that the compiler changed nothing anyone can see.

`pnpm --filter @ropav/styles measure-size` prints a size report and writes `bundle-size.json`.

Only the published tarball needs the build. In the workspace, `exports` point straight at the sources
(`src/index.ts` and `index.css`), so editing a `.css` file shows up in Storybook and in the browser test suite
with no build step.

## License

Apache-2.0 — see `LICENSE` at the repo root, which keeps the original copyright.
