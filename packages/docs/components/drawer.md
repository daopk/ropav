---
title: Drawer
description: A dialog that slides in from an edge of the screen.
outline: [2, 3]
---

# Drawer

A drawer is a [Modal](/components/modal) that comes in from an edge and can be dragged back
out. It suits a panel the reader opens and closes repeatedly — filters, a cart, a detail view —
where a dialog landing in the middle of the page would be heavier than the task deserves.

```ts
import {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerDialog,
  DrawerHandle,
  DrawerHeading,
} from "ropav";
```

The layers match the modal's: `DrawerBackdrop` dims the page, `DrawerContent` decides which edge
the drawer comes from, `DrawerDialog` is the panel. `DrawerHandle` is the grab bar, and
`DrawerHeader`, `DrawerBody` and `DrawerFooter` divide the panel so only the body scrolls.

<Demo title="drawer-placement.vue">
<DemoDrawerPlacement />

<template #code>

<<< @/.vitepress/theme/demos/drawer-placement.vue

</template>
</Demo>

## Which edge

`placement` on `DrawerContent` takes `top`, `bottom`, `left` or `right`. Bottom is the phone
default and reads as a sheet; the sides read as a panel and suit a filter list or a detail view
beside the content it belongs to.

## Dismissal and the handle

`is-dismissable` on `DrawerBackdrop` controls both the click outside *and* whether the drawer can
be dragged away — one setting for both, because a drawer you can drag but not dismiss would spring
back every time.

The drag lives on `DrawerDialog`, not on the handle: the whole panel answers the gesture, and
`DrawerHandle` is only the bar that says so.

`portal-container` says where the drawer is rendered, for an app that is not mounted on `body`.

## Accessibility

- Focus moves into the drawer and back to the trigger, and the page behind is inert while it is
  open — the same guarantees a modal gives, because it is the same machinery.
- `DrawerHeading` names the dialog. A drawer without one is announced as an unnamed dialog, which
  is worse here than in a modal because a drawer is often opened without a deliberate click.
- `DrawerHandle` is `aria-hidden` and has no content slot — it is a pointer affordance with
  nothing to announce. Dragging is never the only way out: <kbd>Esc</kbd> and the backdrop both
  close the drawer, so a reader who cannot drag is not stuck.
- `DrawerDialog` hands `close` to its slot, for a control that has to finish something before the
  drawer goes.

## API

<Api family="drawer" />
