---
title: ToggleButton
description: A button that stays pressed, for a setting you can see the state of.
outline: [2, 3]
---

# ToggleButton

A toggle button is a button that stays pressed. Use it where the state belongs to the control
itself — bold, mute, pin — and the label does not change to describe it. Where the state is a
setting in a form, a [Checkbox](/components/checkbox) or a [Switch](/components/switch) says so
more plainly.

```ts
import { ToggleButton } from "ropav";
```

::: playground toggle-button
:::

## Selection

`default-selected` starts the button on; `is-selected` with a `change` listener hands the state to
the caller. Either way the state also reaches the content as a slot prop, which is how the label
or the icon can follow it.

<Demo title="toggle-button-selected.vue">
<DemoToggleButtonSelected />

<template #code>

<<< @/.vitepress/theme/demos/toggle-button-selected.vue

</template>
</Demo>

## Groups

`ToggleButtonGroup` joins several into one control with shared selection — it is in
[Storybook](/guide/storybook) along with the rest. Inside one, the group owns selection: each
button needs an `id` to be keyed by, and `is-selected` and `default-selected` are ignored, so two
buttons can never both think they are on.

## Accessibility

- The button reports `aria-pressed`. Inside a single-selection group it reports `role="radio"` and
  `aria-checked` instead, because a set of mutually exclusive choices is a radio group to
  assistive technology, and carrying both would describe the button twice.
- A button whose whole content is one icon takes `is-icon-only`, and needs an `aria-label` — there
  is no text left to name it.
- An explicit `tabindex` is written even though a native button is already tabbable, because
  Safari does not focus one without it. A disabled button gets none, so it is not reachable at all.

## API

<Api family="toggle-button" />
