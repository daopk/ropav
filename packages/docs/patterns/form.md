---
title: Form
description: Fields in a fieldset, reporting what the browser rejected and what the server did.
outline: [2, 3]
---

# Form

A form screen is four decisions stacked. `Form` owns validation for everything inside it,
[Fieldset](/components/fieldset) draws the boundary round a section, `FieldGroup` stacks the
fields, and each field owns its own label, description and error. Nothing above a field knows what
kind of control it holds, which is why a [Select](/components/select) and a
[TextArea](/components/textarea) sit in the same stack without being special-cased.

```ts
import {
  FieldGroup,
  Fieldset,
  FieldsetActions,
  FieldsetLegend,
  Form,
  Select,
  TextArea,
  TextField,
} from "ropav";
```

<Demo full open title="form.vue">
<PatternForm />

<template #code>

<<< @/.vitepress/theme/patterns/form.vue

</template>
</Demo>

## What Form contributes

`Form` renders a `<form>` and provides two things to every field under it: the validation
behaviour, and the errors a server sent back. It holds no values — the fields do, and submission is
a plain `FormData` read off the event.

## The two kinds of error

`validate` is the client's: it runs against the field's own value and reports a message.
`validation-errors` is the server's — an object keyed by the `name` each field submits under, which
a field shows until the value is edited. Assign a fresh object for each response, or the same field
rejected twice reads as no change at all.

Submit the form above without touching it to see one land.

## Native or ARIA

`validation-behavior` defaults to `"native"`: the browser blocks submission and the errors appear
on a failed submit. `"aria"` marks the fields through ARIA, reveals errors as the value changes, and
leaves submission alone — which is what you want when submitting is a fetch rather than a
navigation. The browser is out of it entirely under `"aria"`, so `is-required` only announces
itself and the check behind it is the caller's, as the demo above shows.

## Accessibility

- `FieldsetLegend` is read before every field inside it, so it should be short — "Workspace"
  prefixed onto "Name" reads well; a sentence does not.
- Each field carries its own `FieldError`. A summary at the top of a form is not a substitute: the
  message has to be reachable from the control it belongs to.
- The actions are last in the DOM as well as last on screen, so the tab order and the reading order
  agree.
