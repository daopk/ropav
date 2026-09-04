<script setup lang="ts" vapor>
import type { AutocompleteFixtureItem, AutocompleteFixtureProps } from "./fixtures.types";
import type { SelectedValue } from "@/composables/use-select-state";

import {
  AutocompleteClearButton,
  AutocompleteFilter,
  AutocompleteIndicator,
  AutocompletePopover,
  Autocomplete,
  AutocompleteTrigger,
  AutocompleteValue,
} from "@/components/autocomplete";
import { Description } from "@/components/description";
import { EmptyState } from "@/components/empty-state";
import { FieldError } from "@/components/field-error";
import { IconChevronDown } from "@/components/icons";
import { Label } from "@/components/label";
import { ListBox } from "@/components/list-box";
import { ListBoxItemIndicator, ListBoxItem } from "@/components/list-box-item";
import {
  SearchFieldClearButton,
  SearchFieldGroup,
  SearchFieldInput,
  SearchField,
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
    <Autocomplete
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
      <Label v-if="props.withLabel">Favorite Animal</Label>
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
      <Description v-if="props.withDescription">Pick an animal</Description>
      <AutocompletePopover :class="props.popoverClass">
        <AutocompleteFilter
          :filter="props.withFilter ? filter.contains : undefined"
          :items="props.filterItems"
          @input-change="emit('inputChange', $event)"
        >
          <template #default="{ items }">
            <SearchField aria-label="Search animals" auto-focus variant="secondary">
              <SearchFieldGroup>
                <SearchFieldSearchIcon />
                <SearchFieldInput placeholder="Search animals..." />
                <SearchFieldClearButton />
              </SearchFieldGroup>
            </SearchField>
            <ListBox>
              <template v-if="props.withEmptyState" #empty>
                <EmptyState>No results found</EmptyState>
              </template>
              <ListBoxItem
                v-for="item in items as AutocompleteFixtureItem[]"
                :id="item.id"
                :key="item.id"
                :is-disabled="item.isDisabled"
                :text-value="item.name"
              >
                {{ item.name }}
                <ListBoxItemIndicator />
              </ListBoxItem>
            </ListBox>
          </template>
        </AutocompleteFilter>
      </AutocompletePopover>
      <FieldError v-if="props.withFieldError">Please choose an animal</FieldError>
    </Autocomplete>
    <button v-if="props.withForm" data-testid="reset" type="reset">Reset</button>
  </component>
</template>
