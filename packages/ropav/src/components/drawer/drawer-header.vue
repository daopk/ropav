<script setup lang="ts" vapor>
import type { DrawerHeaderProps } from "./drawer.types";

import { computed } from "vue";

import { useDrawerContext } from "./drawer.context";

const props = defineProps<DrawerHeaderProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useDrawerContext();

const styles = computed(() => slots.value.header({ class: props.class }));
</script>

<template>
  <div :class="styles" data-slot="drawer-header">
    <slot />
  </div>
</template>
