---
title: Fieldset
description: A real fieldset, for fields that share a legend and a disabled state.
outline: [2, 3]
---

# Fieldset

A fieldset groups fields that belong to one part of a form — an address, a billing section —
under one legend. It is the one component here with no wrapper library underneath it: the element
is a real `<fieldset>` and the browser does half the work.

```ts
import { FieldGroup, Fieldset, FieldsetActions, FieldsetLegend } from "ropav";
```

`FieldsetLegend` is the `<legend>`, `FieldGroup` is the stack the fields sit in, and
`FieldsetActions` is the row at the bottom for the buttons that act on the section.

<Demo title="fieldset-basic.vue">
<DemoFieldsetBasic />

<template #code>

<<< @/.vitepress/theme/demos/fieldset-basic.vue

</template>
</Demo>

## Disabling a whole section

`disabled` is named after the native attribute rather than `is-disabled`, which is the rest of the
library's spelling. That is deliberate: the attribute goes straight onto the `<fieldset>`, and the
browser disables every control inside it without anything being passed down.

That is also the reason to reach for this over a group component. A
[CheckboxGroup](/components/checkbox-group), a [RadioGroup](/components/radio-group) or a
[SwitchGroup](/components/switch-group) each own one value; a fieldset owns none, and simply draws
a boundary round fields that stay independent.

## Accessibility

- The legend names the group, and a screen reader reads it before each field inside — which is
  why it should be short. "Billing address" prefixed onto "Street" reads well; a sentence does
  not.
- Nesting fieldsets works but rarely reads well, since every legend is announced on the way in.
  One level is usually the whole of it.
- A disabled fieldset takes its fields out of the tab order along with everything else, so say
  somewhere why the section is unavailable rather than leaving the reader to find out by
  arriving nowhere.

## API

<Api family="fieldset" />
