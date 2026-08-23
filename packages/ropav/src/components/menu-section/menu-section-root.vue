<script setup lang="ts" vapor>
import type {CollectionSelection} from "../../composables/use-selection-manager";
import type {MenuSectionRootProps} from "./menu-section.types";

import {menuSectionVariants} from "@ropav/styles";
import {computed} from "vue";

import {provideFieldIdsContext, useFieldIds} from "../../composables/use-field-ids";
import {useSelectionManager} from "../../composables/use-selection-manager";
import {provideMenuSectionContext, useMenuContext} from "../menu/menu.context";

// `disallowEmptySelection` declares an explicit `undefined` default so an absent prop stays
// absent rather than reading as an explicit `false`.
const props = withDefaults(defineProps<MenuSectionRootProps>(), {
  disallowEmptySelection: undefined,
  shouldCloseOnSelect: undefined,
});

const emit = defineEmits<{
  selectionChange: [keys: CollectionSelection];
  "update:selectedKeys": [keys: CollectionSelection];
}>();

defineSlots<{default?: () => unknown}>();

const menu = useMenuContext();

const styles = computed(() => menuSectionVariants({class: props.class}));

/**
 * A selection of the section's own, sharing the menu's focus.
 *
 * Built unconditionally, because a composable cannot be created conditionally, and handed on only
 * when the section actually declared a mode — a section without one is presentational, and its
 * items must keep selecting through the menu so they stay part of the same choice.
 */
const scopedSelection = useSelectionManager({
  collection: menu.collection,
  defaultSelectedKeys: props.defaultSelectedKeys,
  disabledKeys: () => menu.selection.disabledKeys.value,
  disallowEmptySelection: () => props.disallowEmptySelection,
  focusSource: menu.selection,
  onSelectionChange: (keys) => {
    emit("selectionChange", keys);
    emit("update:selectedKeys", keys);
  },
  selectedKeys: () => props.selectedKeys,
  selectionBehavior: () => props.selectionBehavior,
  selectionMode: () => props.selectionMode,
});

provideMenuSectionContext({
  selection: computed(() => (props.selectionMode == null ? menu.selection : scopedSelection)),
  shouldCloseOnSelect: computed(() => props.shouldCloseOnSelect ?? menu.shouldCloseOnSelect.value),
});

// ARIA does not allow a heading inside a menu, so the section's `Header` is demoted to
// presentation and reused only as the visual label this group points at.
const fieldIds = useFieldIds({headingRole: "presentation", slots: ["heading"]});

provideFieldIdsContext(fieldIds.context);
</script>

<template>
  <section
    :aria-label="props.ariaLabel"
    :aria-labelledby="fieldIds.headingId.value"
    :class="styles"
    role="group"
  >
    <slot />
  </section>
</template>
