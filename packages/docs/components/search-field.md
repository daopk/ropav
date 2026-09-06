---
title: SearchField
description: A text field that knows it is a search, with a clear button and an Escape key.
outline: [2, 3]
---

# SearchField

A search field is a [TextField](/components/textfield) with the search behaviours built in: a
clear button that appears when there is something to clear, <kbd>Esc</kbd> to empty it, and a
`type="search"` control so the browser offers the right keyboard and history.

```ts
import {
  Label,
  SearchField,
  SearchFieldClearButton,
  SearchFieldGroup,
  SearchFieldInput,
  SearchFieldSearchIcon,
} from "ropav";
```

::: playground search-field
:::

`SearchFieldGroup` is the bordered box; the icon, the input and the clear button sit inside it in
whatever order you put them.

<Demo title="search-field-clearable.vue">
<DemoSearchFieldClearable />

<template #code>

<<< @/.vitepress/theme/demos/search-field-clearable.vue

</template>
</Demo>

## Searching as you type, or on submit

The field emits `change` for every keystroke and `submit` when <kbd>Enter</kbd> is pressed. Which
one you listen to is the difference between a filter and a search: a filter narrows a list that is
already on screen, a search goes and fetches something.

Validation works as it does on any field — `is-required`, `validate`, and `is-invalid` taking the
field over when it is set either way.

## Accessibility

- <kbd>Esc</kbd> clears the field. That is a real convenience and also a small hazard: a reader
  who presses it expecting to close something loses what they typed instead, so do not put a
  search field inside a dialog that Escape should close.
- The clear button names itself and only appears when there is text, so it is not a button that
  sits in the tab order doing nothing.
- `SearchFieldSearchIcon` is decoration. The `Label` is what names the field — a magnifying glass
  says "search" only to people who can see it.

## API

<Api family="search-field" />
