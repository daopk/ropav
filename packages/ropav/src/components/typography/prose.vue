<script setup lang="ts" vapor>
import type {ProseProps} from "./typography.types";

import {typographyVariants} from "@ropav/styles";
import {computed} from "vue";

const props = defineProps<ProseProps>();

defineSlots<{default?: () => unknown}>();

const styles = computed(() => typographyVariants().prose({class: props.class}));
</script>

<template>
  <div v-bind="{slot: props.slot}" :class="styles" data-slot="prose">
    <slot />
  </div>
</template>
