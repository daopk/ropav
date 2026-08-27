<script setup lang="ts" vapor>
import type { CollectionKey } from "../../composables/use-collection";
import type { CollectionSelection } from "../../composables/use-selection-manager";
import type { MenuRootProps } from "./menu.types";

import { menuVariants } from "@ropav/styles";
import { computed } from "vue";

import { useMenu } from "../../composables/use-menu";
import { provideSeparatorContext } from "../separator/separator.context";

// `disallowEmptySelection` and `shouldCloseOnSelect` declare an explicit `undefined` default so an
// absent prop stays absent rather than reading as an explicit `false`.
const props = withDefaults(defineProps<MenuRootProps>(), {
  disallowEmptySelection: undefined,
  shouldCloseOnSelect: undefined,
});

const emit = defineEmits<{
  action: [key: CollectionKey];
  close: [];
  selectionChange: [keys: CollectionSelection];
  "update:selectedKeys": [keys: CollectionSelection];
}>();

const callerSlots = defineSlots<{
  default?: () => unknown;
  /** Shown instead of nothing when there is not a single item to show. */
  empty?: () => unknown;
}>();

const styles = computed(() => menuVariants({ class: props.class }));

// A menu lays its own children out, so a rule between two of them has to take part in that
// layout rather than being the block-level `hr` it would be on its own.
provideSeparatorContext({ elementType: "div" });

const menu = useMenu({
  autoFocus: () => props.autoFocus,
  defaultSelectedKeys: props.defaultSelectedKeys,
  disabledBehavior: () => props.disabledBehavior,
  disabledKeys: () => props.disabledKeys,
  disallowEmptySelection: () => props.disallowEmptySelection,
  id: () => props.id,
  label: () => props.ariaLabel,
  labelledBy: () => props.ariaLabelledby,
  onAction: (key) => emit("action", key),
  onClose: () => emit("close"),
  onSelectionChange: (keys) => {
    emit("selectionChange", keys);
    emit("update:selectedKeys", keys);
  },
  selectedKeys: () => props.selectedKeys,
  selectionBehavior: () => props.selectionBehavior,
  selectionMode: () => props.selectionMode,
  shouldCloseOnSelect: () => props.shouldCloseOnSelect,
});

// A named callback rather than a string `ref`, which `vue-tsc` does not count as a read of the
// binding it names.
const setElement = (element: unknown) => {
  menu.element.value = (element as HTMLElement | null) ?? null;
};

/*
 * Read off whether the slot was handed over, never by running it, and rendered *beside* the items
 * rather than instead of them: the collection is learnt from what rendered, so swapping the items
 * out for the empty state would leave the menu empty for good.
 */
const hasEmptySlot = computed(() => Boolean(callerSlots["empty"]));
</script>

<template>
  <div
    :ref="setElement"
    :class="styles"
    data-slot="menu"
    v-bind="menu.menuAttributes.value"
    @focusin="menu.onFocusin"
    @focusout="menu.onFocusout"
    @keydown="menu.onKeydown"
    @keydown.capture="menu.onKeydownCapture"
  >
    <div v-if="hasEmptySlot && menu.isEmpty.value" v-bind="menu.emptyAttributes.value">
      <slot name="empty" />
    </div>
    <slot />
  </div>
</template>
