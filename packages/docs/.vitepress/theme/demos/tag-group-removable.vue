<script setup lang="ts">
import { Description, EmptyState, Label, Tag, TagGroup, TagGroupList } from "ropav";
import { shallowRef } from "vue";

const tags = shallowRef([
  { id: "news", name: "News" },
  { id: "travel", name: "Travel" },
  { id: "gaming", name: "Gaming" },
  { id: "shopping", name: "Shopping" },
]);

const onRemove = (keys: Set<string | number>) => {
  tags.value = tags.value.filter((tag) => !keys.has(tag.id));
};
</script>

<template>
  <TagGroup class="w-full max-w-sm" :on-remove="onRemove" selection-mode="multiple">
    <Label>Categories</Label>
    <TagGroupList>
      <Tag v-for="tag in tags" :id="tag.id" :key="tag.id" :text-value="tag.name">
        {{ tag.name }}
      </Tag>
      <template #empty>
        <EmptyState class="p-1">Every category removed</EmptyState>
      </template>
    </TagGroupList>
    <Description>Backspace removes the focused tag.</Description>
  </TagGroup>
</template>
