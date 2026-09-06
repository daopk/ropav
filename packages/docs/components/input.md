---
title: Input
description: The control a text field is built around.
outline: [2, 3]
---

# Input

`Input` is the box you type in. On its own it is rarely what you want — a
[TextField](/components/textfield) wraps it with a label, a description and a validation state,
and that is the shape most forms need. Reach for the input directly when you are assembling
something the field does not cover.

```ts
import { Input, Label, TextField } from "ropav";
```

Inside a field, `variant` and `size` come from the field and do not need repeating. Set them on
the input only where it stands alone.

<Demo title="input-affixes.vue">
<DemoInputAffixes />

<template #code>

<<< @/.vitepress/theme/demos/input-affixes.vue

</template>
</Demo>

## The value belongs to the field

Setting `value` on the input takes the control away from the surrounding field: the caller owns
it from then on, and without a listener to go with it the text is pinned and cannot be typed in.
That is the same trap a `value` prop is in React, and the fix is the same — put the value on the
`TextField` and let it flow down.

`placeholder` is declared here as well as on the field, so it can be set at whichever level reads
better. Every other native attribute reaches the element by ordinary attribute fallthrough.

For an input with something attached to it — a currency symbol, a unit, a button — use an
[InputGroup](/components/input-group), which is the same control with room at either end.

## Accessibility

- The input is the field as far as assistive technology is concerned: the `id` lands here, and a
  `Label` inside the field points at it.
- A placeholder is not a label. It disappears when typing starts and it is not reliably announced,
  so a field whose only name is its placeholder has no name at all.

## API

<Api family="input" />
