---
title: TextField
description: A single-line text input, with its label, description and error kept together.
outline: [2, 3]
---

# TextField

`TextField` is the field, not the input. It owns the value, the validation state and the
relationships between the parts — so a `Label` inside it is already associated with the input,
and a `Description` or `FieldError` is already referenced by it. Nothing has to be wired up with
matching `id`s.

```ts
import { Input, Label, TextField } from "ropav";
```

::: playground textfield
:::

## With a label and a description

<Demo title="textfield-basic.vue">
<DemoTextfieldBasic />

<template #code>

<<< @/.vitepress/theme/demos/textfield-basic.vue

</template>
</Demo>

## Validation

`is-invalid` puts the field in the invalid state and `FieldError` renders the message. Both parts
read the state from the field, so the error cannot be shown while the field says it is fine.

<Demo title="textfield-invalid.vue">
<DemoTextfieldInvalid />

<template #code>

<<< @/.vitepress/theme/demos/textfield-invalid.vue

</template>
</Demo>

For validation the browser can do on its own, pass `type`, `pattern`, `minLength` or `maxLength`
and let `validationBehavior` decide when the message appears. A `validate` function covers the
rest.

## Beyond one input

An input with something attached to it — a prefix icon, a unit, a button — is
[InputGroup](/components/input-group), which goes inside the field in place of `Input`.

## API

<Api family="textfield" />

The parts a field composes with — `Label`, `Input`, `Description`, `FieldError` — are shared with
every other field, and each takes only `class` plus its own native attributes.
