<script setup lang="ts" vapor>
import type { TabsProps } from "@/components/tabs";
import type { CollectionKey } from "@/composables/use-collection";

import { Chip, ChipLabel } from "@/components/chip";
import {
  TabsIndicator,
  TabsList,
  TabsListContainer,
  TabsPanel,
  Tabs,
  TabsSeparator,
  TabsTab,
} from "@/components/tabs";

export interface TabsFixtureItem {
  id: CollectionKey;
  label: string;
  isDisabled?: boolean;
}

/**
 * Booleans stay `default: undefined` so an absent prop reads as absent rather than as an explicit
 * `false`, which is what the component's own fallbacks depend on. The item list is written inline
 * in `withDefaults` because it is hoisted out of `setup()`.
 */
const props = withDefaults(
  defineProps<
    TabsProps & {
      items?: TabsFixtureItem[];
      withChip?: boolean;
      withContainer?: boolean;
      withIcon?: boolean;
      withSeparator?: boolean;
      withPanels?: boolean;
      forceMountPanels?: boolean;
    }
  >(),
  {
    forceMountPanels: undefined,
    isDisabled: undefined,
    items: () => [
      { id: "overview", label: "Overview" },
      { id: "analytics", label: "Analytics" },
      { id: "reports", label: "Reports" },
    ],
    align: undefined,
    keyboardActivation: undefined,
    orientation: undefined,
    variant: undefined,
    withChip: undefined,
    withContainer: true,
    withIcon: undefined,
    withPanels: true,
    withSeparator: undefined,
  },
);
</script>

<template>
  <Tabs
    :id="props.id"
    :class="props.class"
    data-testid="tabs"
    :default-selected-key="props.defaultSelectedKey"
    :disabled-keys="props.disabledKeys"
    :is-disabled="props.isDisabled"
    :keyboard-activation="props.keyboardActivation"
    :on-selection-change="props.onSelectionChange"
    :orientation="props.orientation"
    :align="props.align"
    :selected-key="props.selectedKey"
    :variant="props.variant"
  >
    <TabsListContainer v-if="props.withContainer">
      <TabsList aria-label="Options">
        <TabsTab
          v-for="item in props.items"
          :id="item.id"
          :key="item.id"
          :is-disabled="item.isDisabled"
        >
          <TabsSeparator v-if="props.withSeparator" />
          <!-- Drawn at `1em`, which is 14px at the tab's font size, so the stylesheet is what has
               to produce 16 and the assertion has something of its own to read. -->
          <svg
            v-if="props.withIcon"
            aria-hidden="true"
            height="1em"
            viewBox="0 0 16 16"
            width="1em"
          >
            <circle cx="8" cy="8" fill="currentColor" r="6" />
          </svg>
          {{ item.label }}
          <Chip v-if="props.withChip" size="sm" variant="soft"><ChipLabel>12</ChipLabel></Chip>
          <TabsIndicator />
        </TabsTab>
      </TabsList>
    </TabsListContainer>

    <TabsList v-else aria-label="Options">
      <TabsTab
        v-for="item in props.items"
        :id="item.id"
        :key="item.id"
        :is-disabled="item.isDisabled"
      >
        {{ item.label }}
        <TabsIndicator />
      </TabsTab>
    </TabsList>

    <template v-if="props.withPanels">
      <TabsPanel
        v-for="item in props.items"
        :id="item.id"
        :key="item.id"
        :should-force-mount="props.forceMountPanels"
      >
        {{ item.label }} panel
      </TabsPanel>
    </template>
  </Tabs>
</template>
