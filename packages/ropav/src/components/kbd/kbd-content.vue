<script setup lang="ts" vapor>
import type { KbdContentProps } from "./kbd.types";

import { useKbdContext } from "./kbd.context";

const props = defineProps<KbdContentProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useKbdContext();
</script>

<template>
  <span :class="slots.content({ class: props.class })">
    <slot />
  </span>
</template>
