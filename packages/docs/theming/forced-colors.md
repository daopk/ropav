---
title: Forced colors
description: The authoring rules for High Contrast, including the trap no computed style can see.
---

# Forced colors

Forced Colors Mode — Windows High Contrast — replaces author colours with the user's own palette
and **strips `box-shadow` outright**. That second part is what makes it more than a colour
question here: every ring in this library *is* a `box-shadow`, because that is what `ring-*`
compiles to, and it sits on top of `outline-none`. Left alone, a focused control would have no
indicator at all.

If you are only *using* the components, there is nothing to do — see the guarantee in
[Accessibility](/guide/accessibility#forced-colors-mode). This page is for writing components
against this stylesheet.

## What is already covered

The three focus utilities — `focus-ring`, `focus-field-ring`, `invalid-field-ring` — draw an
outline back in `Highlight` under `forced-colors: active`. So any component that goes through
`status-focused`, `status-focused-field` or `status-invalid-field` is covered without a line of
its own. `status-disabled` picks up `GrayText` the same way.

## Selection carried only by a background

The override flattens a `background-color` into its surroundings. Where selection is *just* a
background — a tag, a calendar day, a table row — apply `forced-selected`, **as an `@apply`
statement of its own**:

```css
.thing[data-selected="true"] {
  @apply bg-accent text-accent-foreground;
  @apply forced-selected;
}
```

Folded into the line above it, Tailwind sorts the list and hoists the nested media query over the
plain declarations, and the `background-color` it exists to override wins instead.

Where selection also moves a thumb or shows a glyph, the component writes its own `forced-colors`
block, because those parts need colours of their own.

## Use the system keywords

`Highlight` / `HighlightText` for a selected control, `CanvasText` on `Canvas` for ordinary
content, `ButtonBorder` for a control's edge, `GrayText` for disabled. They are the only colours
exempt from the override — a token resolves to an author colour and is thrown away.

## Two traps

### `transparent` used as a spacer

Forced colors preserves a transparent *background*, but a transparent `border-color` is turned
**opaque**. A border held open purely to reserve layout space stops being invisible and renders as
a solid block. Restate those as `Canvas` inside the media query.

### The backplate, which `getComputedStyle` cannot see

Chromium paints a `Canvas`-coloured **backplate** behind the text of any element that has text, so
text over an image stays legible. It lands on top of that element's own background — so a
`Highlight` fill carrying `HighlightText` renders as a solid plate with the label invisible inside
it. Every colour is correct and the component is unreadable.

`forced-color-adjust: none` suppresses the backplate. `forced-selected` already carries it;
anything hand-rolling the same pairing needs it too, including the case where the fill sits on a
different element than the text.

::: danger Only alongside explicit system colours
On its own, `forced-color-adjust: none` just hands the author's palette back — which is the
opposite of the point.
:::

## Structure has to survive too

A component that is only a tinted fill and a shadow — a card, an alert, a text field, a chip —
renders as loose text once both are taken, which reads as no component at all.

So every container carries an inset `CanvasText` outline under the mode and every control a
`ButtonBorder` one, on the variants that actually paint. A transparent surface is left alone,
since framing it would invent a box that was never there. A separator is the exception that proves
it: the whole thing *is* its background, so it takes a colour rather than an edge.

## Looking at it by hand

Chromium's rendering panel — DevTools, <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>, "Show
Rendering", then *Emulate CSS media feature forced-colors*.

::: warning macOS has no Forced Colors Mode at all
"Increase contrast" maps to `prefers-contrast: more`, so switching it on tests nothing.
:::

There is deliberately no toolbar control for it in the workbench. `data-reduce-motion` is an
attribute a decorator can set, but this is a browser-level media feature an iframe cannot turn on
for itself — and faking it with a stylesheet of system colours would miss the `box-shadow`
removal, the part that actually breaks.
