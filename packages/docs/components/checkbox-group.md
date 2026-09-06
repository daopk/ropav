---
title: CheckboxGroup
description: Several checkboxes under one name, one validation state and one message.
outline: [2, 3]
---

# CheckboxGroup

A checkbox group gathers [Checkboxes](/components/checkbox) that answer the same question: they
submit under one `name`, they are validated together, and one error message covers them all.
Checkboxes that happen to sit near each other but mean unrelated things are not a group — leave
them separate.

```ts
import { Checkbox, CheckboxGroup, Description, FieldError, Label } from "ropav";
```

::: playground checkbox-group
:::

The group's value is an array of the selected checkboxes' `value` strings. `v-model:value` hands
it to the caller, and `default-value` just starts it somewhere.

<Demo title="checkbox-group-basic.vue">
<DemoCheckboxGroupBasic />

<template #code>

<<< @/.vitepress/theme/demos/checkbox-group-basic.vue

</template>
</Demo>

## Validation

`is-required` means at least one box has to be ticked, and `validate` runs against the whole array
so a rule like "pick no more than three" has something to read. `is-invalid` set either way takes
the group over: `true` marks it invalid whatever `validate` says, and `false` claims it is valid
and shadows `validate` — the browser and the server alike.

`validation-behavior` decides when the message appears, and is inherited from the surrounding
`Form` unless the group sets its own.

## Accessibility

- The group is a `role="group"` named by its `Label`, so a reader entering it is told what the
  boxes have in common before hearing the first one.
- The error belongs to the group, not to a box. A `FieldError` inside the group is pointed at by
  every checkbox in it, which is what stops the same message being read three times over.
- `is-disabled` and `is-read-only` on the group apply to every checkbox in it. The difference
  matters to a reader: a disabled group is skipped, a read-only one is announced and can be
  reached.
- A checkbox can still disable itself inside an enabled group, which is the case for an option
  that is unavailable for its own reasons.

## API

<Api family="checkbox-group" />
