<script setup lang="ts" vapor>
import type {InputGroupPrefixProps} from "./input-group.types";

import {computed} from "vue";

import {useInputGroupContext} from "./input-group.context";

const props = defineProps<InputGroupPrefixProps>();

const {slots} = useInputGroupContext();

const styles = computed(() => slots.value.prefix({class: props.class}));
</script>

<template>
  <div :class="styles" data-slot="input-group-prefix">
    <slot />
  </div>
</template>
