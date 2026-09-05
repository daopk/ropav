---
title: Toast
description: A message that arrives after the fact, and leaves on its own.
outline: [2, 3]
---

# Toast

A toast reports something that already happened. It is the opposite of a
[Modal](/components/modal): it asks nothing, blocks nothing, and disappears without being
answered. For a message that belongs to the page rather than to a moment, use
[Alert](/components/alert).

```ts
import { ToastProvider, ToastQueue } from "ropav";
```

## The queue

Toasts are added to a `ToastQueue`, and a `ToastProvider` renders whatever is in it. The queue is
a plain object you make yourself, so it lives wherever your application state lives and can be
reached from anywhere — a store, a composable, a module — without a component having to be
mounted first.

<Demo title="toast-basic.vue">
<DemoToastBasic />

<template #code>

<<< @/.vitepress/theme/demos/toast-basic.vue

</template>
</Demo>

`max-visible-toasts` caps the stack; the rest wait their turn. One queue per placement is the
usual arrangement when a page shows toasts in more than one corner — each stack is then
independent.

## Placement

`placement` on the provider decides which corner the stack grows from, and the animation follows
it: toasts at the top slide down, toasts at the bottom slide up.

## Accessibility

- The region is a live region, so a toast is announced when it arrives without focus moving.
- A toast that carries an action stays until it is dismissed. Anything the reader has to act on
  should not be on a timer.
- Hovering or focusing the stack pauses the timers, so a toast cannot vanish while it is being
  read.

## API

<Api family="toast" />
