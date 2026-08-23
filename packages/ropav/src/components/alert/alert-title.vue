<script setup lang="ts" vapor>
import type {AlertTitleProps} from "./alert.types";

import {composeSlotClassName} from "../../utils/compose";

import {useAlertContext} from "./alert.context";

const props = defineProps<AlertTitleProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useAlertContext();
</script>

<template>
  <p :class="composeSlotClassName(slots.title, props.class)" data-slot="alert-title">
    <slot />
  </p>
</template>
