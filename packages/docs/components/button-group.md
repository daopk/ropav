---
title: ButtonGroup
description: Several buttons joined into one control.
outline: [2, 3]
---

# ButtonGroup

A button group joins related [Buttons](/components/button) into a single control: the corners are
rounded on the outside only, and the group sets the size and variant so the buttons cannot drift
apart. Where the buttons also carry selection — pressed or not — you want a
[ToggleButtonGroup](/components/toggle-button-group) instead.

```ts
import { Button, ButtonGroup, ButtonGroupSeparator } from "ropav";
```

::: playground button-group
:::

`size` and `variant` on the group apply to every button in it, and any button may still set its
own — which is how one destructive action sits in a row of ordinary ones.

## The rule between buttons

`ButtonGroupSeparator` goes *inside* the button that follows the rule, not between the two. That
is what keeps the line attached to the button as it moves, so a group can wrap or change
orientation without the rules ending up somewhere else.

<Demo title="button-group-vertical.vue">
<DemoButtonGroupVertical />

<template #code>

<<< @/.vitepress/theme/demos/button-group-vertical.vue

</template>
</Demo>

Inside a [Toolbar](/components/toolbar) the group takes the toolbar's axis, so `orientation` only
needs setting when the group stands on its own.

## Accessibility

- The group is a `role="group"` and every button inside keeps its own role, its own name and its
  own tab stop — joining controls visually does not make them one control to a screen reader.
- That group has no name of its own, so pass an `aria-label` wherever the grouping is part of the
  meaning rather than only part of the picture.
- `is-disabled` on the group disables every button in it. A group where only some actions are
  unavailable should disable those buttons rather than the group.
- An icon-only button in a group still needs an `aria-label` — the shared frame gives it no name.

## API

<Api family="button-group" />
