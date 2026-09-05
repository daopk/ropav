---
title: Alert
description: A message about the state of something, in five statuses.
outline: [2, 3]
---

# Alert

An alert states something the reader needs to know about the page they are on. It stays where it
is written — for a message that arrives and leaves on its own, use [Toast](/components/toast).

```ts
import { Alert } from "ropav";
```

::: playground alert
:::

## Statuses

The status carries the meaning, and `AlertIndicator` reads it from context rather than being
told twice — so the icon cannot end up describing a different status than the colour does.

<Demo title="alert-statuses.vue">
<DemoAlertStatuses />

<template #code>

<<< @/.vitepress/theme/demos/alert-statuses.vue

</template>
</Demo>

## With an action

Anything after `AlertContent` sits beside it rather than under it. A button here is the usual
case: the alert says what happened and offers the one thing to do about it.

<Demo title="alert-action.vue">
<DemoAlertAction />

<template #code>

<<< @/.vitepress/theme/demos/alert-action.vue

</template>
</Demo>

## Accessibility

- An alert is a surface in its own right, so text inside it uses its own on-surface colours
  rather than inheriting the ones tuned for whatever the alert is sitting on. Contrast holds
  wherever you put it.
- Success, warning and danger each get a glyph of their own, so those three read without
  colour. `default` and `accent` share the informational glyph and differ only in hue — when the
  distinction between them matters, say it in the title rather than leaving it to the colour.
- Nothing about an alert is announced on its own. If the message appears in response to
  something the reader did, put it where focus already is, or give the container a live region.

## API

<Api family="alert" />
