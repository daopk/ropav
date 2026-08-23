<script setup lang="ts" vapor>
import type {FieldsetActionsProps} from "./fieldset.types";

import {computed} from "vue";

import {useFieldsetContext} from "./fieldset.context";

const props = defineProps<FieldsetActionsProps>();

const fieldset = useFieldsetContext();

const styles = computed(() => fieldset?.slots.value.actions({class: props.class}) ?? props.class);
</script>

<template>
  <div :class="styles" data-slot="fieldset-actions">
    <slot />
  </div>
</template>
