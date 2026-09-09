---
title: TextArea
description: A multi-line text input, sized and styled like the fields beside it.
outline: [2, 3]
---

# TextArea

`TextArea` is the multi-line counterpart of `Input`: the same variants, the same three sizes, and
the same behaviour inside a field. It is the control, not the field — for a label, a description
and a validation state, put it inside a [TextField](/components/textfield) exactly as you would an
input.

```ts
import { TextArea } from "ropav";
```

::: playground textarea
:::

## Inside a field

A `TextField` drives whatever control it finds, so a textarea in place of an `Input` needs nothing
else: the `Label` is already associated with it, a `Description` is already referenced by it, and
`variant` and `size` come from the field. A prop set on the textarea itself wins over what the
field supplies.

<Demo title="textarea-field.vue">
<DemoTextareaField />

<template #code>

<<< @/.vitepress/theme/demos/textarea-field.vue

</template>
</Demo>

Only `value`, `variant`, `size`, `fullWidth`, `placeholder`, `autosize`, `minRows`, `maxRows` and
`resize` are declared. Everything else a `<textarea>` accepts — `rows`, `maxlength`, `spellcheck`,
`autocomplete` — arrives by attribute fallthrough and lands on the element.

## Autosize

`autosize` grows the control with what is typed. `minRows` and `maxRows` bound that growth; without
a max it keeps going. Native resize is forced off while it is on, so the drag handle cannot fight
the measured height.

<Demo title="textarea-autosize.vue">
<DemoTextareaAutosize />

<template #code>

<<< @/.vitepress/theme/demos/textarea-autosize.vue

</template>
</Demo>

## Enable resize

By default, resize is `none`; to enable it, set the `resize` prop to `vertical` or `both`.

<Demo title="textarea-resize.vue">
<DemoTextareaResize />

<template #code>

<<< @/.vitepress/theme/demos/textarea-resize.vue

</template>
</Demo>

## Holding the value

Setting `value` takes the control over from the surrounding field, so the caller owns the text
even inside a `TextField`. Pair it with `change`, or with `v-model:value`, or the text is pinned:
the element is put back to what the caller holds after every input, including the reset value a
form submission would restore.

## API

<Api family="textarea" />
