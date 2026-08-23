<script setup lang="ts" vapor>
import type {KbdRootProps} from "./kbd.types";

import {kbdVariants} from "@ropav/styles";
import {computed} from "vue";

import {provideKbdContext} from "./kbd.context";

const props = defineProps<KbdRootProps>();

defineSlots<{default?: () => unknown}>();

const slots = computed(() => kbdVariants({variant: props.variant}));

provideKbdContext({slots});
</script>

<template>
  <kbd :class="slots.base({class: props.class})">
    <slot />
  </kbd>
</template>
