---
title: ListBox
description: A list you choose from, in place on the page.
outline: [2, 3]
---

# ListBox

A listbox is a list of options with a selection and a keyboard. It stays on the page — a
[Select](/components/select) is the same list inside a popover with a trigger in front of it, and
a [Menu](/components/menu) looks similar but fires actions rather than holding a choice.

```ts
import { ListBox, ListBoxItem, ListBoxItemIndicator, ListBoxSection } from "ropav";
```

Each `ListBoxItem` needs an `id` — that is the key selection is carried in.
`ListBoxItemIndicator` is the tick on a selected row, and `ListBoxSection` groups rows under a
heading.

<Demo title="list-box-selection.vue">
<DemoListBoxSelection />

<template #code>

<<< @/.vitepress/theme/demos/list-box-selection.vue

</template>
</Demo>

## Selection

`selection-mode` is `none` by default, which makes a listbox a plain list. `single` and `multiple`
turn it into a control, and `selection-behavior` decides what a press means when several rows can
be chosen: `toggle` flips the row under the pointer, `replace` clears the rest unless a modifier
is held.

`disallow-empty-selection` keeps one row chosen; `disabled-keys` takes rows out of play, and
`disabled-behavior` says whether a disabled row can still be focused — which matters, because a
row nobody can land on is a row nobody can be told about.

## Long lists

For a list too long to render, wrap it in a `Virtualizer` and give the listbox its `items`. It
then calls its slot once per rendered row instead of once per datum. Two props exist only for that
case: `item-key` names each row, and `item-text-value` is what typeahead matches on — a rendered
row names itself from its content, but the rows that are not rendered can only be reached through
the data.

`ListBoxLoadMoreItem` is the row at the end that fetches the next page.

## Accessibility

- The list is a `role="listbox"` and each row a `role="option"`, so the count and the position are
  announced along with the row.
- Give the listbox a name. `aria-label` or `aria-labelledby` — without one, a reader is told they
  are in a listbox and nothing about which.
- Typeahead moves focus by typing, which is why `item-text-value` matters on a virtualized list:
  without it, typing can only reach what happens to be on screen.
- The indicator is a picture of the selection, not the selection itself — `aria-selected` on the
  row is what is announced, so a row reads correctly with no indicator at all.

## API

<Api family="list-box" />

Rows and their groups are separate components.

<Api family="list-box-item" />

<Api family="list-box-section" />
