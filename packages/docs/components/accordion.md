---
title: Accordion
description: A stack of sections, each opening under its own heading.
outline: [2, 3]
---

# Accordion

An accordion is a set of sections that share a frame: one border round the lot, a rule between
each. That framing is the difference from a
[DisclosureGroup](/components/disclosure-group), which coordinates the same expanding behaviour
without drawing anything — reach for the group when the sections are already inside cards or a
layout of their own.

```ts
import {
  Accordion,
  AccordionBody,
  AccordionHeading,
  AccordionIndicator,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "ropav";
```

`AccordionItem` is one section. Inside it, `AccordionHeading` holds `AccordionTrigger` — the
pressable row — and `AccordionPanel` holds `AccordionBody`, the padded box that appears.

<Demo title="accordion-basic.vue">
<DemoAccordionBasic />

<template #code>

<<< @/.vitepress/theme/demos/accordion-basic.vue

</template>
</Demo>

## One at a time, or several

By default opening a section closes the last. `allows-multiple-expanded` lets them stand open
together, which is what you want when the sections are reference material a reader compares rather
than steps they work through.

Each item needs an `id` to be keyed by — one is generated if you leave it out, but then
`expanded-keys` has nothing stable to name. `default-expanded-keys` starts the accordion somewhere
and `v-model:expanded-keys` hands the state to the caller.

`hide-separator` drops the rules between items, and `is-disabled` on the accordion disables every
item in it while an item can still disable itself.

## Accessibility

- Every trigger is inside a real heading, so the sections appear in a document outline and a
  reader navigating by heading finds them.
- The trigger carries `aria-expanded` and `aria-controls`, and the panel is what those point at.
- The panel is a `role="group"` by default. Where a section is a region of the page in its own
  right, `role="region"` on `AccordionPanel` says so.
- With one section open at a time, opening one closes another under the reader. That is a reason
  to prefer `allows-multiple-expanded` wherever the sections are things to read rather than a
  sequence to work through.

## API

<Api family="accordion" />
