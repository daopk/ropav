<script setup lang="ts" vapor>
import type { ButtonGroupSeparatorProps } from "./button-group.types";

import { computed } from "vue";

import { composeSlotClassName } from "../../utils/compose";

import { useButtonGroupContext } from "./button-group.context";

const props = defineProps<ButtonGroupSeparatorProps>();

const context = useButtonGroupContext();

const separatorClass = computed(() =>
  composeSlotClassName(context?.slots.value.separator, props.class),
);
</script>

<template>
  <span aria-hidden="true" :class="separatorClass" data-slot="button-group-separator" />
</template>
