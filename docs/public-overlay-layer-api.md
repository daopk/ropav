# Overlay layer z-index API

`OverlayLayerProvider` sets a shared z-index floor for Ropav portal surfaces in a Vue subtree.
Component props take precedence over the nearest provider, and components outside a provider keep
their existing defaults.

```vue
<template>
  <OverlayLayerProvider :base-z-index="5000">
    <AppShell />
  </OverlayLayerProvider>
</template>

<script setup lang="ts">
import { OverlayLayerProvider } from 'ropav/overlay';
</script>
```

The provider follows the logical Vue component tree, including content rendered through
`Teleport`. Providers can be nested to create a higher or lower floor for one subtree.

## Component overrides

`DialogRoot`, `Modal`, `Popover`, `DropdownMenu`, `DropdownMenuRoot`, `Tooltip` and `ToastViewport`
accept `baseZIndex`. The resolution order is:

1. The component's `baseZIndex` prop.
2. The nearest `OverlayLayerProvider`.
3. The component's legacy default.

Dialog, Popover and Dropdown layers may end up above the resolved floor because active managed
layers are ordered in two-unit steps. The unused plane immediately below a Dialog content layer is
reserved for its overlay. A top-level Tooltip uses the resolved floor, while a Tooltip nested in a
managed layer uses at least `parentZIndex + 1`. `ToastViewport` applies an offset of `1`.

Without a provider or local override, Dropdown and Popover start at `100`, Dialog and Tooltip start
at `1000`, and ToastViewport uses `1001`.

## Custom portal surfaces

`useOverlayZIndex()` lets custom portal content resolve the same policy without joining Ropav's
focus, inert, dismissal or active-layer management.

```vue
<script setup lang="ts">
import { useOverlayZIndex } from 'ropav/overlay';

const props = defineProps<{ baseZIndex?: number }>();
const zIndex = useOverlayZIndex({
  baseZIndex: () => props.baseZIndex,
  defaultBaseZIndex: 1000,
  offset: 1,
});
</script>
```

| Option              | Default | Description                                                         |
| ------------------- | ------- | ------------------------------------------------------------------- |
| `baseZIndex`        | —       | Local value, ref or getter that overrides the provider.             |
| `defaultBaseZIndex` | `1000`  | Fallback used when neither a local value nor provider is available. |
| `offset`            | `0`     | Value, ref or getter added to the resolved base.                    |
| `aboveParent`       | `true`  | Ensures the result is at least one plane above a parent layer.      |

Set `aboveParent: false` when the custom surface only needs the resolved floor. The returned
`ComputedRef<number>` updates when the local value, provider or parent layer changes.
