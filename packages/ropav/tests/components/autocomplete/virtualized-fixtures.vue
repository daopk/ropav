<script setup lang="ts" vapor>
import { computed, shallowRef } from "vue";

import {
  AutocompleteFilter,
  AutocompleteIndicator,
  AutocompletePopover,
  Autocomplete,
  AutocompleteTrigger,
  AutocompleteValue,
} from "@/components/autocomplete";
import { Label } from "@/components/label";
import { ListBox } from "@/components/list-box";
import { ListBoxItemIndicator, ListBoxItem } from "@/components/list-box-item";
import {
  SearchFieldGroup,
  SearchFieldInput,
  SearchField,
  SearchFieldSearchIcon,
} from "@/components/search-field";
import { VirtualizerRoot } from "@/components/virtualizer";
import { useFilter } from "@/composables/use-filter";
import { ListLayout } from "@/utils/virtualizer-list-layout";

/** A windowed autocomplete, which is the one case the options cannot all be in the DOM. */
const props = withDefaults(defineProps<{ count?: number; rowSize?: number }>(), {
  count: 1000,
  rowSize: 50,
});

const filter = useFilter({ sensitivity: "base" });

const search = shallowRef("");

const allItems = computed(() =>
  Array.from({ length: props.count }, (_unused, index) => ({
    id: index + 1,
    name: `User ${index + 1}`,
  })),
);

const filtered = computed(() => {
  if (!search.value) return allItems.value;

  return allItems.value.filter((item) => filter.value.contains(item.name, search.value));
});

const byName = (item: { name: string }) => item.name;
</script>

<template>
  <Autocomplete
    allows-empty-collection
    class="w-[300px]"
    :item-text-value="byName"
    :items="allItems"
    placeholder="Select a user"
  >
    <Label>User</Label>
    <AutocompleteTrigger>
      <AutocompleteValue />
      <AutocompleteIndicator />
    </AutocompleteTrigger>
    <AutocompletePopover>
      <AutocompleteFilter :input-value="search" :items="filtered" @input-change="search = $event">
        <template #default="{ items }">
          <SearchField aria-label="Search users" auto-focus variant="secondary">
            <SearchFieldGroup>
              <SearchFieldSearchIcon />
              <SearchFieldInput placeholder="Search users..." />
            </SearchFieldGroup>
          </SearchField>
          <VirtualizerRoot :layout="ListLayout" :layout-options="{ rowSize: props.rowSize }">
            <ListBox class="h-[300px] overflow-y-auto" :item-text-value="byName" :items="items">
              <template #default="{ item }">
                <ListBoxItem
                  :id="(item as { id: number }).id"
                  :text-value="byName(item as { name: string })"
                >
                  {{ byName(item as { name: string }) }}
                  <ListBoxItemIndicator />
                </ListBoxItem>
              </template>
            </ListBox>
          </VirtualizerRoot>
        </template>
      </AutocompleteFilter>
    </AutocompletePopover>
  </Autocomplete>
</template>
