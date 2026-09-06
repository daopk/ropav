---
title: Disclosure
description: A heading that opens the section under it.
outline: [2, 3]
---

# Disclosure

A disclosure is one section that opens and closes. It stands on its own — reach for a
[DisclosureGroup](/components/disclosure-group) only when several of them compete for the same
space and opening one should close the last.

```ts
import {
  Disclosure,
  DisclosureBody,
  DisclosureContent,
  DisclosureHeading,
  DisclosureIndicator,
} from "ropav";
```

`DisclosureHeading` is the heading, `DisclosureContent` is the panel it controls, and
`DisclosureBody` is the padded box inside that panel — the split is what lets the panel animate
its height while its contents keep their own spacing.

<Demo title="disclosure-basic.vue">
<DemoDisclosureBasic />

<template #code>

<<< @/.vitepress/theme/demos/disclosure-basic.vue

</template>
</Demo>

`default-expanded` starts it open; `v-model:is-expanded`, or `is-expanded` with an
`expanded-change` listener, hands the state to the caller. An `id` is only needed inside a group,
where it is the key the group tracks.

## The trigger is whatever you put there

A disclosure hands its press behaviour down to the first pressable inside the heading, so an
ordinary [Button](/components/button) becomes the trigger — with `aria-expanded` and
`aria-controls` already wired to the panel — and nothing has to be forwarded. `DisclosureContent`
shadows that, so a button inside the panel stays an ordinary button.

`DisclosureTrigger` exists for the case where the heading holds something that is not pressable on
its own and you want to say where the press goes.

## Accessibility

- The heading is a real `<h3>`, so the section appears in a document outline where a reader
  navigating by heading expects to find it.
- The panel keeps `role="group"` by default. Where the section is a region of the page in its own
  right, `role="region"` on `DisclosureContent` says so.
- `is-disabled` reaches the trigger, which becomes a real `disabled` button and leaves the tab
  order with it. Where the section should still be findable, say in the heading why it is
  unavailable rather than disabling it.

## API

<Api family="disclosure" />
