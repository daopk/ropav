<script setup lang="ts" vapor>
import type {FixtureItem} from "./fixtures.types";

import {DescriptionRoot} from "@/components/description";
import {LabelRoot} from "@/components/label";
import {ListBoxRoot} from "@/components/list-box";
import {ListBoxItemIndicator, ListBoxItemRoot} from "@/components/list-box-item";
import {VirtualizerRoot} from "@/components/virtualizer";
import {ListLayout} from "@/utils/virtualizer-list-layout";

const props = withDefaults(
  defineProps<{
    items?: FixtureItem[];
    rowHeight?: number;
    selectionMode?: "none" | "single" | "multiple";
    withoutVirtualizer?: boolean;
  }>(),
  {
    items: (): FixtureItem[] => [],
    rowHeight: 50,
    selectionMode: "none",
    withoutVirtualizer: undefined,
  },
);
</script>

<template>
  <VirtualizerRoot
    v-if="!props.withoutVirtualizer"
    :layout="ListLayout"
    :layout-options="{rowHeight: props.rowHeight}"
  >
    <ListBoxRoot
      aria-label="Users"
      class="h-[400px] w-[300px] overflow-y-auto"
      :item-text-value="(item) => (item as FixtureItem).name"
      :items="props.items"
      :selection-mode="props.selectionMode"
    >
      <template #default="{item}">
        <ListBoxItemRoot :id="(item as FixtureItem).id">
          <div class="flex flex-col">
            <LabelRoot>{{ (item as FixtureItem).name }}</LabelRoot>
            <DescriptionRoot>{{ (item as FixtureItem).email }}</DescriptionRoot>
          </div>
          <ListBoxItemIndicator />
        </ListBoxItemRoot>
      </template>
    </ListBoxRoot>
  </VirtualizerRoot>

  <ListBoxRoot v-else aria-label="Users" :selection-mode="props.selectionMode">
    <ListBoxItemRoot v-for="item in props.items" :id="item.id" :key="item.id">
      <LabelRoot>{{ item.name }}</LabelRoot>
    </ListBoxItemRoot>
  </ListBoxRoot>
</template>
