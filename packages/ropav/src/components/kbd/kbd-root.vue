<script setup lang="ts" vapor>
import type { KbdRootProps } from "./kbd.types";

import { kbdVariants } from "@ropav/styles";
import { computed } from "vue";

const props = defineProps<KbdRootProps>();

defineSlots<{ default?: () => unknown }>();

const slots = computed(() => kbdVariants({ variant: props.variant }));
</script>

<template>
  <kbd :class="slots.base({ class: props.class })">
    <slot />
  </kbd>
</template>
