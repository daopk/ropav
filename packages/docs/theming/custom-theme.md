---
title: Custom themes
description: Overriding the default palette, or adding one of your own.
---

# Custom themes

Every token is a CSS custom property, so overriding them in your own stylesheet is enough. There
is no rebuild of the package, and no need to go through a theme file at all:

```css
:root {
  --rp-accent: oklch(0.62 0.19 253.83);
  --rp-radius: 0.5rem;
}
```

Author CSS outside a cascade layer outranks everything the library declares, so these win wherever
you put them.

## A border on fields

The default theme draws fields with a fill and no border. `--rp-field-border-width` gives them
one:

```css
:root {
  --rp-field-border-width: 1px;
}
```

The border is drawn inside the field's height rather than added to it — each field takes the width
back out of its padding — so an input, a select or a search field stays at 28, 32, 36 or 40 pixels,
level with a button of the same size. Set it on `:root`: it is read there, so a `data-theme`
subtree that sets its own leaves the fields under it as they were.

## Corners

Two tokens round the library, and which one a component reads decides what it lines up with.

`--rp-field-radius` rounds the fields: an input, a text area, a select's trigger, a search, number
or date field. `--rp-component-radius` rounds nearly everything else — buttons, toggle buttons and
both ends of their groups, tabs and segmented controls, alerts, cards, popovers and menus, and
chips and tags as well. The larger surfaces cap it at 32px, so a theme that sets it high enough to
make a button a pill does not make a card a capsule.

The default theme points the second at the first, so a button under a text field meets it corner
for corner, at every size. The bundled `data-theme` palettes leave it at three steps of
`--rp-radius`, rounder than their fields. To pair them in a theme of your own, set the one token
beside the field radius:

```css
[data-theme="ocean"] {
  --rp-field-radius: 6px;
  --rp-component-radius: var(--rp-field-radius);
}
```

Beside it, on the element that declares the theme: a `var()` resolves where it is declared, and a
bundled palette declares its own `--rp-component-radius` on its `[data-theme]` element, so a value
set on `:root` stops at the first subtree that carries one.

Chips and tags square off with the controls. To keep them round, hand them a radius of their own —
the token is read on the element that draws the corner, so setting it there is enough:

```css
.rp-chip,
.rp-tag {
  --rp-component-radius: 32px;
}
```

A badge reads `--rp-radius` rather than either token, so pairing the two leaves it as it was.

## Adding a palette rather than changing the default

Write the same token block under your own attribute:

```css
@layer theme {
  [data-theme="ocean"] {
    color-scheme: light;

    --rp-accent: oklch(0.62 0.14 220);
    --rp-accent-hover: color-mix(in oklab, var(--rp-accent) 90%, var(--rp-accent-foreground) 10%);
    /* … */
  }
}
```

**It has to redeclare the derived tokens too, not just the authored ones.** A custom property
substitutes `var()` at the element where it is *declared*, so an `--rp-accent-hover` inherited from
`:root` would still be mixed from the root's `--rp-accent` — the hover would stay the old colour
while the resting state moved. Copying a bundled theme and editing it is the reliable way in.

## What a theme does not need to carry

Only colours. Everything keyed on neither the palette nor the appearance — `--rp-spacing`,
`--rp-cursor-*`, the primitives, the shadows, `--rp-backdrop` — stays on `:root` and `.dark` in the
default theme, and both of those keep matching an element that carries a `data-theme`.

## Both halves, always

A palette that declares only its light block loses to `:root`'s dark placeholder under
`.dark`: the two have equal specificity, and source order decides. Declare both, the way the
bundled ones do:

```css
[data-theme="ocean"] { /* light */ }
[data-theme="ocean"].dark,
.dark [data-theme="ocean"] { /* dark */ }
```

The second selector is what lets a subtree carry a palette while the page carries the appearance.
