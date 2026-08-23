<script setup lang="ts" vapor>
import type {InputGroupSuffixProps} from "./input-group.types";

import {computed} from "vue";

import {useInputGroupContext} from "./input-group.context";

const props = defineProps<InputGroupSuffixProps>();

const {slots} = useInputGroupContext();

const styles = computed(() => slots.value.suffix({class: props.class}));
</script>

<template>
  <div :class="styles" data-slot="input-group-suffix">
    <slot />
  </div>
</template>
