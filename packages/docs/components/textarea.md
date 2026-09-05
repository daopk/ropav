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

Only `value`, `variant`, `size`, `fullWidth` and `placeholder` are declared. Everything else a
`<textarea>` accepts — `rows`, `maxlength`, `spellcheck`, `autocomplete` — arrives by attribute
fallthrough and lands on the element.

## Holding the value

Setting `value` takes the control over from the surrounding field, so the caller owns the text
even inside a `TextField`. Pair it with `change`, or with `v-model:value`, or the text is pinned:
the element is put back to what the caller holds after every input, including the reset value a
form submission would restore.

## API

<Api family="textarea" />
