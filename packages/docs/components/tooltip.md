---
title: Tooltip
description: A short label that appears on hover or focus, and never holds anything interactive.
outline: [2, 3]
---

# Tooltip

A tooltip names or clarifies the thing it points at. It appears on hover and on focus, and it is
never the only place something is said — a reader on a touch screen may never see it at all.

```ts
import { Tooltip, TooltipContent, TooltipTrigger } from "ropav";
```

## Placement

`TooltipContent` takes the placement. It flips to the opposite side when there is not room, so
these four are a preference rather than an instruction.

<Demo title="tooltip-placements.vue">
<DemoTooltipPlacements />

<template #code>

<<< @/.vitepress/theme/demos/tooltip-placements.vue

</template>
</Demo>

`TooltipArrow` is optional and points back at the trigger from whichever side the tooltip ended
up on.

## Delay

`delay` is how long a pointer has to rest before the tooltip opens, and `close-delay` is how long
it stays after the pointer leaves. The delay is what stops a row of icon buttons flashing
tooltips as the pointer crosses them; set it to `0` only for a single control that is being
demonstrated.

## What not to put in one

- **Nothing interactive.** A tooltip closes when the pointer leaves the trigger, so a link or
  button inside it cannot reliably be reached. Use a [Dropdown](/components/dropdown) or a
  [Modal](/components/modal).
- **Nothing essential.** If the reader has to know it to proceed, it belongs on the page.
- **Not a name that is already there.** A tooltip repeating a visible label adds noise for
  someone using a screen reader, who hears both.

## Accessibility

- A trigger with no visible text still needs an `aria-label`. The tooltip describes the control;
  it does not name it.
- Focusing the trigger opens the tooltip, so a keyboard reader gets what a pointer reader gets.
- <kbd>Esc</kbd> closes it without moving focus.

## API

<Api family="tooltip" />
