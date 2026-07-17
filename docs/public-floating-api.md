# Public floating API

`useFloatingPosition` provides Ropav's positioning behavior without rendering component DOM or
styles. It applies the same offset, flip, shift and collision defaults used by Ropav overlays.

```vue
<template>
  <button
    ref="reference"
    type="button"
    aria-haspopup="dialog"
    :aria-expanded="open"
    @click="open = !open"
  >
    Toggle card
  </button>

  <Teleport :to="teleportTo" :disabled="!teleport">
    <section v-if="open" ref="floating" :style="floatingStyle" :data-placement="actualPlacement">
      Custom content
      <span ref="arrow" :style="arrowStyle" aria-hidden="true" />
    </section>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useFloatingPosition } from 'ropav/floating';
import { useTeleportTarget } from 'ropav/teleport-provider';

const reference = ref<HTMLElement | null>(null);
const floating = ref<HTMLElement | null>(null);
const arrow = ref<HTMLElement | null>(null);
const open = ref(false);
const teleport = ref(true);
const teleportTo = useTeleportTarget();

const { actualPlacement, arrowStyle, floatingStyle } = useFloatingPosition({
  reference,
  floating,
  arrow,
  open,
  placement: 'bottom-start',
  offset: 8,
  restartKey: () => [teleport.value, teleportTo.value],
});
</script>
```

The composable accepts plain values, refs, computed refs or getters for reactive options.

| Option                             | Default    | Description                                                            |
| ---------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `reference`                        | required   | Element or virtual element used as the anchor.                         |
| `floating`                         | required   | Floating HTML element.                                                 |
| `arrow`                            | —          | Optional arrow HTML element.                                           |
| `open`                             | `true`     | Suspends positioning and auto-updates when false.                      |
| `placement`                        | `bottom`   | Preferred side and optional alignment.                                 |
| `strategy`                         | `absolute` | CSS positioning strategy: `absolute` or `fixed`.                       |
| `offset`                           | `8`        | Main/cross-axis distance from the reference.                           |
| `flip`                             | `true`     | Tries the opposite side when space is insufficient.                    |
| `flipOptions.fallbackStrategy`     | `bestFit`  | Chooses the best fit or preserves the initial placement when none fit. |
| `shift`                            | `true`     | Keeps the floating element inside the collision boundary.              |
| `collisionPadding`                 | `8`        | Padding between the floating element and viewport boundary.            |
| `autoUpdateOptions.animationFrame` | `false`    | Tracks transform animations and detached nested floating contexts.     |
| `restartKey`                       | —          | Rebinds auto-update observers when its reactive value changes.         |

Use `autoUpdateOptions.animationFrame` sparingly. It checks the reference position every animation
frame and is intended for references moving with CSS transforms or nested floating elements outside
their ancestor's scrolling context. The animation-frame loop only runs while positioning is open.

`Popover`, `Tooltip`, `DropdownMenu`, `DropdownMenuContent` and `DropdownMenuSubContent` accept the
same `flipOptions` and `autoUpdateOptions` objects. On the data-driven `DropdownMenu`, the options
also apply to its open submenus. Each open floating element using `animationFrame: true` runs its own
animation-frame loop.

The return value contains readonly `actualPlacement`, `floatingStyle`, `arrowStyle` and
`isPositioned` refs, plus an async `update()` method for content-driven layout changes.

`useTeleportTarget()` resolves the nearest `TeleportProvider` target and falls back to `body`. Pass
a target value, ref or getter to override the provider for one floating element. Include the
resolved target and the Teleport enabled state in `restartKey` whenever either can change while the
floating element is open.

Positioning does not add interaction or accessibility behavior. Custom overlays remain responsible
for keyboard handling, focus management, roles, labels, outside interaction and dismissal.

## Hover disclosure interactions

`useHoverDisclosure` manages hover and focus state without rendering DOM or positioning content. It
coordinates the trigger and floating content, so a close delay started when the pointer leaves the
trigger is cancelled when the pointer enters the content.

```vue
<template>
  <a ref="reference" href="/people/ada" v-bind="triggerProps">Ada Lovelace</a>

  <Teleport to="body">
    <section
      v-if="isOpen"
      ref="floating"
      v-bind="contentProps"
      :style="floatingStyle"
      :data-placement="actualPlacement"
    >
      Mathematician and writer
    </section>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useFloatingPosition, useHoverDisclosure } from 'ropav/floating';

const reference = ref<HTMLElement | null>(null);
const floating = ref<HTMLElement | null>(null);

const { isOpen, triggerProps, contentProps } = useHoverDisclosure({
  openDelay: 600,
  closeDelay: 150,
});

const { actualPlacement, floatingStyle } = useFloatingPosition({
  reference,
  floating,
  open: isOpen,
  placement: 'bottom-start',
});
</script>
```

Focus opens immediately by default. Hover uses `openDelay`; leaving the combined trigger/content
area uses `closeDelay`. Escape dismisses an open disclosure even when keyboard focus is elsewhere.
The return value also contains `state`, `isDisabled`, and immediate `open()`, `close()` and
`toggle()` controls.

| Option              | Default | Description                                                                 |
| ------------------- | ------- | --------------------------------------------------------------------------- |
| `open`              | —       | Controlled open state. Omit it for internal state.                          |
| `defaultOpen`       | `false` | Initial internal state.                                                     |
| `openDelay`         | `0`     | Delay in milliseconds before pointer hover opens the disclosure.            |
| `closeDelay`        | `0`     | Delay before closing after pointer and focus leave trigger and content.     |
| `disabled`          | `false` | Prevents opening and closes pending/open internal state.                    |
| `openOnFocus`       | `true`  | Opens immediately when focus enters the trigger.                            |
| `closeOnEscape`     | `true`  | Allows Escape to dismiss the disclosure.                                    |
| `touchBehavior`     | `none`  | `toggle` opts into tap-to-toggle and prevents the activating click default. |
| `interactionTarget` | —       | External element, selector or virtual reference that owns trigger events.   |
| `contentTarget`     | —       | External element or selector that owns content events.                      |
| `onOpenChange`      | —       | Receives the requested state and its interaction reason.                    |

When `interactionTarget` or `contentTarget` is supplied, the composable attaches the corresponding
listeners directly; do not also bind the matching props to that same element. An element reference
is used directly. A virtual reference uses its `contextElement` for events. A virtual reference
without `contextElement` cannot receive pointer or focus events, so control it with `open` or the
imperative methods instead.

The composable only owns disclosure interaction. Consumers remain responsible for content roles,
labels and deciding whether the revealed information is appropriate for hover/focus. Interactive
dialogs and focus-trapped content should use `Popover` or `Dialog` instead.
