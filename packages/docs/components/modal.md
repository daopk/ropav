---
title: Modal
description: A dialog that takes over the page until it is answered.
outline: [2, 3]
---

# Modal

A modal interrupts. Everything behind it stops being reachable — by pointer, by keyboard and in
the accessibility tree — until it closes, which is why it is the right shape for a question that
has to be answered and the wrong one for anything else.

```ts
import { Modal, ModalBackdrop, ModalContainer, ModalDialog } from "ropav";
```

## The layers

There are three, and each does one job. `ModalBackdrop` dims the page and takes the click that
dismisses it. `ModalContainer` positions the dialog and decides how it scrolls. `ModalDialog` is
the box. Splitting them is what lets a tall dialog scroll its own body on a phone and the whole
page on a desktop, without either being a special case.

<Demo title="modal-basic.vue">
<DemoModalBasic />

<template #code>

<<< @/.vitepress/theme/demos/modal-basic.vue

</template>
</Demo>

The first child of `Modal` is the trigger — anything at all; it does not need a special
component. `ModalClose` wraps whatever should close the dialog, and `ModalCloseTrigger` is the
ready-made × in the corner.

## Placement and size

`ModalContainer` takes `placement`, `size` and `scroll`. `scroll` is the one worth choosing
deliberately: it decides whether a dialog taller than the window scrolls inside itself or takes
the page with it.

## Dismissal

`ModalBackdrop` takes `is-dismissable` and `is-keyboard-dismiss-disabled`. Turn dismissal off
only when losing the dialog would lose work — a half-finished form, an operation in flight. A
dialog that cannot be escaped is a trap for anyone who opened it by accident.

## Accessibility

- Focus moves into the dialog when it opens and back to the trigger when it closes, and it cannot
  leave while the dialog is open.
- The page behind is inert, so a screen reader cursor cannot wander into it.
- `ModalHeading` labels the dialog. Give every modal one, even when the heading is obvious from
  the body.
- Scrolling behind the dialog is locked, and released when it closes.

## API

<Api family="modal" />
