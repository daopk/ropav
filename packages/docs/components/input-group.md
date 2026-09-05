---
title: InputGroup
description: An input with something fixed attached to it.
outline: [2, 3]
---

# InputGroup

`InputGroup` replaces `Input` inside a field when the input needs a companion — an icon, a unit,
a fixed domain, a button. The group draws the border and owns the focus ring, so the whole thing
lights up as one control rather than the input lighting up inside a box.

```ts
import { InputGroup, InputGroupInput, InputGroupPrefix } from "ropav";
```

::: playground input-group
:::

## Prefixes and suffixes

<Demo title="input-group-affixes.vue">
<DemoInputGroupAffixes />

<template #code>

<<< @/.vitepress/theme/demos/input-group-affixes.vue

</template>
</Demo>

`InputGroupTextArea` is the multi-line member of the family, for when the companion has to sit
beside something that grows.

## Where the props go

The variant, size, full width and disabled state belong to the group, not to the input inside it
— they describe the control the reader sees. The field around it still owns the value and the
validation state, so `is-invalid` goes on the `TextField`.

## API

<Api family="input-group" />
