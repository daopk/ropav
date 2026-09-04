<script setup lang="ts" vapor>
import type { FixtureItem } from "./fixtures.types";

import { computed } from "vue";

import { Description } from "@/components/description";
import { Label } from "@/components/label";
import { ListBox } from "@/components/list-box";
import { ListBoxItemIndicator, ListBoxItem } from "@/components/list-box-item";
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
    <ListBox
      aria-label="Users"
      class="h-[400px] w-[300px] overflow-y-auto"
      :item-text-value="(item) => item.name"
      :items="props.items"
      :selection-mode="props.selectionMode"
    >
      <template #default="{ item }">
        <ListBoxItem :id="item!.id">
          <div class="flex flex-col">
            <Label>{{ item!.name }}</Label>
            <Description>{{ item!.email }}</Description>
            <Description v-for="line in item!.lines ?? 0" :key="line">
              Line {{ line }}
            </Description>
          </div>
          <ListBoxItemIndicator />
        </ListBoxItem>
      </template>
    </ListBox>
  </VirtualizerRoot>

  <ListBox v-else aria-label="Users" :selection-mode="props.selectionMode">
    <ListBoxItem v-for="item in props.items" :id="item.id" :key="item.id">
      <Label>{{ item.name }}</Label>
    </ListBoxItem>
  </ListBox>
</template>
