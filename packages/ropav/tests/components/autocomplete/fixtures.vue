<script setup lang="ts" vapor>
import type { AutocompleteFixtureItem, AutocompleteFixtureProps } from "./fixtures.types";
import type { SelectedValue } from "@/composables/use-select-state";

import {
  AutocompleteClearButton,
  AutocompleteFilter,
  AutocompleteIndicator,
  AutocompletePopover,
  AutocompleteRoot,
  AutocompleteTrigger,
  AutocompleteValue,
} from "@/components/autocomplete";
import { DescriptionRoot } from "@/components/description";
import { EmptyStateRoot } from "@/components/empty-state";
import { FieldErrorRoot } from "@/components/field-error";
import { IconChevronDown } from "@/components/icons";
import { LabelRoot } from "@/components/label";
import { ListBoxRoot } from "@/components/list-box";
import { ListBoxItemIndicator, ListBoxItemRoot } from "@/components/list-box-item";
import {
  SearchFieldClearButton,
  SearchFieldGroup,
  SearchFieldInput,
  SearchFieldRoot,
  SearchFieldSearchIcon,
} from "@/components/search-field";
import { useFilter } from "@/composables/use-filter";

/**
 * Every three-state boolean declares an explicit `undefined`: a cast `false` reads as the caller
 * claiming that state, which for `isInvalid` would silence the whole validation layer and for
 * `isOpen` would make the autocomplete controlled and permanently shut.
 *
 * The default list is written inline because `withDefaults` is hoisted out of `setup()`.
 */
const props = withDefaults(defineProps<AutocompleteFixtureProps>(), {
  allowsEmptyCollection: undefined,
  defaultOpen: undefined,
  defaultValue: undefined,
  disabledKeys: undefined,
  filterItems: undefined,
  form: undefined,
  fullWidth: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isOpen: undefined,
  isRequired: undefined,
  items: (): AutocompleteFixtureItem[] => [
    { id: "cat", name: "Cat" },
    { id: "dog", name: "Dog" },
    { id: "elephant", name: "Elephant" },
  ],
  name: undefined,
  placeholder: "Select an animal",
  selectionMode: undefined,
  value: undefined,
  size: undefined,
  variant: undefined,
  withClearButton: undefined,
  withCustomIndicator: undefined,
  withCustomValue: undefined,
  withDescription: undefined,
  withEmptyState: undefined,
  withFieldError: undefined,
  withFilter: true,
  withForm: undefined,
  withLabel: undefined,
});

const emit = defineEmits<{
  change: [value: SelectedValue];
  openChange: [isOpen: boolean];
  clear: [];
  inputChange: [value: string];
}>();

const filter = useFilter({ sensitivity: "base" });
</script>

<template>
  <component :is="props.withForm ? 'form' : 'div'">
    <AutocompleteRoot
      :allows-empty-collection="props.allowsEmptyCollection"
      :class="props.rootClass"
      :default-open="props.defaultOpen"
      :default-value="props.defaultValue"
      :disabled-keys="props.disabledKeys"
      :form="props.form"
      :full-width="props.fullWidth"
      :is-disabled="props.isDisabled"
      :is-invalid="props.isInvalid"
      :is-open="props.isOpen"
      :is-required="props.isRequired"
      :item-text-value="(item: AutocompleteFixtureItem) => item.name"
      :items="props.items"
      :name="props.name"
      :on-clear="props.onClear"
      :placeholder="props.placeholder"
      :selection-mode="props.selectionMode"
      :size="props.size"
      :value="props.value"
      :variant="props.variant"
      @change="emit('change', $event)"
      @clear="emit('clear')"
      @open-change="emit('openChange', $event)"
    >
      <LabelRoot v-if="props.withLabel">Favorite Animal</LabelRoot>
      <AutocompleteTrigger :class="props.triggerClass">
        <AutocompleteValue :class="props.valueClass">
          <template v-if="props.withCustomValue" #default="{ isPlaceholder, selectedItems }">
            <span data-testid="custom-value">
              {{ isPlaceholder ? "nothing" : selectedItems.map((item) => item.key).join("+") }}
            </span>
          </template>
        </AutocompleteValue>
        <AutocompleteClearButton v-if="props.withClearButton" :class="props.clearButtonClass" />
        <AutocompleteIndicator v-if="props.withCustomIndicator" :class="props.indicatorClass">
          <IconChevronDown data-testid="custom-icon" />
        </AutocompleteIndicator>
        <AutocompleteIndicator v-else :class="props.indicatorClass" />
      </AutocompleteTrigger>
      <DescriptionRoot v-if="props.withDescription">Pick an animal</DescriptionRoot>
      <AutocompletePopover :class="props.popoverClass">
        <AutocompleteFilter
          :filter="props.withFilter ? filter.contains : undefined"
          :items="props.filterItems"
          @input-change="emit('inputChange', $event)"
        >
          <template #default="{ items }">
            <SearchFieldRoot aria-label="Search animals" auto-focus variant="secondary">
              <SearchFieldGroup>
                <SearchFieldSearchIcon />
                <SearchFieldInput placeholder="Search animals..." />
                <SearchFieldClearButton />
              </SearchFieldGroup>
            </SearchFieldRoot>
            <ListBoxRoot>
              <template v-if="props.withEmptyState" #empty>
                <EmptyStateRoot>No results found</EmptyStateRoot>
              </template>
              <ListBoxItemRoot
                v-for="item in items as AutocompleteFixtureItem[]"
                :id="item.id"
                :key="item.id"
                :is-disabled="item.isDisabled"
                :text-value="item.name"
              >
                {{ item.name }}
                <ListBoxItemIndicator />
              </ListBoxItemRoot>
            </ListBoxRoot>
          </template>
        </AutocompleteFilter>
      </AutocompletePopover>
      <FieldErrorRoot v-if="props.withFieldError">Please choose an animal</FieldErrorRoot>
    </AutocompleteRoot>
    <button v-if="props.withForm" data-testid="reset" type="reset">Reset</button>
  </component>
</template>
