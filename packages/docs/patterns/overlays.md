---
title: Overlays
description: A menu, a drawer and a confirm dialog over one row, each reporting through a toast.
outline: [2, 3]
---

# Overlays

Four families that all open something over the page, and all take their trigger the same way.
[Dropdown](/components/dropdown), [Drawer](/components/drawer) and [Modal](/components/modal) make
their **first child** the trigger — there is no trigger slot — and [Toast](/components/toast) is the
one that has no trigger at all, because a queue is what opens it.

```ts
import { Drawer, Dropdown, Modal, ToastProvider, ToastQueue } from "ropav";
```

<Demo full open title="overlays.vue">
<PatternOverlays />

<template #code>

<<< @/.vitepress/theme/patterns/overlays.vue

</template>
</Demo>

## The trigger is the first child

`<Dropdown><Button>Actions</Button><DropdownPopover>…</DropdownPopover></Dropdown>` is the whole
arrangement. The behaviour is handed down to whatever pressable sits inside rather than built into
a trigger component, so the button stays an ordinary button. `DropdownTrigger`, `DrawerTrigger` and
`ModalTrigger` exist for markup that does not press on its own.

## Closing it yourself

`ModalClose` wraps a control and closes the dialog when it is pressed, which covers the common
case. When the closing is a consequence of something else — a save that succeeded — hold the state
instead: the drawer above takes `v-model:is-open`, so **Apply** can close it and queue a toast in
the same handler.

## A menu reports the choice once

`DropdownMenu` emits `action` with the id of the item chosen, so the items do not each carry a
handler. That is also why every `MenuItem` needs an `id`.

## The queue outlives the toast

A `ToastQueue` is made once and lives as long as the component; `ToastProvider` renders whatever is
in it. Nothing needs to be open for `queue.add` to work, which is what makes it the right thing to
report into from a dialog that is closing.

## Inside one part of the page

Every overlay renders at the end of `body` and treats the whole document as the page behind it.
When the app is one region of a larger page — a window in a desktop-like shell, a widget embedded
in someone else's site — wrap it in `PortalProvider`, which renders no element of its own:

```vue
<script setup lang="ts">
import { PortalProvider } from "ropav/portal-provider";
import { useTemplateRef } from "vue";

const frame = useTemplateRef<HTMLElement>("frame");
</script>

<template>
  <section ref="frame" class="app-frame">
    <PortalProvider :container="frame" :root="frame">
      <slot />
    </PortalProvider>
  </section>
</template>

<style>
/* A containing block for `position: fixed`, so a backdrop covers the frame and not the window. */
.app-frame {
  contain: layout;
}
</style>
```

- **`container`** is where every overlay below renders: modals, alert dialogs, drawers, popovers,
  menus, the listboxes of pickers, tooltips and toast regions. A component's own
  `portal-container` still wins. An element other than the body **has to be a containing block for
  `position: fixed`** — a `transform`, or `contain: layout` or `paint` — sized to the area the
  overlays cover, because backdrops fill it and modals size to it rather than to the visual
  viewport.
- **`root`** is the part of the page they belong to, usually an element holding both the app and
  the container. A modal makes only the root `inert`, holds focus and outside presses only within
  it, and leaves content added later outside it alone; a popover or tooltip flips and shifts to stay
  inside it. The shell and other apps' windows stay live, and a modal in one window is not stacked
  over a modal in another — <kbd>Esc</kbd> closes each in its own.

Leaving a prop out of a nested provider inherits the enclosing one's; `null` goes back to the body
and the whole document. A template ref is `null` on the first render, so an overlay already open
then starts in the body and moves once the ref is set. The scroll lock a modal takes is still
page-wide.

## Accessibility

- An overlay traps focus while open and hands it back to the trigger on close — all three do this,
  and none of it needs wiring.
- <kbd>Esc</kbd> closes each of them, and a press outside does too.
- `DropdownMenu` takes an `aria-label`, because the button that opened it is not its name.
