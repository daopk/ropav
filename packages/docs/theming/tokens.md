---
title: Tokens
description: The custom properties, and which of them survive a surface you can see through.
---

# Tokens

Three tiers, narrowing as they go.

**Theme tokens** are the palette: base colours (`--background`, `--surface`, `--overlay`,
`--muted`), interactive and status colours (`--accent`, `--success`, `--warning`, `--danger`, each
with a `-foreground` and a derived `-hover` and `-soft`), form fields (`--field-background`,
`--field-border`, `--field-radius`, …), layout knobs (`--spacing`, `--border-width`, `--radius`,
`--ring-offset-width`, `--cursor-interactive`), the scrollbar set, and the shadows.

**Derived values** — the `--radius-xs` … `--radius-4xl` scale and the easing curves — are computed
from those.

**Component properties** are the third tier, declared on a component's own block and private to
it: `--button-bg`, `--switch-control-bg-checked-hover`, `--sidebar-rail-line`. They are the ones
you reach for to retune a single state — see [State colors](/theming/state-colors).

::: tip The stylesheet is the list
`themes/default.css` is the source of truth. A list of token names in prose goes stale the moment
one moves, so read that file rather than trusting an enumeration here.
:::

## Translucent surfaces

A surface wearing `rp-surface--transparent` paints nothing of its own, and so does a surface you
have thinned to let something through — a blurred header, a panel over an image, a window whose
material the OS draws. What sits on one of those has no way to know what is behind it, and that
splits the palette in two.

### Safe on anything: the tokens that are an alpha

`--state-layer` is what a state paints. `--separator` and `--border` are the lines — each an alpha
of `--surface-foreground` rather than a neutral of its own. An alpha darkens or lightens whatever
it lands on, so it holds its contrast against a fill it was never tuned for: another surface, the
far half of the theme, or a photograph.

The `-soft` family and `--scrollbar-thumb` are alphas too, which is why a selection is
`--accent-soft` wherever the library marks one.

### Not safe: the fills

`--default`, `--accent`, the status colours, `--surface` and its secondary and tertiary steps are
opaque, and they are meant to be — a badge you can read the page through is a broken badge. They
assume a background because they **are** one. Use them to fill a box, never to mark a state on a
box that is already transparent.

`--surface-hover` sits on the fill side of that line despite the name: it is a surface that has
been tinted and stays opaque, for a component opaque at rest whose hover must stay that way.
`--state-layer` is the one for a component transparent at rest.

Reaching for the wrong one fails quietly. A translucent hover on an opaque tag shows the page
through it; a flat neutral on a transparent row vanishes the moment the fill behind it matches.

The line between the two is what a colour is *for*, not what it looks like. `--default` is a fine
grey until it is asked to be a state layer: then it is a fixed lightness laid on an unknown one,
and the day those two match it is gone with nothing to fail but the eye.

::: warning Contrast on a translucent surface is yours
The library holds the floor for text on the fills, where both sides are known. Once the background
is whatever happens to be behind the window, it cannot see it and does not claim to. An app that
thins a surface owns the legibility of what it puts there.
:::
