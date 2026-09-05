---
title: Checkbox
description: A box that is on, off, or standing for a mixed set below it.
outline: [2, 3]
---

# Checkbox

A checkbox is a single yes or no. `CheckboxControl` is the box, `CheckboxIndicator` is the mark
inside it, and `CheckboxContent` wraps the box together with its label so the whole row is the
hit area.

```ts
import { Checkbox, CheckboxContent, CheckboxControl, CheckboxIndicator } from "ropav";
```

::: playground checkbox
:::

## Indeterminate

`is-indeterminate` is the third state, for a checkbox that summarises others: some of the boxes
below it are ticked and some are not. It is a display state, not a value — the checkbox is still
either selected or not underneath, and clicking it resolves the mixed state one way.

<Demo title="checkbox-indeterminate.vue">
<DemoCheckboxIndeterminate />

<template #code>

<<< @/.vitepress/theme/demos/checkbox-indeterminate.vue

</template>
</Demo>

## Groups

For several checkboxes that share a name, a validation state and one error message, use
`CheckboxGroup` — it is in [Storybook](/guide/storybook) along with the rest.

## Accessibility

- The real control is a native `<input type="checkbox">`, kept in the accessibility tree and out
  of sight. The box you see is drawn beside it, so the state a screen reader announces is the
  browser's own.
- `CheckboxContent` makes the label part of the control, which is what gives the row its hit
  area — a target far larger than the box, and the reason the label does not need its own
  handler.

## API

<Api family="checkbox" />
