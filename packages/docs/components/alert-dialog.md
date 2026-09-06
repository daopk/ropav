---
title: AlertDialog
description: A dialog that asks for a decision and will not take silence for an answer.
outline: [2, 3]
---

# AlertDialog

An alert dialog interrupts to ask a question with consequences — delete this, discard that. It is
a [Modal](/components/modal) with its defaults turned around: clicking away does not dismiss it,
because dismissing would answer the question by accident.

```ts
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContainer,
  AlertDialogDialog,
  AlertDialogHeading,
  AlertDialogIcon,
} from "ropav";
```

<Demo title="alert-dialog-basic.vue">
<DemoAlertDialogBasic />

<template #code>

<<< @/.vitepress/theme/demos/alert-dialog-basic.vue

</template>
</Demo>

`AlertDialogIcon` takes a `status` and picks its own glyph and colours from it, so a destructive
question does not need an icon chosen by hand.

## The defaults that differ

`is-dismissable` is `false` and `is-keyboard-dismiss-disabled` is `true`. That is the whole point
of reaching for this over a modal: both ways of leaving without answering are closed, so the
reader has to choose one of the buttons.

Turn them back on only when there is a genuine cancel among the choices and losing the dialog
costs nothing. If you find yourself doing that, a modal is probably the component you wanted.

## Accessibility

- Every alert dialog needs both buttons to say what they do. "OK" and "Cancel" on a delete
  confirmation put the decision in the heading and leave the buttons ambiguous; "Delete" and
  "Keep" carry it themselves.
- `AlertDialogHeading` labels the dialog, and it should be the question. A reader hearing the
  heading alone should know what they are being asked.
- The icon is decoration and carries no meaning of its own — a red glyph says nothing to a reader
  who cannot see it, so the words have to say "permanently".
- With dismissal closed off, the buttons are the only way out. Make sure one of them is safe, and
  that it is the one focus lands on.

## API

<Api family="alert-dialog" />
