<script setup lang="ts" vapor>
import type {TabsRootProps, TabsRootSlotProps} from "./tabs.types";
import type {CollectionKey} from "../../composables/use-collection";

import {tabsVariants} from "@heroui/styles";
import {computed, shallowRef} from "vue";

import {useFocusWithin} from "../../composables/use-interaction-states";
import {useListKeyboard} from "../../composables/use-list-keyboard";
import {
  createSharedElementScope,
  provideSharedElementScope,
} from "../../composables/use-shared-element";
import {useTabListState} from "../../composables/use-tab-list-state";
import {dataAttr} from "../../utils/assertion";

import {provideTabsContext} from "./tabs.context";

// The three-state props declare an explicit `undefined` default, so an absent prop stays absent
// rather than being cast to `false` and read as a caller's decision.
const props = withDefaults(defineProps<TabsRootProps>(), {
  isDisabled: undefined,
  keyboardActivation: undefined,
  orientation: undefined,
  variant: undefined,
});

const emit = defineEmits<{
  selectionChange: [key: CollectionKey];
  "update:selectedKey": [key: CollectionKey];
}>();

defineSlots<{default?: (props: TabsRootSlotProps) => unknown}>();

const orientation = computed(() => props.orientation ?? "horizontal");
const keyboardActivation = computed(() => props.keyboardActivation ?? "automatic");
const isDisabled = computed(() => Boolean(props.isDisabled));

const slots = computed(() => tabsVariants({variant: props.variant}));

const state = useTabListState({
  defaultSelectedKey: props.defaultSelectedKey,
  disabledKeys: () => props.disabledKeys,
  id: () => props.id,
  isDisabled: () => props.isDisabled,
  onSelectionChange: (key) => {
    props.onSelectionChange?.(key);
    emit("selectionChange", key);
    emit("update:selectedKey", key);
  },
  selectedKey: () => props.selectedKey,
});

const listElement = shallowRef<HTMLElement | null>(null);

const keyboard = useListKeyboard({
  collection: state.collection,
  // Enter and Space belong to the tab's own press, which is where React Aria puts them too.
  disallowActivation: true,
  element: listElement,
  /*
   * React Aria's tab list stops short of clearing the selection on Escape, because a tab list
   * never has an empty selection to clear — and claiming the key would swallow the Escape that
   * should close whatever the tab list sits inside.
   */
  escapeKeyBehavior: "none",
  layout: "stack",
  orientation: () => orientation.value,
  selectOnFocus: () => keyboardActivation.value !== "manual",
  // The tab list's own delegate wraps at both ends rather than stopping.
  shouldFocusWrap: true,
  selection: state.selection,
});

const focus = useFocusWithin({isDisabled: () => isDisabled.value});

/*
 * One scope per tab list, which is the same thing as one per root: the indicator is handed from
 * the tab losing the selection to the tab gaining it, and a root is exactly what holds one
 * selection.
 */
provideSharedElementScope(createSharedElementScope());

provideTabsContext({
  isDisabled,
  keyboard,
  keyboardActivation,
  listElement,
  orientation,
  slots,
  state,
});
</script>

<template>
  <div
    :class="slots.base({class: props.class})"
    :data-disabled="dataAttr(isDisabled)"
    :data-focus-visible="dataAttr(focus.isFocusVisible.value)"
    :data-focused="dataAttr(focus.isFocusWithin.value)"
    :data-orientation="orientation"
    data-slot="tabs"
    @focusin="focus.onFocusin"
    @focusout="focus.onFocusout"
  >
    <slot
      :is-focus-visible="focus.isFocusVisible.value"
      :is-focus-within="focus.isFocusWithin.value"
      :orientation="orientation"
    />
  </div>
</template>
