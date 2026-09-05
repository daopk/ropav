---
title: DisclosureGroup
description: Several disclosures that answer to one another.
outline: [2, 3]
---

# DisclosureGroup

A disclosure group coordinates a set of disclosures: by default opening one closes the last, and
`allows-multiple-expanded` lets them stand open together. Without a group each `Disclosure` is
independent, which is often what you want — reach for the group when the sections compete for the
same space.

```ts
import { Disclosure, DisclosureGroup } from "ropav";
```

<Demo title="disclosure-group-basic.vue">
<DemoDisclosureGroupBasic />

<template #code>

<<< @/.vitepress/theme/demos/disclosure-group-basic.vue

</template>
</Demo>

Each disclosure needs an `id` to be keyed by, and those keys are what `expanded-keys` carries.
`default-expanded-keys` starts the group somewhere; `v-model:expanded-keys`, or `expanded-keys`
with an `expanded-change` listener, hands the state to the caller.

`is-disabled` on the group disables every disclosure in it, and a disclosure can still disable
itself. The parts inside — `DisclosureHeading`, `DisclosureContent`, `DisclosureBody`,
`DisclosureIndicator` — belong to `Disclosure`, which is in [Storybook](/guide/storybook) along
with the rest.

## The trigger is whatever you put there

A disclosure hands its press behaviour down to the first pressable inside it, so an ordinary
[Button](/components/button) in the heading becomes the trigger — with the `aria-expanded` and
`aria-controls` wiring already on it — and nothing has to be forwarded. `DisclosureContent`
shadows that, so a button inside the panel stays an ordinary button.

## Accessibility

- The heading is a real `<h3>`, so the sections show up in a document outline the way a reader
  navigating by heading expects.
- The trigger carries `aria-expanded` and `aria-controls`, and the panel is what those point at.
- With one panel open at a time, closing happens under the reader — which is a reason to prefer
  `allows-multiple-expanded` where the sections are reference material rather than steps.

## API

<Api family="disclosure-group" />
