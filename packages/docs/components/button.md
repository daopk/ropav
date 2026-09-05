---
title: Button
description: A button fires an action, in seven variants and three sizes.
outline: [2, 3]
---

# Button

A button fires an action. It carries the press, hover and focus behaviour the rest of the
library reuses, which is why a dropdown, a modal and a tooltip each wrap one to make a trigger.

```ts
import { Button } from "ropav";
```

## Variants

<Demo title="button-variants.vue">
<DemoButtonVariants />

<template #code>

<<< @/.vitepress/theme/demos/button-variants.vue

</template>
</Demo>

## Sizes

The default size lives in the base class, so a button with no `size` never looks unstyled.

<Demo title="button-sizes.vue">
<DemoButtonSizes />

<template #code>

<<< @/.vitepress/theme/demos/button-sizes.vue

</template>
</Demo>

## Icons

An icon goes in the default slot beside the label. A button whose whole content is one icon
takes `is-icon-only`, and needs an `aria-label` — there is no text left to name it.

<Demo title="button-icons.vue">
<DemoButtonIcons />

<template #code>

<<< @/.vitepress/theme/demos/button-icons.vue

</template>
</Demo>

## Pending and disabled

`is-pending` marks an in-flight action. It renders `data-pending` and blocks activation while
keeping the button focusable, so assistive technology can still reach it and hear what changed.
`is-disabled` is the other choice on purpose: a disabled button leaves the tab order entirely.

A pending button that would otherwise submit a form is switched to `type="button"` while it
waits. Blocking the click is not enough on its own — implicit submission reaches the form
through the button's type, without a click ever landing.

<Demo title="button-pending.vue">
<DemoButtonPending />

<template #code>

<<< @/.vitepress/theme/demos/button-pending.vue

</template>
</Demo>

## Full width

<Demo title="button-full-width.vue">
<DemoButtonFullWidth />

<template #code>

<<< @/.vitepress/theme/demos/button-full-width.vue

</template>
</Demo>

## Styling

Every component takes a `class` prop, appended to the classes its recipe already carries.
Component rules live in the `components` layer and utilities in the later `utilities` one, so a
utility passed this way wins on layer order alone — nothing has to be stripped for it to land.

A colour that more than one state paints goes through a custom property instead, so a single
state can be retuned without flattening the rest.

```vue
<Button class="w-full" variant="secondary">Save</Button>
<Button class="[--button-bg-hover:var(--success)]">Publish</Button>
```

## Accessibility

- Renders a native `<button>`, and `type` defaults to `"button"` so it never submits by accident.
- An explicit `tabindex` is written even though a native button is already tabbable: Safari does
  not focus one without it. A disabled button gets none, so it is not reachable at all.
- Moving into and out of the pending state is announced, but only while the button is focused —
  that is when the change is part of what the reader is doing.
- Under Forced Colors Mode the focus ring is redrawn as an outline, because the mode strips
  `box-shadow` and every ring in this library is one.

## API

Props for `Button`. `class` is accepted by every component and is left out.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `"primary" \| "secondary" \| "tertiary" \| "outline" \| "ghost" \| "danger" \| "danger-soft"` | `"primary"` | Button variant. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Button size. |
| `type` | `"button" \| "reset" \| "submit"` | `"button"` | Native button type. |
| `isDisabled` | `boolean` | — | Disables the button. |
| `isPending` | `boolean` | — | Marks an in-flight action. Blocks activation, keeps focus. |
| `isIconOnly` | `boolean` | — | Renders the icon-only shape. |
| `fullWidth` | `boolean` | — | Stretches the button to the full width of its container. |

### Slot props

The default slot receives the button's own state, so content can follow it.

| Prop | Type |
| --- | --- |
| `isDisabled` | `boolean` |
| `isFocusVisible` | `boolean` |
| `isHovered` | `boolean` |
| `isPending` | `boolean` |
| `isPressed` | `boolean` |

### Events

| Event | Payload |
| --- | --- |
| `click` | `MouseEvent` |
