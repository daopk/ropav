<script setup lang="ts" vapor>
import type {AlertContentProps} from "./alert.types";

import {composeSlotClassName} from "../../utils/compose";

import {useAlertContext} from "./alert.context";

const props = defineProps<AlertContentProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useAlertContext();
</script>

<template>
  <div :class="composeSlotClassName(slots.content, props.class)" data-slot="alert-content">
    <slot />
  </div>
</template>
