<script setup lang="ts" vapor>
import type {FixtureItem} from "./fixtures.types";
import type {ListBoxRootProps} from "@/components/list-box";
import type {CollectionSelection} from "@/composables/use-selection-manager";

import {DescriptionRoot} from "@/components/description";
import {EmptyStateRoot} from "@/components/empty-state";
import {HeaderRoot} from "@/components/header";
import {LabelRoot} from "@/components/label";
import {ListBoxRoot} from "@/components/list-box";
import {ListBoxItemIndicator, ListBoxItemRoot} from "@/components/list-box-item";
import {ListBoxSectionRoot} from "@/components/list-box-section";

/**
 * Booleans stay `default: undefined` so an absent prop reads as absent rather than as an
 * explicit `false`, which is what lets the listbox fall back to its own defaults.
 *
 * The default list is written inline because `withDefaults` is hoisted out of `setup()` and so
 * cannot reference anything declared here.
 */
const props = withDefaults(
  defineProps<
    ListBoxRootProps & {
      items?: FixtureItem[];
      withIndicator?: boolean;
      withSections?: boolean;
      /** Whether the caller hands over an empty slot at all. */
      withEmptyState?: boolean;
    }
  >(),
  {
    disallowEmptySelection: undefined,
    items: (): FixtureItem[] => [
      {email: "bob@ropav.com", id: "1", name: "Bob"},
      {email: "fred@ropav.com", id: "2", name: "Fred"},
      {email: "martha@ropav.com", id: "3", name: "Martha"},
    ],
    withEmptyState: undefined,
    withIndicator: undefined,
    withSections: undefined,
  },
);

const emit = defineEmits<{
  action: [key: string | number];
  selectionChange: [keys: CollectionSelection];
}>();
</script>

<template>
  <ListBoxRoot
    aria-label="Users"
    :class="props.class"
    :default-selected-keys="props.defaultSelectedKeys"
    :disabled-behavior="props.disabledBehavior"
    :disabled-keys="props.disabledKeys"
    :disallow-empty-selection="props.disallowEmptySelection"
    :selected-keys="props.selectedKeys"
    :selection-behavior="props.selectionBehavior"
    :selection-mode="props.selectionMode"
    :variant="props.variant"
    @action="emit('action', $event)"
    @selection-change="emit('selectionChange', $event)"
  >
    <template v-if="props.withEmptyState" #empty>
      <EmptyStateRoot>Nothing here</EmptyStateRoot>
    </template>
    <ListBoxSectionRoot v-if="props.withSections">
      <HeaderRoot>People</HeaderRoot>
      <ListBoxItemRoot
        v-for="item of props.items"
        :id="item.id"
        :key="item.id"
        :is-disabled="item.isDisabled"
      >
        <LabelRoot>{{ item.name }}</LabelRoot>
        <DescriptionRoot v-if="item.email">{{ item.email }}</DescriptionRoot>
        <ListBoxItemIndicator v-if="props.withIndicator" />
      </ListBoxItemRoot>
    </ListBoxSectionRoot>
    <template v-else>
      <ListBoxItemRoot
        v-for="item of props.items"
        :id="item.id"
        :key="item.id"
        :is-disabled="item.isDisabled"
      >
        <LabelRoot>{{ item.name }}</LabelRoot>
        <DescriptionRoot v-if="item.email">{{ item.email }}</DescriptionRoot>
        <ListBoxItemIndicator v-if="props.withIndicator" />
      </ListBoxItemRoot>
    </template>
  </ListBoxRoot>
</template>
