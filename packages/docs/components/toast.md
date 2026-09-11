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

`toast.update` replaces a message where it stands, keeping the toast's key and its place in the
stack, which is how `toast.promise` settles a loading toast into its outcome rather than swapping
one toast for another. A `timeout` or `onClose` left out of an update is kept.

## Expanding

Pointing at the stack, or moving focus into it, opens it out so every toast stands at its own
height instead of being clipped to the one in front. It closes again when the pointer and focus
both leave, or on `Escape`. A single toast has nothing to open out of, and a touch leaves the
stack closed — a finger has no hover to lose, so an opened stack would have nothing to close it.

`is-expanded` holds the stack open regardless, which is what a visual test wants. Unlike pointing
at it, that does not pause the timers.

## Placement

`placement` on the provider decides which corner the stack grows from, and the animation follows
it: toasts at the top slide down, toasts at the bottom slide up. The stack animates itself, so
passing `createViewTransitionUpdate().wrapUpdate` as the queue's `wrapUpdate` is what swaps that
for a chain of view transitions.

## Accessibility

- The region is a live region, so a toast is announced when it arrives without focus moving.
- A toast that carries an action stays until it is dismissed. Anything the reader has to act on
  should not be on a timer.
- Hovering or focusing the stack pauses the timers, so a toast cannot vanish while it is being
  read.
- <kbd>Alt</kbd> + <kbd>T</kbd> moves focus to the region from anywhere, so the toasts are
  reachable without tabbing through everything between. `hotkey` changes the combination, and an
  empty list turns it off.

## API

<Api family="toast" />
