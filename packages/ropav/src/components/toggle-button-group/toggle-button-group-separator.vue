<script setup lang="ts" vapor>
import type { ToggleButtonGroupSeparatorProps } from "./toggle-button-group.types";

import { computed } from "vue";

import { composeSlotClassName } from "../../utils/compose";

import { useToggleButtonGroupContext } from "./toggle-button-group.context";

const props = defineProps<ToggleButtonGroupSeparatorProps>();

const context = useToggleButtonGroupContext();

const separatorClass = computed(() =>
  composeSlotClassName(context?.slots.value.separator, props.class),
);
</script>

<template>
  <span aria-hidden="true" :class="separatorClass" data-slot="toggle-button-group-separator" />
</template>
