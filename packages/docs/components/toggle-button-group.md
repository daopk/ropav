---
title: ToggleButtonGroup
description: Buttons that stay pressed, sharing one selection.
outline: [2, 3]
---

# ToggleButtonGroup

A toggle button group is a set of [ToggleButtons](/components/toggle-button) that share a
selection: one alignment out of three, or any combination of bold, italic and underline. Where the
buttons fire actions rather than holding a state, you want a
[ButtonGroup](/components/button-group).

```ts
import { ToggleButton, ToggleButtonGroup, ToggleButtonGroupSeparator } from "ropav";
```

Every button in the group needs an `id`, because that is the key the selection is carried in.

::: playground toggle-button-group
:::

## One or many

`selection-mode` is the whole difference between the two shapes this component takes. Left at
`single` it behaves like a set of radio buttons drawn as a control; at `multiple` each button is
independent and the group is a row of switches. `disallow-empty-selection` keeps at least one
pressed, which is what you want where the group always describes some state — text is aligned
somehow, even if the reader has not chosen.

<Demo title="toggle-button-group-selection.vue">
<DemoToggleButtonGroupSelection />

<template #code>

<<< @/.vitepress/theme/demos/toggle-button-group-selection.vue

</template>
</Demo>

`v-model:selected-keys` hands the selection to the caller; `default-selected-keys` just starts it
somewhere. `is-detached` separates the buttons visually instead of joining them, for a group that
should read as several controls that happen to agree.

## Accessibility

- Each button keeps `aria-pressed`, so a screen reader announces the state of the one it is on
  rather than the group's selection as a whole.
- The group needs an `aria-label`. "Text style" tells a reader what the pressed buttons are about;
  without it they hear three unrelated toggles.
- `ToggleButtonGroupSeparator` is decorative and `aria-hidden` — it goes inside the button that
  follows it, the same as in a button group, so the rule travels with the button.
- Single selection here is not a radio group. Where the choice is a form value with a name and a
  validation state, use a [RadioGroup](/components/radio-group) and let this component be the
  toolbar control it looks like.

## API

<Api family="toggle-button-group" />
