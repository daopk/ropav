---
title: Settings
description: Tabs over several sections of fields that share one save.
outline: [2, 3]
---

# Settings

A settings screen is several forms that share one save. [Tabs](/components/tabs) splits the fields
into sections, each section is a [Fieldset](/components/fieldset) with its own legend, and one
[Form](/patterns/form) around the whole deck means a single submit carries all of them — including
the sections nobody opened.

```ts
import { Fieldset, Form, Switch, Tabs, TabsPanel, TabsTab, TextField } from "ropav";
```

<Demo full open title="settings.vue">
<PatternSettings />

<template #code>

<<< @/.vitepress/theme/patterns/settings.vue

</template>
</Demo>

## A panel that unmounts takes its fields with it

`TabsPanel` renders only while its tab is selected, so a field in another tab is not in the DOM and
a `FormData` read off the submit event never sees it. `should-force-mount` keeps every panel
mounted; the unselected ones go `inert`, which keeps them out of the tab order and out of what a
screen reader walks, but they are still fields in a form and still submit. Save the form above
without opening a tab to see what it carried.

## Mounted is not hidden

Force-mounting only stops the panel being destroyed — it stays in the layout, so a deck of three
renders as three sections stacked down the page. Hiding the unselected ones is the screen's job,
and `display: none` on `[data-inert]` is the whole of it: a hidden field is still a field, so
nothing drops out of the submission.

## One form around the deck, or one in each panel

`Form` sits outside `Tabs` here, so one submit carries all three sections and one row of actions
serves them. A `Form` inside each panel is the other arrangement — it wants its own actions in each
one, and it is what you want when a section saves to its own endpoint.

## Everything is mounted at once

Force-mounting pays for all three panels on first render rather than on the first visit to each
tab. `keyboard-activation="manual"` does not help with that: it changes when a tab is selected, not
when a panel exists. A section expensive enough to mind about should stay unmounted with its values
held in your own state instead.

## Accessibility

- The tab list is one stop in the tab order. Arrow keys move between the tabs,
  <kbd>Home</kbd> and <kbd>End</kbd> reach the ends.
- `TabsList` takes an `aria-label`. A heading above the deck names the screen, not the set of tabs.
- Each `FieldsetLegend` is read before the fields inside it, so the section name reaches a screen
  reader even though the tab it belongs to is doing the same job visually.
