<script setup lang="ts" vapor>
import type {ButtonGroupRootProps} from "./button-group.types";

import {buttonGroupVariants} from "@heroui/styles";
import {computed} from "vue";

import {dataAttr} from "../../utils/assertion";
import {useToolbarContext} from "../toolbar/toolbar.context";

import {provideButtonGroupContext} from "./button-group.context";

// `orientation` declares an explicit `undefined` default so an absent prop stays absent and
// can fall through to the toolbar's axis. Vue would otherwise read "no prop" as an explicit
// `"horizontal"`, and a group inside a vertical toolbar could never inherit it.
const props = withDefaults(defineProps<ButtonGroupRootProps>(), {
  // `isDisabled` declares an explicit `undefined` default so an absent prop stays absent: a
  // cast `false` would read as the group claiming its buttons are enabled, and a button could
  // never fall through to a disabled fieldset above.
  isDisabled: undefined,
  orientation: undefined,
});

defineSlots<{default?: () => unknown}>();

const toolbarContext = useToolbarContext();

const resolvedOrientation = computed(
  () => props.orientation ?? toolbarContext?.orientation.value ?? "horizontal",
);

const slots = computed(() =>
  buttonGroupVariants({
    fullWidth: props.fullWidth,
    orientation: resolvedOrientation.value,
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
