<script setup lang="ts" vapor>
import type {FieldGroupProps} from "./fieldset.types";

import {computed} from "vue";

import {useFieldsetContext} from "./fieldset.context";

const props = defineProps<FieldGroupProps>();

const fieldset = useFieldsetContext();

const styles = computed(
  () => fieldset?.slots.value.fieldGroup({class: props.class}) ?? props.class,
);
</script>

<template>
  <div :class="styles" data-slot="fieldset-field-group">
    <slot />
  </div>
</template>
