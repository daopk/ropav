<script setup lang="ts" vapor>
import type { MenuFixtureItem, MenuFixtureProps } from "./fixtures.types";
import type { CollectionKey } from "@/composables/use-collection";
import type { CollectionSelection } from "@/composables/use-selection-manager";

import { EmptyStateRoot } from "@/components/empty-state";
import { HeaderRoot } from "@/components/header";
import { MenuRoot } from "@/components/menu";
import { MenuItemRoot } from "@/components/menu-item";
import { MenuSectionRoot } from "@/components/menu-section";
import { SeparatorRoot } from "@/components/separator";

const props = withDefaults(defineProps<MenuFixtureProps>(), {
  defaultSelectedKeys: undefined,
  disabledKeys: undefined,
  disallowEmptySelection: undefined,
  selectedKeys: undefined,
  selectionMode: undefined,
  shouldCloseOnSelect: undefined,
  withEmptyState: undefined,
  items: (): MenuFixtureItem[] => [
    { id: "cut", label: "Cut" },
    { id: "copy", label: "Copy" },
    { id: "paste", label: "Paste" },
  ],
});

defineEmits<{
  action: [key: CollectionKey];
  close: [];
  selectionChange: [keys: CollectionSelection];
}>();
</script>

<template>
  <HeaderRoot v-if="props.withExternalLabel" id="menu-external-label">Edit</HeaderRoot>
  <MenuRoot
    :aria-label="props.ariaLabel"
    :aria-labelledby="props.ariaLabelledby"
    :auto-focus="props.autoFocus"
    :class="props.class"
    :default-selected-keys="props.defaultSelectedKeys"
    :disabled-keys="props.disabledKeys"
    :disallow-empty-selection="props.disallowEmptySelection"
    :id="props.id"
    :selected-keys="props.selectedKeys"
    :selection-mode="props.selectionMode"
    :should-close-on-select="props.shouldCloseOnSelect"
    @action="$emit('action', $event)"
    @close="$emit('close')"
    @selection-change="$emit('selectionChange', $event)"
  >
    <template v-if="props.withEmptyState" #empty>
      <EmptyStateRoot>Nothing here</EmptyStateRoot>
    </template>
    <MenuSectionRoot v-if="props.withSection" aria-label="Clipboard">
      <MenuItemRoot
        v-for="item of props.items"
        :key="item.id"
        :id="item.id"
        :is-disabled="item.isDisabled"
        :text-value="item.textValue"
      >
        {{ item.label }}
      </MenuItemRoot>
    </MenuSectionRoot>
    <template v-else>
      <template v-for="(item, index) of props.items" :key="item.id">
        <SeparatorRoot v-if="props.withSeparator && index > 0" />
        <MenuItemRoot :id="item.id" :is-disabled="item.isDisabled" :text-value="item.textValue">
          {{ item.label }}
        </MenuItemRoot>
      </template>
    </template>
  </MenuRoot>
</template>
