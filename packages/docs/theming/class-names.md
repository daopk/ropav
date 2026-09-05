---
title: Class names
description: The prefixed BEM scheme, and why a utility passed through `class` just works.
---

# Class names

Prefixed BEM, so a class can be read without looking it up and belongs to nobody else.

- **Prefix** — `rp-`, on every class the component layer defines
- **Block** — the component itself: `.rp-button`, `.rp-card`, `.rp-alert`
- **Modifier** — a variation, double dash: `.rp-button--primary`, `.rp-button--lg`, `.rp-button--icon-only`
- **Element** — a part of the component, double underscore: `.rp-card__header`, `.rp-alert__icon`

```html
<button class="rp-button">Click me</button>
<button class="rp-button rp-button--primary">Save</button>
<button class="rp-button rp-button--primary rp-button--sm">Small primary</button>
```

::: tip Your own names stay yours
The prefix is not decoration. Component rules live in the `components` layer and your CSS is
probably unlayered, so you win every property you declare — and what leaks through are the ones
you left at their initial value, the half nobody wrote down. An element of yours wearing a bare
`menu` or `card` would inherit part of a component and report no error anywhere.

It covers every name that is global to the document, not just classes: an animation is
`rp-toast-slide-top-in`, a view-transition class `rp-toast-top`.
:::

## Two conventions the layer relies on

**The default size lives in the base class.** `.rp-button` already renders at the `--md` size, so
`.rp-button--md` is an empty rule with a comment saying why. A component with no size modifier
never looks broken.

**State keys on `data-*`, with a pseudo-class fallback.** Interactive rules are written as
`&:hover, &[data-hovered="true"]`, `&:active, &[data-pressed="true"]`,
`&:focus-visible, &[data-focus-visible="true"]` — so the same CSS works whether the state comes
from the browser or from a component publishing it as an attribute.

That second one is why you can style against these components from the outside: the state you want
to target is on the element, not locked inside a render function.

## The `class` prop

Every component takes one, appended to the classes its recipe already carries.

```vue
<Button class="w-full" variant="secondary">Save</Button>
```

A utility passed this way wins on cascade order alone — component rules live in the `components`
layer, utilities in the later `utilities` one — so nothing has to be stripped for it to take
effect. That is the first thing to reach for.

It has two blind spots:

- **It cannot reach a part drawn in `::before` or `::after`.**
- **It flattens every state of whatever property it sets.**

[State colors](/theming/state-colors) is the way round both.
