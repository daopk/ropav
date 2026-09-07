<script setup lang="ts" vapor>
import type { DrawerFooterProps } from "./drawer.types";

const props = defineProps<DrawerFooterProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <div :class="['rp-drawer__footer', props.class]" data-slot="drawer-footer">
    <slot />
  </div>
</template>
