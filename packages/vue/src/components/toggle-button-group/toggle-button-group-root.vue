<script setup lang="ts" vapor>
import type {ToggleButtonGroupRootProps} from "./toggle-button-group.types";
import type {ToggleGroupKey} from "../../composables/use-toggle-group-state";

import {toggleButtonGroupVariants} from "@heroui/styles";
import {computed, shallowRef} from "vue";

import {useToggleGroupState} from "../../composables/use-toggle-group-state";
import {useToolbar} from "../../composables/use-toolbar";
import {dataAttr} from "../../utils/assertion";

import {provideToggleButtonGroupContext} from "./toggle-button-group.context";

const props = withDefaults(defineProps<ToggleButtonGroupRootProps>(), {
  isDetached: false,
  orientation: "horizontal",
  selectionMode: "single",
});

const emit = defineEmits<{selectionChange: [keys: Set<ToggleGroupKey>]}>();

defineSlots<{default?: () => unknown}>();

const element = shallowRef<HTMLElement | null>(null);

const slots = computed(() =>
  toggleButtonGroupVariants({
    fullWidth: props.fullWidth,
    isDetached: props.isDetached,
    orientation: props.orientation,
  }),
);

const state = useToggleGroupState({
  defaultSelectedKeys: props.defaultSelectedKeys,
  disallowEmptySelection: () => props.disallowEmptySelection,
  isDisabled: () => props.isDisabled,
  onSelectionChange: (keys) => emit("selectionChange", keys),
  selectedKeys: () => props.selectedKeys,
  selectionMode: () => props.selectionMode,
});

const toolbar = useToolbar({element, orientation: () => props.orientation});

/**
 * Single selection makes the group a set of mutually exclusive choices rather than a row
 * of independent switches, which is a radio group to assistive technology. React Aria
 * swaps the role for exactly this reason, and the buttons follow suit with
 * `role="radio"` + `aria-checked` instead of `aria-pressed`.
 */
const role = computed(() =>
  state.selectionMode.value === "single" ? "radiogroup" : toolbar.role.value,
);

provideToggleButtonGroupContext({
  size: computed(() => props.size),
  slots,
  state,
});
</script>

<template>
  <div
    ref="element"
    :aria-disabled="props.isDisabled || undefined"
    :aria-orientation="props.orientation"
    :class="slots.base({class: props.class})"
    :data-disabled="dataAttr(props.isDisabled)"
    :data-orientation="props.orientation"
    data-slot="toggle-button-group"
    :role="role"
    @focusin="toolbar.onFocusin"
    @focusout="toolbar.onFocusout"
    @keydown.capture="toolbar.onKeydown"
  >
    <slot />
  </div>
</template>
