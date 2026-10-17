---
title: Theming
description: Two independent axes, and the palettes that ship with the library.
---

# Theming

Two independent axes. `data-theme` picks the **palette**, a `light`/`dark` class picks the
**appearance**:

```html
<html data-theme="netflix" class="dark"></html>
```

Either can be left out. With no `data-theme` you get the default theme; with no class you get
light. The default also answers to `[data-theme="light"]` and `[data-theme="dark"]`.

Keeping them apart is the whole design: a theme is a **brand**, not a mode. There is no
`netflix-dark` — it is `data-theme="netflix"` plus `class="dark"`, and every bundled palette
carries both halves.

Try it with the picker in this site's header. It changes the components on the page and leaves
the page itself alone, because the site's own chrome is not the library's to theme.

## One part of the page in the other appearance

The class works on any element, not only the root. Controls laid over a photo or a video, or a
code panel, can be dark on a light page:

```html
<div class="controls dark">…</div>
```

Every token is declared again on that element, `color-scheme` included, so the components inside
it come out dark. `class="light"` does the reverse inside a dark page. Three things stay outside
the scope's reach:

- **Text the app colours itself.** The library colours its components and leaves the page's own
  text alone, so text inheriting a colour set higher up keeps that colour. Give the scope
  `color: var(--rp-foreground)`, and a background if it needs one; over a picture it usually does
  not.
- **The palette of the page.** A palette's dark half answers to `[data-theme].dark` and to
  `.dark [data-theme]`, not to a `.dark` inside a `[data-theme]`, which gets the default theme's
  dark half instead. Name the palette on the scope too: `<div data-theme="netflix" class="dark">`.
- **Overlays.** Tooltips, popovers, menus and dialogs render at the end of `body`, outside the
  scope, in the page's appearance. Give the overlay's own part the class as well, or render
  overlays inside the scope with
  [`PortalProvider`](/patterns/overlays#inside-one-part-of-the-page).

## Bundled palettes

The default one, plus a palette per brand — `hero` among them, being the palette this library's
visual language came from. The default is already in the stylesheet; the rest are opt-in, one
file each:

```css
@import "ropav/styles";
@import "@ropav/styles/themes/netflix";
```

| `data-theme` | | `data-theme` | | `data-theme` |
| --- | --- | --- | --- | --- |
| `default` | | `mint` | | `coinbase` |
| `hero` | | `netflix` | | `airbnb` |
| `sky` | | `uber` | | `discord` |
| `lavender` | | `spotify` | | `rabbit` |

Import only the palettes you actually offer. Each is around 10 kB before compression, and
`themes/all.css` — which pulls in every one — is for docs and playgrounds, not for an app.

If you are building a picker of your own, the list is exported rather than something to retype:

```ts
import { themeIds, themeLabels } from "@ropav/styles";
```

## Which page you want

- [Tokens](/theming/tokens) — what the custom properties are, and which are safe on a surface you
  can see through.
- [State colors](/theming/state-colors) — how to retune one state without flattening the rest.
- [Custom themes](/theming/custom-theme) — overriding the default, or adding a palette.
- [Class names](/theming/class-names) — the prefixed BEM scheme, and the `class` prop.
- [Variants](/theming/variants) — going from props to class names without a component.
- [Forced colors](/theming/forced-colors) — the authoring rules for High Contrast.
