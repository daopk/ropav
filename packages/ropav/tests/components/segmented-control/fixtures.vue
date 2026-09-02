<script setup lang="ts" vapor>
import type { SegmentedControlRootProps } from "@/components/segmented-control";
import type { CollectionKey } from "@/composables/use-collection";

import {
  SegmentedControlIndicator,
  SegmentedControlItem,
  SegmentedControlRoot,
  SegmentedControlSeparator,
} from "@/components/segmented-control";

export interface SegmentedControlFixtureItem {
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
    SegmentedControlRootProps & {
      items?: SegmentedControlFixtureItem[];
      withIndicator?: boolean;
      withSeparator?: boolean;
      /**
       * Listeners for the two events the root emits, kept apart from the `onSelectionChange`
       * callback prop so a test can tell the three reporting paths from one another.
       */
      onSelectionChangeEvent?: (key: CollectionKey) => void;
      onUpdateSelectedKeyEvent?: (key: CollectionKey) => void;
    }
  >(),
  {
    ariaLabel: "Range",
    fullWidth: undefined,
    isDisabled: undefined,
    items: () => [
      { id: "daily", label: "Daily" },
      { id: "weekly", label: "Weekly" },
      { id: "monthly", label: "Monthly" },
    ],
    size: undefined,
    withIndicator: true,
    withSeparator: undefined,
  },
);
</script>

<template>
  <SegmentedControlRoot
    :aria-describedby="props.ariaDescribedby"
    :aria-label="props.ariaLabel"
    :aria-labelledby="props.ariaLabelledby"
    :class="props.class"
    data-testid="segmented-control"
    :default-selected-key="props.defaultSelectedKey"
    :disabled-keys="props.disabledKeys"
    :full-width="props.fullWidth"
    :is-disabled="props.isDisabled"
    :on-selection-change="props.onSelectionChange"
    :selected-key="props.selectedKey"
    :size="props.size"
    @selection-change="props.onSelectionChangeEvent"
    @update:selected-key="props.onUpdateSelectedKeyEvent"
  >
    <SegmentedControlItem
      v-for="item in props.items"
      :id="item.id"
      :key="item.id"
      :is-disabled="item.isDisabled"
    >
      <SegmentedControlSeparator v-if="props.withSeparator" />
      {{ item.label }}
      <SegmentedControlIndicator v-if="props.withIndicator" />
    </SegmentedControlItem>
  </SegmentedControlRoot>
</template>
