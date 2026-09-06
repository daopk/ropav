---
title: Autocomplete
description: A select whose options can be narrowed by typing.
outline: [2, 3]
---

# Autocomplete

An autocomplete is a [Select](/components/select) with a search box in its popover. The trigger
shows the chosen option rather than a text field, which is the difference from a
[ComboBox](/components/combo-box): here the reader is always choosing from the list, and the
typing only narrows it.

```ts
import {
  Autocomplete,
  AutocompleteFilter,
  AutocompleteIndicator,
  AutocompletePopover,
  AutocompleteTrigger,
  AutocompleteValue,
} from "ropav";
```

It takes every prop a select takes, `items` included — that is what answers for the options while
the popover is shut and nothing has been rendered yet.

<Demo title="autocomplete-basic.vue">
<DemoAutocompleteBasic />

<template #code>

<<< @/.vitepress/theme/demos/autocomplete-basic.vue

</template>
</Demo>

`AutocompleteFilter` is the search box inside the popover, and `AutocompleteClearButton` empties
the selection — which emits `clear` rather than taking an `onClear` prop, because Vue would route
a listener of that name to an emit anyway and fire the handler twice.

## Which of the three to reach for

- A [Select](/components/select) when the list is short enough to read.
- An autocomplete when it is long but still a fixed list — the reader is choosing, not writing.
- A [ComboBox](/components/combo-box) when what they type may itself be the answer.

## Accessibility

- `AutocompleteTrigger` is a `role="group"` holding the value and the button that opens the
  popover, and that button is labelled by both — so a reader hears the current choice and the
  field's name together, rather than an empty text field they might think they have to fill in.
- Focus moves into the filter when the popover opens and back to the trigger when it closes, so
  typing goes where the reader expects without them having to find it.
- `selection-mode="multiple"` announces each option's selected state as it is toggled; the trigger
  then summarises what was chosen, which is the part that has to stay readable as the list grows.

## API

<Api family="autocomplete" />
