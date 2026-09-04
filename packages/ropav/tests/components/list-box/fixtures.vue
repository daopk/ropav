<script setup lang="ts" vapor>
import type { FixtureItem } from "./fixtures.types";
import type { ListBoxProps } from "@/components/list-box";
import type { CollectionSelection } from "@/composables/use-selection-manager";

import { Description } from "@/components/description";
import { EmptyState } from "@/components/empty-state";
import { Header } from "@/components/header";
import { Label } from "@/components/label";
import { ListBox } from "@/components/list-box";
import { ListBoxItemIndicator, ListBoxItem } from "@/components/list-box-item";
import { ListBoxSection } from "@/components/list-box-section";

/**
 * Booleans stay `default: undefined` so an absent prop reads as absent rather than as an
 * explicit `false`, which is what lets the listbox fall back to its own defaults.
 *
 * The default list is written inline because `withDefaults` is hoisted out of `setup()` and so
 * cannot reference anything declared here.
 */
const props = withDefaults(
  defineProps<
    ListBoxProps & {
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
      { email: "bob@ropav.com", id: "1", name: "Bob" },
      { email: "fred@ropav.com", id: "2", name: "Fred" },
      { email: "martha@ropav.com", id: "3", name: "Martha" },
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
  <ListBox
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
      <EmptyState>Nothing here</EmptyState>
    </template>
    <ListBoxSection v-if="props.withSections">
      <Header>People</Header>
      <ListBoxItem
        v-for="item of props.items"
        :id="item.id"
        :key="item.id"
        :is-disabled="item.isDisabled"
      >
        <Label>{{ item.name }}</Label>
        <Description v-if="item.email">{{ item.email }}</Description>
        <ListBoxItemIndicator v-if="props.withIndicator" />
      </ListBoxItem>
    </ListBoxSection>
    <template v-else>
      <ListBoxItem
        v-for="item of props.items"
        :id="item.id"
        :key="item.id"
        :is-disabled="item.isDisabled"
      >
        <Label>{{ item.name }}</Label>
        <Description v-if="item.email">{{ item.email }}</Description>
        <ListBoxItemIndicator v-if="props.withIndicator" />
      </ListBoxItem>
    </template>
  </ListBox>
</template>
