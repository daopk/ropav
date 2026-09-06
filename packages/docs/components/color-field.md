---
title: ColorField
description: A colour typed in, as a hex value or as one channel.
outline: [2, 3]
---

# ColorField

A colour field is the one colour control you type into. It is where a reader who already knows the
value goes — pasting a hex from a brand guide — rather than hunting for it on a
[ColorArea](/components/color-area) or a [ColorSlider](/components/color-slider).

```ts
import { ColorField, ColorInputGroup, ColorInputGroupInput, ColorInputGroupPrefix } from "ropav";
```

`ColorInputGroup` is the bordered box, `ColorInputGroupInput` the text input inside it, and
`ColorInputGroupPrefix` and `ColorInputGroupSuffix` hold whatever sits at either end — a
[ColorSwatch](/components/color-swatch) showing the value is the usual one.

::: playground color-field
:::

## Hex or a channel

Without a `channel` the field edits the whole colour as a hex value. Give it one and the field
edits that channel as a number instead, with the stepper keys a number field has.

<Demo title="color-field-channel.vue">
<DemoColorFieldChannel />

<template #code>

<<< @/.vitepress/theme/demos/color-field-channel.vue

</template>
</Demo>

These are two different controls, not one control configured two ways: they have their own state,
their own keyboard and their own DOM, so changing `channel` at runtime rebuilds the field. Decide
which one a field is and leave it there.

That split reaches validation too. `is-invalid` and `validate` are read on the hex branch only —
a channel field's validity is the number field's underneath, which is built without either.

## Accessibility

- The `id` lands on the input, because the input is the field as far as assistive technology is
  concerned. A `Label` pointing at the field reaches it.
- The text being typed and the colour it parses to are held apart until the value is committed,
  so a half-typed `#04` is not announced as an invalid colour while the reader is still in the
  middle of it.
- A swatch in the prefix is decoration — the value is already in the input, and announcing it
  twice is worse than not announcing it at all.

## API

<Api family="color-field" />

The parts around the input come from `ColorInputGroup`, which a
[ColorPicker](/components/color-picker) reuses.

<Api family="color-input-group" />
