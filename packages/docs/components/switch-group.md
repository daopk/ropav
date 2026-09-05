---
title: SwitchGroup
description: Layout for a run of switches, along either axis.
outline: [2, 3]
---

# SwitchGroup

A switch group lays several switches out together. That is the whole of it: it owns no state, no
shared name and no validation, so each [Switch](/components/switch) inside keeps its own `name`,
its own value and its own selection. What it buys you is consistent spacing and one place to
change the axis.

```ts
import { SwitchGroup } from "ropav";
```

<Demo title="switch-group-basic.vue">
<DemoSwitchGroupBasic />

<template #code>

<<< @/.vitepress/theme/demos/switch-group-basic.vue

</template>
</Demo>

Because each switch submits itself, a group inside a `<form>` needs nothing extra — every switch
that is on contributes its own `name` and `value` to the form data.

## Horizontal

<Demo title="switch-group-horizontal.vue">
<DemoSwitchGroupHorizontal />

<template #code>

<<< @/.vitepress/theme/demos/switch-group-horizontal.vue

</template>
</Demo>

A horizontal group will run past its container rather than wrap, so give it something to do about
that — `class="overflow-x-auto"`, or shorter labels.

## When a group is not enough

Switches that need one shared label, or one disabled state across all of them, want a `Fieldset`
around them instead — it is in [Storybook](/guide/storybook) along with the rest. This component
is layout, and a screen reader is told nothing by it.

## API

<Api family="switch-group" />
