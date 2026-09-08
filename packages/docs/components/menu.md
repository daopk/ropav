---
title: Menu
description: A list of actions, keyboard-navigable, usually inside a dropdown.
outline: [2, 3]
---

# Menu

A menu is a list of things to *do*. That is the whole difference from a
[ListBox](/components/list-box), which holds a choice: picking a menu item fires it and the menu
goes away. Most of the time a menu lives inside a [Dropdown](/components/dropdown), which supplies
the trigger and the popover around it.

```ts
import { Menu, MenuItem, MenuItemIndicator, MenuSection } from "ropav";
```

Each `MenuItem` needs an `id`, which is what the `action` event carries, and a `text-value` for
typeahead where the label is not plain text. `MenuSection` groups items;
a [Separator](/components/separator) between sections draws the line.

A [Description](/components/description) beside the `Label` makes the item two lines, with a
leading icon and a trailing [Kbd](/components/kbd) staying on the label's own line — wrap the pair
yourself if you need a trailing element of another kind.

<Demo title="menu-basic.vue">
<DemoMenuBasic />

<template #code>

<<< @/.vitepress/theme/demos/menu-basic.vue

</template>
</Demo>

`variant="danger"` on an item is the one place colour does work in a menu — and it still needs the
word "Delete" beside it. The `Label` in the demo is for the type, not the colour.

## When a menu holds a choice

`selection-mode` turns items into a checked set, for the view-style and sort-order menus that are
really settings. `MenuItemIndicator` is the tick, and `should-close-on-select` is worth setting to
`false` there: a menu of checkboxes that closes on the first tick makes the second one a chore.

`MenuItemSubmenuIndicator` is the arrow on an item that opens a submenu.

## Accessibility

- The menu is a `role="menu"` and each item a `role="menuitem"`, so a reader is told they have
  entered a menu and how many things are in it.
- Inside a dropdown the trigger names the menu through `aria-labelledby`. A menu standing on its
  own needs `aria-label` instead.
- `auto-focus` decides where focus lands when the menu opens: a selected item wins over the end
  you asked for, and with neither the menu takes focus itself.
- Typeahead matches on the item's text. Where the label is an icon and a word, `text-value` is
  what makes the item reachable by typing.

## API

<Api family="menu" />

Items and their groups are separate components.

<Api family="menu-item" />

<Api family="menu-section" />
