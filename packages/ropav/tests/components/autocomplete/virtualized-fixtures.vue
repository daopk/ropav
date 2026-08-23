<script setup lang="ts" vapor>
import {computed, shallowRef} from "vue";

import {
  AutocompleteFilter,
  AutocompleteIndicator,
  AutocompletePopover,
  AutocompleteRoot,
  AutocompleteTrigger,
  AutocompleteValue,
} from "@/components/autocomplete";
import {LabelRoot} from "@/components/label";
import {ListBoxRoot} from "@/components/list-box";
import {ListBoxItemIndicator, ListBoxItemRoot} from "@/components/list-box-item";
import {
  SearchFieldGroup,
  SearchFieldInput,
  SearchFieldRoot,
  SearchFieldSearchIcon,
} from "@/components/search-field";
import {VirtualizerRoot} from "@/components/virtualizer";
import {useFilter} from "@/composables/use-filter";
import {ListLayout} from "@/utils/virtualizer-list-layout";

/** A windowed autocomplete, which is the one case the options cannot all be in the DOM. */
const props = withDefaults(defineProps<{count?: number; rowHeight?: number}>(), {
  count: 1000,
  rowHeight: 50,
});

const filter = useFilter({sensitivity: "base"});

const search = shallowRef("");

const allItems = computed(() =>
  Array.from({length: props.count}, (_unused, index) => ({
    id: index + 1,
    name: `User ${index + 1}`,
  })),
);

const filtered = computed(() => {
  if (!search.value) return allItems.value;

  return allItems.value.filter((item) => filter.value.contains(item.name, search.value));
});

const byName = (item: {name: string}) => item.name;
</script>

<template>
  <AutocompleteRoot
    allows-empty-collection
    class="w-[300px]"
    :item-text-value="byName"
    :items="allItems"
    placeholder="Select a user"
  >
    <LabelRoot>User</LabelRoot>
    <AutocompleteTrigger>
      <AutocompleteValue />
      <AutocompleteIndicator />
    </AutocompleteTrigger>
    <AutocompletePopover>
      <AutocompleteFilter :input-value="search" :items="filtered" @input-change="search = $event">
        <template #default="{items}">
          <SearchFieldRoot aria-label="Search users" auto-focus variant="secondary">
            <SearchFieldGroup>
              <SearchFieldSearchIcon />
              <SearchFieldInput placeholder="Search users..." />
            </SearchFieldGroup>
          </SearchFieldRoot>
          <VirtualizerRoot :layout="ListLayout" :layout-options="{rowHeight: props.rowHeight}">
            <ListBoxRoot class="h-[300px] overflow-y-auto" :item-text-value="byName" :items="items">
              <template #default="{item}">
                <ListBoxItemRoot
                  :id="(item as {id: number}).id"
                  :text-value="byName(item as {name: string})"
                >
                  {{ byName(item as {name: string}) }}
                  <ListBoxItemIndicator />
                </ListBoxItemRoot>
              </template>
            </ListBoxRoot>
          </VirtualizerRoot>
        </template>
      </AutocompleteFilter>
    </AutocompletePopover>
  </AutocompleteRoot>
</template>
