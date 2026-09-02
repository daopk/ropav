<script setup lang="ts" vapor>
import type { FixtureItem } from "./fixtures.types";

import { computed } from "vue";

import { DescriptionRoot } from "@/components/description";
import { LabelRoot } from "@/components/label";
import { ListBoxRoot } from "@/components/list-box";
import { ListBoxItemIndicator, ListBoxItemRoot } from "@/components/list-box-item";
import { VirtualizerRoot } from "@/components/virtualizer";
import { ListLayout } from "@/utils/virtualizer-list-layout";

const props = withDefaults(
  defineProps<{
    estimatedRowSize?: number;
    items?: FixtureItem[];
    rowSize?: number;
    selectionMode?: "none" | "single" | "multiple";
    withoutVirtualizer?: boolean;
  }>(),
  {
    estimatedRowSize: undefined,
    items: (): FixtureItem[] => [],
    rowSize: 50,
    selectionMode: "none",
    withoutVirtualizer: undefined,
  },
);

/** An estimate wins over a fixed size, so one fixture covers both kinds of row. */
const layoutOptions = computed(() =>
  props.estimatedRowSize == null
    ? { rowSize: props.rowSize }
    : { estimatedRowSize: props.estimatedRowSize },
);
</script>

<template>
  <VirtualizerRoot
    v-if="!props.withoutVirtualizer"
    :layout="ListLayout"
    :layout-options="layoutOptions"
  >
    <ListBoxRoot
      aria-label="Users"
      class="h-[400px] w-[300px] overflow-y-auto"
      :item-text-value="(item) => item.name"
      :items="props.items"
      :selection-mode="props.selectionMode"
    >
      <template #default="{ item }">
        <ListBoxItemRoot :id="item!.id">
          <div class="flex flex-col">
            <LabelRoot>{{ item!.name }}</LabelRoot>
            <DescriptionRoot>{{ item!.email }}</DescriptionRoot>
            <DescriptionRoot v-for="line in item!.lines ?? 0" :key="line">
              Line {{ line }}
            </DescriptionRoot>
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
