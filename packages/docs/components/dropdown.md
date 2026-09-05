---
title: Dropdown
description: A menu of actions, anchored to the control that opened it.
outline: [2, 3]
---

# Dropdown

A dropdown is a menu of things to *do*. That is what separates it from a
[Select](/components/select), which is a value to *choose*: a select has a current value and a
dropdown does not.

The items are `Menu` parts rather than dropdown-specific ones — `MenuItem`, `MenuSection`,
`MenuItemIndicator` — because a dropdown is a popover with a menu inside it, and the same menu
appears in other places.

```ts
import { Dropdown, DropdownMenu, DropdownPopover, MenuItem } from "ropav";
```

## Sections and separators

`MenuSection` groups items that belong together; a `Separator` between sections draws the line.
An item that destroys something takes `variant="danger"`, which is the one place colour is doing
work in a menu.

<Demo title="dropdown-sections.vue">
<DemoDropdownSections />

<template #code>

<<< @/.vitepress/theme/demos/dropdown-sections.vue

</template>
</Demo>

Every item needs an `id` and a `text-value`. The `id` is what a selection reports; the
`text-value` is what typeahead matches against, which matters as soon as an item's content is
more than a string.

## Submenus

`DropdownSubmenuTrigger` opens a nested menu. It is an item and a trigger at once, so it takes
the same `id` and `text-value` as any other item.

## Accessibility

- The menu is one stop in the tab order. Arrow keys move between items, typing jumps to a match,
  and <kbd>Esc</kbd> closes the menu and returns focus to the trigger.
- A trigger with only an icon needs an `aria-label` — `Actions`, not `Menu`, if you can say what
  the actions are about.
- The popover flips and shifts to stay in the viewport, so a menu at the edge of the window opens
  where it fits rather than off-screen.

## API

<Api family="dropdown" />
