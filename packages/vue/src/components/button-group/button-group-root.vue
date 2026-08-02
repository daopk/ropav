<script setup lang="ts" vapor>
import type {ButtonGroupRootProps} from "./button-group.types";

import {buttonGroupVariants} from "@heroui/styles";
import {computed} from "vue";

import {dataAttr} from "../../utils/assertion";

import {provideButtonGroupContext} from "./button-group.context";

const props = withDefaults(defineProps<ButtonGroupRootProps>(), {orientation: "horizontal"});

defineSlots<{default?: () => unknown}>();

const slots = computed(() =>
  buttonGroupVariants({
    fullWidth: props.fullWidth,
    orientation: props.orientation,
  }),
);

provideButtonGroupContext({
  fullWidth: computed(() => props.fullWidth),
  isDisabled: computed(() => props.isDisabled),
  size: computed(() => props.size),
  slots,
  variant: computed(() => props.variant),
});
</script>

<template>
  <div
    :class="slots.base({class: props.class})"
    :data-disabled="dataAttr(props.isDisabled)"
    data-slot="button-group"
    role="group"
  >
    <slot />
  </div>
</template>
