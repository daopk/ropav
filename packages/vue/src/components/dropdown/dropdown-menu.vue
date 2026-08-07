<script setup lang="ts" vapor>
import type {DropdownMenuProps} from "./dropdown.types";
import type {CollectionKey} from "../../composables/use-collection";
import type {CollectionSelection} from "../../composables/use-selection-manager";

import {computed} from "vue";

import {useMenu} from "../../composables/use-menu";

import {useDropdownContext, useDropdownPopoverTarget} from "./dropdown.context";

// `disallowEmptySelection` and `shouldCloseOnSelect` declare an explicit `undefined` default so an
// absent prop stays absent rather than reading as an explicit `false`.
const props = withDefaults(defineProps<DropdownMenuProps>(), {
  disallowEmptySelection: undefined,
  shouldCloseOnSelect: undefined,
});

const emit = defineEmits<{
  action: [key: CollectionKey];
  selectionChange: [keys: CollectionSelection];
  "update:selectedKeys": [keys: CollectionSelection];
}>();

defineSlots<{default?: () => unknown}>();

const {slots} = useDropdownContext();
const target = useDropdownPopoverTarget();

const styles = computed(() => slots.value.menu({class: props.class}));

const menu = useMenu({
  autoFocus: target.autoFocus,
  defaultSelectedKeys: props.defaultSelectedKeys,
  disabledBehavior: () => props.disabledBehavior,
  disabledKeys: () => props.disabledKeys,
  disallowEmptySelection: () => props.disallowEmptySelection,
  // The trigger owns both ids: it points `aria-controls` at the menu and names it.
  id: target.overlayId,
  labelledBy: target.labelledBy,
  onAction: (key) => emit("action", key),
  // Choosing an item dismisses the whole tree, not only the menu the item was in.
  onClose: target.closeAll,
  onSelectionChange: (keys) => {
    emit("selectionChange", keys);
    emit("update:selectedKeys", keys);
  },
  selectedKeys: () => props.selectedKeys,
  selectionBehavior: () => props.selectionBehavior,
  selectionMode: () => props.selectionMode,
  shouldCloseOnSelect: () => props.shouldCloseOnSelect,
});

const setElement = (element: unknown) => {
  menu.element.value = (element as HTMLElement | null) ?? null;
};
</script>

<template>
  <div
    :ref="setElement"
    :class="styles"
    :data-selection-mode="props.selectionMode"
    data-slot="dropdown-menu"
    v-bind="menu.menuAttributes.value"
    @focusin="menu.onFocusin"
    @focusout="menu.onFocusout"
    @keydown="menu.onKeydown"
    @keydown.capture="menu.onKeydownCapture"
  >
    <slot />
  </div>
</template>
