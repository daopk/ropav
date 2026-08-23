<script setup lang="ts" vapor>
import type {AlertDescriptionProps} from "./alert.types";

import {composeSlotClassName} from "../../utils/compose";

import {useAlertContext} from "./alert.context";

const props = defineProps<AlertDescriptionProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useAlertContext();
</script>

<template>
  <span :class="composeSlotClassName(slots.description, props.class)" data-slot="alert-description">
    <slot />
  </span>
</template>
