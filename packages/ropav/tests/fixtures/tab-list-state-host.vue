<script setup lang="ts" vapor>
import type {TabListStateHostProps} from "./tab-list-state.types";

import {computed} from "vue";

import {useTabListState} from "@/composables/use-tab-list-state";

import TabListStateTab from "./tab-list-state-tab.vue";

const props = withDefaults(defineProps<TabListStateHostProps>(), {isDisabled: undefined});

const state = useTabListState({
  defaultSelectedKey: props.defaultSelectedKey,
  disabledKeys: () => props.disabledKeys,
  id: () => props.id,
  isDisabled: () => props.isDisabled,
  onSelectionChange: (key) => props.onSelectionChange?.(key),
  selectedKey: () => props.selectedKey,
});

props.onReady?.(state);

const keys = computed(() => props.keys ?? []);
</script>

<template>
  <div role="tablist">
    <TabListStateTab
      v-for="key in keys"
      :key="key"
      :collection="state.collection"
      :is-disabled="props.disabled?.includes(key)"
      :item-key="key"
    />
  </div>
</template>
