---
title: Upload
description: A drop zone, a file list with progress, and the refusals the zone will not report.
outline: [2, 3]
---

# Upload

An upload screen is a target for files and a list of what is on its way.
[DropZone](/components/drop-zone) takes the files — a drag and the picker both end in one `select`
event — and everything after that is yours: a row per file, a
[ProgressBar](/components/progress-bar) on each, and somewhere to say what was turned away.

```ts
import { Alert, DropZone, DropZoneTrigger, EmptyState, ProgressBar } from "ropav";
```

<Demo full open title="upload.vue">
<PatternUpload />

<template #code>

<<< @/.vitepress/theme/patterns/upload.vue

</template>
</Demo>

## The zone refuses quietly, so the screen explains

`accept` filters three things at once — the picker, the drag while it is still moving, and what a
drop emits. The files it turns away never reach `select`, and no error comes with them: the
component has no channel to show one in. Anything `accept` cannot express is therefore the half
that *can* explain itself, which is why the size cap above is applied in the handler and reported
in an [Alert](/components/alert) naming the files.

## What select hands you

`select` is never emitted empty, a folder dropped on the zone is walked so you receive plain files,
and `multiple` is honoured before you see them. So the handler takes `File[]` and does not have to
re-check any of that — only the things it added itself.

## One row, one label

A `ProgressBar` carries its own `Label` and `ProgressBarOutput`, so the file name and the
percentage are parts of the bar rather than text sitting beside it. That is what makes a row
announce as one thing instead of three.

## Accessibility

- The focusable control is a visually hidden file input, so the zone is one ordinary tab stop and
  needs an `aria-label` — without one there is nothing to announce.
- `DropZoneTrigger` is deliberately not focusable. The keyboard already reaches the zone through
  that input, and a second stop for the same action is only one to tab past.
- Each remove button names its file. A row of identical "Remove" buttons tells a screen-reader
  user which row they are in only by accident.
