<script setup lang="ts" vapor>
import type { TabsRootProps } from "@/components/tabs";
import type { CollectionKey } from "@/composables/use-collection";

import {
  TabsIndicator,
  TabsList,
  TabsListContainer,
  TabsPanel,
  TabsRoot,
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
    TabsRootProps & {
      items?: TabsFixtureItem[];
      withContainer?: boolean;
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
    keyboardActivation: undefined,
    orientation: undefined,
    variant: undefined,
    withContainer: true,
    withPanels: true,
    withSeparator: undefined,
  },
);
</script>

<template>
  <TabsRoot
    :id="props.id"
    :class="props.class"
    data-testid="tabs"
    :default-selected-key="props.defaultSelectedKey"
    :disabled-keys="props.disabledKeys"
    :is-disabled="props.isDisabled"
    :keyboard-activation="props.keyboardActivation"
    :on-selection-change="props.onSelectionChange"
    :orientation="props.orientation"
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
          {{ item.label }}
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
  </TabsRoot>
</template>
