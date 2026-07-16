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

| Option             | Default    | Description                                                    |
| ------------------ | ---------- | -------------------------------------------------------------- |
| `reference`        | required   | Element or virtual element used as the anchor.                 |
| `floating`         | required   | Floating HTML element.                                         |
| `arrow`            | —          | Optional arrow HTML element.                                   |
| `open`             | `true`     | Suspends positioning and auto-updates when false.              |
| `placement`        | `bottom`   | Preferred side and optional alignment.                         |
| `strategy`         | `absolute` | CSS positioning strategy: `absolute` or `fixed`.               |
| `offset`           | `8`        | Main/cross-axis distance from the reference.                   |
| `flip`             | `true`     | Tries the opposite side when space is insufficient.            |
| `shift`            | `true`     | Keeps the floating element inside the collision boundary.      |
| `collisionPadding` | `8`        | Padding between the floating element and viewport boundary.    |
| `restartKey`       | —          | Rebinds auto-update observers when its reactive value changes. |

The return value contains readonly `actualPlacement`, `floatingStyle`, `arrowStyle` and
`isPositioned` refs, plus an async `update()` method for content-driven layout changes.

`useTeleportTarget()` resolves the nearest `TeleportProvider` target and falls back to `body`. Pass
a target value, ref or getter to override the provider for one floating element. Include the
resolved target and the Teleport enabled state in `restartKey` whenever either can change while the
floating element is open.

Positioning does not add interaction or accessibility behavior. Custom overlays remain responsible
for keyboard handling, focus management, roles, labels, outside interaction and dismissal.
