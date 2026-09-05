---
title: TagGroup
description: A set of tags that can be selected, removed, or just read.
outline: [2, 3]
---

# TagGroup

A tag group is a focusable set of labels. Each `Tag` can be selected, removed, both or neither —
and with none of those turned on it is still a group of tags rather than a run of styled spans,
because the keyboard can walk it and a screen reader can count it.

```ts
import { Tag, TagGroup, TagGroupList } from "ropav";
```

`TagGroup` owns the state and the field wiring; `TagGroupList` is the collection the tags sit in.
They are separate so a `Label`, a `Description` or an `ErrorMessage` can be a sibling of the list
rather than a child of it, and still be associated with it by id.

::: playground tag-group
:::

`selection-mode` is `none` until you say otherwise. `size` and `variant` set on the group are
shared by every tag in it, and `disabled-keys` takes individual tags out.

## Removing

Supplying `on-remove` is what puts a remove button on each tag — the presence of the handler is
the signal, so there is no second prop to keep in step with it. It is called with a `Set` of keys,
which is what lets removing a selected tag take the rest of the selection with it.

<Demo title="tag-group-removable.vue">
<DemoTagGroupRemovable />

<template #code>

<<< @/.vitepress/theme/demos/tag-group-removable.vue

</template>
</Demo>

The list's `#empty` slot is what shows once the last tag has gone. A tag whose content is more
than a string needs a `text-value`, which is what typeahead matches on and what the tag is
announced by.

## Accessibility

- The list is a `grid` and each tag a row with a single cell, which is the pattern that lets a tag
  hold a remove button without that button becoming a second tab stop.
- The whole group is one tab stop. Arrow keys move between tags, typing jumps to a match, and
  <kbd>Backspace</kbd> or <kbd>Delete</kbd> removes the focused tag when removing is on.
- With no visible `Label`, give `TagGroupList` an `aria-label`.
- An empty list reports `role="group"` rather than `grid`, so an empty state is not announced as a
  table with nothing in it.

## API

<Api family="tag-group" />

`Tag` and its remove button come from the same import, and are documented here because a group is
the only place they appear.

<Api family="tag" />
