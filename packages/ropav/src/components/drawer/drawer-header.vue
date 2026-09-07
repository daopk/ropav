<script setup lang="ts" vapor>
import type { DrawerHeaderProps } from "./drawer.types";

const props = defineProps<DrawerHeaderProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <div :class="['rp-drawer__header', props.class]" data-slot="drawer-header">
    <slot />
  </div>
</template>
