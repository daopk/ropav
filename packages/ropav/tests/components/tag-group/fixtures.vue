<script setup lang="ts" vapor>
import type { TagGroupProps } from "@/components/tag-group";
import type { CollectionKey } from "@/composables/use-collection";
import type { CollectionSelection } from "@/composables/use-selection-manager";

import { Description } from "@/components/description";
import { EmptyState } from "@/components/empty-state";
import { Label } from "@/components/label";
import { TagRemoveButton, Tag } from "@/components/tag";
import { TagGroupList, TagGroup } from "@/components/tag-group";

/**
 * Booleans stay `default: undefined` so an absent prop reads as absent rather than as an explicit
 * `false`, which is what lets the group fall back to its own defaults. The tag list is written
 * inline in `withDefaults` because it is hoisted out of `setup()`.
 */
const props = withDefaults(
  defineProps<
    TagGroupProps & {
      customRemoveButton?: boolean;
      disabledTags?: CollectionKey[];
      tags?: string[];
      withLabel?: boolean;
    }
  >(),
  {
    customRemoveButton: undefined,
    disabledTags: () => [],
    disallowEmptySelection: undefined,
    tags: () => ["News", "Travel", "Gaming"],
    withLabel: undefined,
  },
);

const emit = defineEmits<{
  selectionChange: [keys: CollectionSelection];
}>();
</script>

<template>
  <TagGroup
    :class="props.class"
    :default-selected-keys="props.defaultSelectedKeys"
    :disabled-behavior="props.disabledBehavior"
    :disabled-keys="props.disabledKeys"
    :disallow-empty-selection="props.disallowEmptySelection"
    :on-remove="props.onRemove"
    :selected-keys="props.selectedKeys"
    :selection-behavior="props.selectionBehavior"
    :selection-mode="props.selectionMode"
    :size="props.size"
    :variant="props.variant"
    @selection-change="emit('selectionChange', $event)"
  >
    <Label v-if="props.withLabel">Categories</Label>
    <TagGroupList aria-label="Tags">
      <Tag
        v-for="name of props.tags"
        :id="name"
        :key="name"
        :is-disabled="props.disabledTags?.includes(name)"
      >
        {{ name }}
        <template v-if="props.customRemoveButton" #remove>
          <TagRemoveButton data-testid="custom-remove" />
        </template>
      </Tag>
      <template #empty>
        <EmptyState>No categories found</EmptyState>
      </template>
    </TagGroupList>
    <Description>Pick a category</Description>
  </TagGroup>
</template>
