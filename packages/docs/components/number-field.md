---
title: NumberField
description: A number, with steppers and locale-aware formatting.
outline: [2, 3]
---

# NumberField

A number field is a text field that knows it holds a number. It parses what is typed against the
reader's locale, clamps to the range, and formats the result when the field loses focus — so
`1,024` and `1.024` both mean what the reader meant by them.

```ts
import { NumberField, NumberFieldGroup, NumberFieldInput } from "ropav";
```

::: playground number-field
:::

## Steppers and formatting

`format-options` is passed straight to `Intl.NumberFormat`, so a percentage, a currency or a unit
is a matter of describing it rather than of formatting it yourself.

<Demo title="number-field-basic.vue">
<DemoNumberFieldBasic />

<template #code>

<<< @/.vitepress/theme/demos/number-field-basic.vue

</template>
</Demo>

`step` decides what the steppers and the arrow keys move by, and it is also what the value is
snapped to.

## Locale

The field reads its locale from the nearest `I18nProvider`, falling back to the browser's. Pin it
with `locale` when the number has to be read the same way everywhere — a code, an identifier,
anything that is a number by type but not by meaning.

## Accessibility

- The steppers are real buttons with their own labels, so they are reachable and announced.
- Arrow keys step the value while the input is focused; <kbd>Page Up</kbd> and
  <kbd>Page Down</kbd> take larger steps.
- `is-wheel-disabled` stops the scroll wheel changing the value, which is worth setting for a
  field inside a scrolling panel.

## API

<Api family="number-field" />
