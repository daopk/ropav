<script setup lang="ts" vapor>
import type {ColorInputGroupPrefixProps} from "./color-input-group.types";

import {computed} from "vue";

import {useColorInputGroupContext} from "./color-input-group.context";

const props = defineProps<ColorInputGroupPrefixProps>();

const {slots} = useColorInputGroupContext();

const styles = computed(() => slots.value.prefix({class: props.class}));
</script>

<template>
  <div :class="styles" data-slot="color-input-group-prefix">
    <slot />
  </div>
</template>
