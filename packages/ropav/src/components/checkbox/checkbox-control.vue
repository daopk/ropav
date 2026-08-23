<script setup lang="ts" vapor>
import type {CheckboxControlProps} from "./checkbox.types";

import {composeSlotClassName} from "../../utils/compose";

import {useCheckboxContext} from "./checkbox.context";

const props = defineProps<CheckboxControlProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useCheckboxContext();
</script>

<template>
  <span :class="composeSlotClassName(slots.control, props.class)" data-slot="checkbox-control">
    <slot />
  </span>
</template>
