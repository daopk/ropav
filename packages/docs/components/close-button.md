---
title: CloseButton
description: The button that dismisses whatever it sits in.
outline: [2, 3]
---

# CloseButton

A close button dismisses the thing it sits in. It is a [Button](/components/button) narrowed to
one job — a square around a cross, already named, with no variants worth choosing between — which
is why a modal, a drawer and a toast all close the same way without agreeing on anything first.

```ts
import { CloseButton } from "ropav";
```

::: playground close-button
:::

## A glyph of your own

The default slot replaces the cross. Whatever goes there is the whole of the button's content, so
the accessible name still has to come from `aria-label`.

<Demo title="close-button-glyph.vue">
<DemoCloseButtonGlyph />

<template #code>

<<< @/.vitepress/theme/demos/close-button-glyph.vue

</template>
</Demo>

## Driven from above

A component that owns its close button hands the press behaviour down rather than passing
handlers in — a modal's dismiss trigger and a search field's clear button are both plain
`CloseButton`s that were given their behaviour by the component around them. Nothing has to be
forwarded for that to work, and it is also why a clear button can be deliberately left out of the
tab order while an ordinary close button stays in it.

## Accessibility

- The button names itself `Close`, so the glyph is never the accessible name on its own. Pass
  `aria-label` to say *what* is being closed — in a stack of five toasts, "Dismiss notification"
  is worth more than five buttons all called Close.
- `is-pending` marks an action in flight: the button stays focusable and stops activating, and a
  pending button that would otherwise submit a form is switched to `type="button"` while it waits.
  `is-disabled` is the other choice, and it leaves the tab order entirely.
- An explicit `tabindex` is written even though a native button is already tabbable, because
  Safari does not focus one without it.

## API

<Api family="close-button" />
