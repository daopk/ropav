<script setup lang="ts" vapor>
import type { ToggleGroupKey } from "../../composables/use-toggle-group-state";
import type { ToggleButtonGroupRootProps } from "./toggle-button-group.types";

import { toggleButtonGroupVariants } from "@ropav/styles";
import { computed, shallowRef } from "vue";

import { useToggleGroupState } from "../../composables/use-toggle-group-state";
import { useToolbar } from "../../composables/use-toolbar";
import { dataAttr } from "../../utils/assertion";
import { useFieldsetContext } from "../fieldset/fieldset.context";
import { useToolbarContext } from "../toolbar/toolbar.context";

import { provideToggleButtonGroupContext } from "./toggle-button-group.context";

// `orientation` declares an explicit `undefined` default so an absent prop stays absent and
// can fall through to the toolbar's axis. Vue would otherwise read "no prop" as an explicit
// `"horizontal"`, and a group inside a vertical toolbar could never inherit it.
const props = withDefaults(defineProps<ToggleButtonGroupRootProps>(), {
  isDetached: false,
  isDisabled: undefined,
  orientation: undefined,
  selectionMode: "single",
});

const emit = defineEmits<{ selectionChange: [keys: Set<ToggleGroupKey>] }>();

defineSlots<{ default?: () => unknown }>();

const element = shallowRef<HTMLElement | null>(null);

const toolbarContext = useToolbarContext();
const fieldset = useFieldsetContext();

const resolvedOrientation = computed(
  () => props.orientation ?? toolbarContext?.orientation.value ?? "horizontal",
);

const resolvedIsDisabled = computed(() => props.isDisabled ?? fieldset?.isDisabled.value);

const slots = computed(() =>
  toggleButtonGroupVariants({
    fullWidth: props.fullWidth,
    isDetached: props.isDetached,
    orientation: resolvedOrientation.value,
  }),
);

const state = useToggleGroupState({
  defaultSelectedKeys: props.defaultSelectedKeys,
  disallowEmptySelection: () => props.disallowEmptySelection,
  isDisabled: () => resolvedIsDisabled.value,
  onSelectionChange: (keys) => emit("selectionChange", keys),
  selectedKeys: () => props.selectedKeys,
  selectionMode: () => props.selectionMode,
});

const toolbar = useToolbar({ element, orientation: resolvedOrientation });

/**
 * Single selection makes the group a set of mutually exclusive choices rather than a row
 * of independent switches, which is a radio group to assistive technology. React Aria
 * swaps the role for exactly this reason, and the buttons follow suit with
 * `role="radio"` + `aria-checked` instead of `aria-pressed`.
 */
const role = computed(() =>
  state.selectionMode.value === "single" ? "radiogroup" : toolbar.role.value,
);

// A nested group reports `role="group"`, which has no orientation to report - the attribute is
// invalid there even though the layout still has a direction.
const ariaOrientation = computed(() =>
  role.value === "group" ? undefined : resolvedOrientation.value,
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
    :aria-disabled="resolvedIsDisabled || undefined"
    :aria-orientation="ariaOrientation"
    :class="slots.base({ class: props.class })"
    :data-disabled="dataAttr(resolvedIsDisabled)"
    :data-orientation="resolvedOrientation"
    data-slot="toggle-button-group"
    :role="role"
    @focusin="toolbar.onFocusin"
    @focusout="toolbar.onFocusout"
    @keydown.capture="toolbar.onKeydown"
  >
    <slot />
  </div>
</template>
