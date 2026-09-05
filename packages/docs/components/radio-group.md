---
title: RadioGroup
description: One choice out of a few, with the group owning the state.
outline: [2, 3]
---

# RadioGroup

A radio group is a single value. The group holds it — along with `name`, the disabled state, the
validation state and the error — and each `Radio` only contributes the value it stands for. That
is why `is-read-only`, `is-required` and `is-invalid` are group props and not radio props: they
describe the choice, not one of the options.

```ts
import { Radio, RadioGroup } from "ropav";
```

::: playground radio-group
:::

## A labelled group

<Demo title="radio-group-basic.vue">
<DemoRadioGroupBasic />

<template #code>

<<< @/.vitepress/theme/demos/radio-group-basic.vue

</template>
</Demo>

`is-disabled` on a single `Radio` takes just that option out while the rest of the group stays
usable.

## Accessibility

- Arrow keys move between the options and select as they go, which is what a radio group does
  natively — the group is one tab stop, not one per option.
- The `Label` inside the group names the whole set, so a screen reader reads "Plan, Premium,
  2 of 3" rather than the option on its own.
- More than about five options, or options that need describing, and a
  [Select](/components/select) is the better control.

## API

<Api family="radio-group" />

`Radio` and its parts come from the same import and are documented here because a group is the
only place they appear.

<Api family="radio" />
