---
title: DropZone
description: A target for files, from a drag or from the picker.
outline: [2, 3]
---

# DropZone

A drop zone takes files. Dropping and picking are the same act to it: a drag over the zone, or a
click anywhere in it, both end in one `select` event carrying `File` objects. It ships no wording
of its own — what the zone says is yours, and it has to follow the `multiple` you gave it.

```ts
import { DropZone, DropZoneTrigger } from "ropav";
```

<Demo title="drop-zone-basic.vue">
<DemoDropZoneBasic />

<template #code>

<<< @/.vitepress/theme/demos/drop-zone-basic.vue

</template>
</Demo>

`select` is never emitted empty, and a drop that arrives as a folder is walked, so what you
receive is always plain files. `DropZoneTrigger` is a span, not a button: it names the affordance
for a pointer, and a press on it reaches the zone by bubbling.

## Filtering what it takes

`accept` is spelled the way the native attribute spells it — a comma-separated list of mime
types, `type/*` wildcards and `.ext` suffixes. It does three jobs at once: it filters the file
picker, it judges a drag while the pointer is still moving, and it filters what a drop emits.

<Demo title="drop-zone-accept.vue">
<DemoDropZoneAccept />

<template #code>

<<< @/.vitepress/theme/demos/drop-zone-accept.vue

</template>
</Demo>

The `status` slot prop is `idle`, `accept` or `reject`. A drag is only refused where the refusal
is certain: a folder, or a file the platform advertises no mime type for, stays undecided until
the drop. A drag advertises types and nothing else, so while one is moving there is no way to
know whether it carries one wrong file or several — which is why the refusal above is worded
without a count.

Files that arrive despite the filter are dropped silently rather than reported. The browser
already filters the picker half the same way, and the component has no error channel of its own
to show one in.

## Accessibility

- The focusable control is a visually hidden `<input type="file">`, so the zone is one ordinary
  tab stop and the keyboard opens the picker the way it activates any file input. `aria-label`
  names that input; without one there is nothing to announce.
- The instructions for an accessible drag-and-drop are attached to the same input, alongside
  whatever `aria-describedby` you supply.
- `DropZoneTrigger` is deliberately not focusable. A keyboard already reaches this component
  through the input, and a second stop for the same action would only be one to tab past.

## API

<Api family="drop-zone" />
