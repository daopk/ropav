---
title: Spinner
description: An indeterminate wait, in four sizes.
outline: [2, 3]
---

# Spinner

A spinner says something is happening and cannot say how far along it is. Where the progress *is*
known, a progress bar tells the reader more; where a whole region is loading and its shape is
already known, a [Skeleton](/components/skeleton) tells them more still.

```ts
import { Spinner } from "ropav";
```

::: playground spinner
:::

## Following the text around it

`color="current"` takes the surrounding text colour instead of a named one, which is what you want
for a spinner sitting inside a sentence, a button or a muted caption.

<Demo title="spinner-current-color.vue">
<DemoSpinnerCurrentColor />

<template #code>

<<< @/.vitepress/theme/demos/spinner-current-color.vue

</template>
</Demo>

A [Button](/components/button) does not need one: `is-pending` already marks an in-flight action
and announces the change.

## Accessibility

- The spinner is a `role="status"` named "Loading", so a reader is told a wait has started without
  being interrupted mid-sentence.
- Where the wait has something more specific to say — which file, which step — say it in text
  beside the spinner and let the spinner be the picture of it.
- The gradient the arc is painted with is given an id per instance, so two spinners on one page do
  not both resolve to whichever definition the document reached first.

## API

<Api family="spinner" />
