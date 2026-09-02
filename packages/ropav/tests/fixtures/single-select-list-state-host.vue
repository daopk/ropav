<script setup lang="ts" vapor>
import type { SingleSelectListStateHostProps } from "./single-select-list-state.types";

import { computed } from "vue";

import { useSingleSelectListState } from "@/composables/use-single-select-list-state";

import SingleSelectListStateItem from "./single-select-list-state-item.vue";

const props = withDefaults(defineProps<SingleSelectListStateHostProps>(), {
  isDisabled: undefined,
});

const state = useSingleSelectListState({
  defaultSelectedKey: props.defaultSelectedKey,
  disabledKeys: () => props.disabledKeys,
  isDisabled: () => props.isDisabled,
  onSelectionChange: (key) => props.onSelectionChange?.(key),
  selectedKey: () => props.selectedKey,
});

props.onReady?.(state);

const keys = computed(() => props.keys ?? []);
</script>

<template>
  <div>
    <SingleSelectListStateItem
      v-for="key in keys"
      :key="key"
      :collection="state.collection"
      :is-disabled="props.disabled?.includes(key)"
      :item-key="key"
    />
  </div>
</template>
