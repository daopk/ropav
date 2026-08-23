<script setup lang="ts" vapor>
import type { ColorInputGroupSuffixProps } from "./color-input-group.types";

import { computed } from "vue";

import { useColorInputGroupContext } from "./color-input-group.context";

const props = defineProps<ColorInputGroupSuffixProps>();

const { slots } = useColorInputGroupContext();

const styles = computed(() => slots.value.suffix({ class: props.class }));
</script>

<template>
  <div :class="styles" data-slot="color-input-group-suffix">
    <slot />
  </div>
</template>
