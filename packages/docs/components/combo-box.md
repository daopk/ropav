---
title: ComboBox
description: A text field that filters a list as you type.
outline: [2, 3]
---

# ComboBox

A combo box is a text field with a list behind it: typing narrows the options, and the reader
either picks one or — if you allow it — keeps what they typed. Where the reader should only ever
choose from the list and never type, a [Select](/components/select) is simpler and says so.

```ts
import {
  ComboBox,
  ComboBoxInputGroup,
  ComboBoxPopover,
  ComboBoxTrigger,
  Input,
  ListBox,
  ListBoxItem,
} from "ropav";
```

`items` is required, and the default slot receives the *filtered* list — so the options are
rendered from what the filter narrowed to, not from the whole set. `ComboBoxInputGroup` is the
field, `ComboBoxTrigger` the button that opens the popover without typing, and the popover holds
an ordinary [ListBox](/components/list-box).

<Demo title="combo-box-filtering.vue">
<DemoComboBoxFiltering />

<template #code>

<<< @/.vitepress/theme/demos/combo-box-filtering.vue

</template>
</Demo>

## Filtering and opening

`default-filter` replaces the built-in match; pass `null` to switch filtering off entirely, which
is what you do when the server is already returning the matches. `item-text-value` is both what is
shown in the field and what the filter reads.

`menu-trigger` decides when the popover appears — on `focus` by default, or only once the reader
has typed. `allows-empty-collection` lets it open with nothing in it, for a "no matches" message.

## Text that is not an option

`allows-custom-value` lets what the reader typed stand as the value. With it off, leaving the
field snaps back to the last real option, which `should-close-on-blur` controls.

`form-value` decides what actually gets submitted — the chosen option's `key`, or the `text` in
the field. On a combo box that allows custom values the second is usually what you want, since
there may be no key at all.

## Accessibility

- The field is a `role="combobox"` carrying `aria-autocomplete="list"` and `aria-expanded`, so a
  reader is told there are options to narrow before they start typing.
- Filtering changes what is under the reader while they type. The count is announced as the list
  narrows, which is what stops a shrinking list from being silent.
- `item-text-value` is what typeahead and the filter both read. Without it, an option whose label
  is markup rather than text cannot be matched at all.
- `allows-custom-value` is a real accessibility decision, not only a data one: with it off, a
  reader who types something almost-right loses it on blur with no warning.

## API

<Api family="combo-box" />
