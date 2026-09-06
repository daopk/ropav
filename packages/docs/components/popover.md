---
title: Popover
description: A small dialog anchored to the thing that opened it.
outline: [2, 3]
---

# Popover

A popover is a dialog that points at its trigger. It holds things the reader can use — a form, a
list of actions, a short explanation with a link in it — which is what separates it from a
[Tooltip](/components/tooltip), whose contents cannot be reached. For a decision that has to be
answered before anything else, use a [Modal](/components/modal).

```ts
import { Popover, PopoverArrow, PopoverContent, PopoverDialog, PopoverHeading } from "ropav";
```

The first child of `Popover` is the trigger — any element, no wrapper needed. `PopoverContent`
does the positioning, `PopoverDialog` is the box, and `PopoverArrow` is the optional pointer.

<Demo title="popover-basic.vue">
<DemoPopoverBasic />

<template #code>

<<< @/.vitepress/theme/demos/popover-basic.vue

</template>
</Demo>

`default-open` starts it open; `v-model:is-open`, or `is-open` with an `open-change` listener,
hands the state to the caller.

## Where it sits

`placement` on `PopoverContent` names the side, and everything else is the fine tuning: `offset`
along the main axis, `cross-offset` across it, `container-padding` for the gap kept from the edge
of the viewport. `should-flip` is on by default, so a popover that will not fit below its trigger
moves above it rather than off the screen.

The direction is read from the trigger rather than inherited. A popover is rendered at the end of
the document, so a logical placement would otherwise resolve against the body's direction and land
on the wrong side of a trigger sitting in a right-to-left region.

## Modal or not

By default the page behind is inert. `is-non-modal` leaves it interactive, for a popover that
comments on the page rather than interrupting it — a colour picker you keep open while looking at
what it changes.

`should-close-on-interact-outside` filters which outside clicks dismiss it, which is how a popover
survives a click on its own trigger or on a toolbar that belongs with it.

## Accessibility

- The dialog is labelled by `PopoverHeading`. Without one, a screen reader announces a dialog with
  no name and the reader has to explore it to find out what opened.
- <kbd>Esc</kbd> closes it and focus returns to the trigger. `is-keyboard-dismiss-disabled` turns
  that off, and should be rare — a popover that cannot be escaped is worse than one that closes
  too easily.
- `PopoverDialog` hands `close` to its slot, for a control inside that has to close the popover
  after doing something else first.
- The arrow points at the trigger for the eye only. What ties the popover to its trigger for
  everyone else is the focus move, so a popover without one loses nothing.

## API

<Api family="popover" />
