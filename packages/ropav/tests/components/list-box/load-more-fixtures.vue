<script setup lang="ts" vapor>
import type { FixtureItem } from "./fixtures.types";

import { ListBoxLoadMoreItem, ListBoxRoot } from "@/components/list-box";
import { ListBoxItemRoot } from "@/components/list-box-item";

const props = withDefaults(
  defineProps<{
    items?: FixtureItem[];
    isLoading?: boolean;
    scrollOffset?: number;
    /** A fixed height with overflow, so the browser has an edge the sentinel can reach. */
    withScrollBox?: boolean;
  }>(),
  {
    isLoading: undefined,
    items: (): FixtureItem[] => [
      { id: "1", name: "Bob" },
      { id: "2", name: "Fred" },
      { id: "3", name: "Martha" },
    ],
    scrollOffset: undefined,
    withScrollBox: undefined,
  },
);

const emit = defineEmits<{ loadMore: [] }>();

const boxStyle = { height: "60px", overflow: "auto" } as const;
</script>

<template>
  <div :style="props.withScrollBox ? boxStyle : undefined">
    <ListBoxRoot aria-label="Users" selection-mode="single">
      <ListBoxItemRoot
        v-for="item in props.items"
        :id="item.id"
        :key="item.id"
        :text-value="item.name"
      >
        {{ item.name }}
      </ListBoxItemRoot>
      <ListBoxLoadMoreItem
        :is-loading="props.isLoading"
        :scroll-offset="props.scrollOffset"
        @load-more="emit('loadMore')"
      >
        <span data-testid="loading">Loading more…</span>
      </ListBoxLoadMoreItem>
    </ListBoxRoot>
  </div>
</template>
