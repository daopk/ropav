<script setup lang="ts" vapor>
import type { DrawerFooterProps } from "./drawer.types";

import { computed } from "vue";

import { useDrawerContext } from "./drawer.context";

const props = defineProps<DrawerFooterProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useDrawerContext();

const styles = computed(() => slots.value.footer({ class: props.class }));
</script>

<template>
  <div :class="styles" data-slot="drawer-footer">
    <slot />
  </div>
</template>
