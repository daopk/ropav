---
title: Patterns
description: Whole screen fragments, built from several component families at once.
---

# Patterns

A component page shows one family doing one thing. A pattern shows several of them arranged into
something you would ship, and each one is a single file — copying it whole is the intended use.

Nothing here is a new component. Every part has a page of its own; a pattern is only the
arrangement: which part goes inside which, where the state lives, and which of two plausible
components a prop actually belongs on.

- [Form](/patterns/form) — fields in a fieldset, reporting what the browser rejected and what the
  server did.
- [Data table](/patterns/data-table) — search, bulk actions, sorting, selection and pagination
  around one table.
- [App shell](/patterns/app-shell) — a collapsing sidebar, a header that says where you are, and
  the account menu.
- [Overlays](/patterns/overlays) — a menu, a drawer and a confirm dialog, each reporting through a
  toast.
- [Settings](/patterns/settings) — tabs over several sections of fields that share one save.
- [Upload](/patterns/upload) — a drop zone, a file list with progress, and the refusals the zone
  will not report.
- [Async states](/patterns/async) — loading, failed and empty around one collection, and the rule
  that only one of them shows.
- [Scheduling](/patterns/scheduling) — a date and a time held separately, joined into one instant
  only where it is needed.

## Composing patterns

The app shell is the frame and the others are what goes inside it: one `Sidebar` holding a form or
a table in its `SidebarInset`, with the overlays opening over both.

```vue-html
<Sidebar>
  <SidebarPanel aria-label="Main">
    <!-- the navigation -->
  </SidebarPanel>
  <SidebarInset>
    <!-- the header, then the data table or the form -->
  </SidebarInset>
</Sidebar>
```

- `SidebarInset` already sets `min-width: 0`. Without it a table wider than the room it is given
  puts a floor under the whole shell, and the sidebar can never be given its width back.
- So `TableScrollContainer` is what scrolls, and the shell still collapses over the top of it.
- An overlay is teleported out of the inset, so the `overflow: hidden` that keeps the table in
  bounds never clips a menu, a dialog or a toast.
