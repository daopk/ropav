---
title: Switch
description: A control that takes effect as you flip it.
outline: [2, 3]
---

# Switch

A switch turns something on. The difference from a checkbox is when it takes effect: a switch
applies immediately, a checkbox states an intention that a form submission later carries out. If
there is a Save button, it should probably be a checkbox.

```ts
import { Switch, SwitchContent, SwitchControl, SwitchThumb } from "ropav";
```

::: playground switch
:::

## An icon in the thumb

`SwitchIcon` sits inside `SwitchThumb` and rides along with it. Use it when the two states need
to be told apart without reading the label — and remember that the icon moves rather than
changing, so it says "this is a switch", not "this is on".

<Demo title="switch-icon.vue">
<DemoSwitchIcon />

<template #code>

<<< @/.vitepress/theme/demos/switch-icon.vue

</template>
</Demo>

## Accessibility

- The underlying control is a native checkbox with a switch role, so the state is the browser's
  to report rather than something the component announces.
- `SwitchContent` puts the label inside the control, so the whole row toggles.
- Under Forced Colors Mode the track and thumb are redrawn with system colours, because the fill
  that normally separates on from off is stripped there.

## API

<Api family="switch" />
