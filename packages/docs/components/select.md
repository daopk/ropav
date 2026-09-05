---
title: Select
description: A choice from a list, in a popover that stays inside the viewport.
outline: [2, 3]
---

# Select

A select is a closed list: the trigger shows the current value, and the options live in a popover
that opens on demand. The collection is passed as data — `items` plus `item-text-value` — so the
component can do typeahead and announce a count without walking the DOM.

```ts
import { Select, SelectPopover, SelectTrigger, SelectValue } from "ropav";
```

::: playground select
:::

## The parts

`SelectTrigger` holds `SelectValue` and `SelectIndicator`. The popover holds a `ListBox`, which
is a component in its own right — a select is a trigger with a list box inside it, not a
different kind of list.

<Demo title="select-basic.vue">
<DemoSelectBasic />

<template #code>

<<< @/.vitepress/theme/demos/select-basic.vue

</template>
</Demo>

`SelectValue` renders the selected item's text, or the `placeholder` when nothing is chosen. Its
slot gives you the selected items themselves if you want to render something richer than a
string.

## Placement

`SelectPopover` takes `placement`, `offset` and `shouldFlip`. The default flips the popover to
the other side when there is not room, so a select near the bottom of the window opens upwards
without being told to.

## Accessibility

- A hidden native `<select>` carries the value into a form, so submission and autofill work the
  way the browser expects.
- Typing while the list is open jumps to the matching option, which is why `item-text-value` is
  needed: it is the text being matched, not the label being rendered.
- The popover is dismissed by <kbd>Esc</kbd>, by a click outside, and by choosing an option —
  and focus goes back to the trigger each time.

## API

<Api family="select" />
