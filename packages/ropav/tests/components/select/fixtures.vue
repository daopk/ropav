<script setup lang="ts" vapor>
import type { SelectFixtureItem, SelectFixtureProps } from "./fixtures.types";
import type { SelectedValue } from "@/composables/use-select-state";

import { Description } from "@/components/description";
import { FieldError } from "@/components/field-error";
import { IconChevronDown } from "@/components/icons";
import { Label } from "@/components/label";
import { ListBox } from "@/components/list-box";
import { ListBoxItemIndicator, ListBoxItem } from "@/components/list-box-item";
import {
  SelectIndicator,
  SelectPopover,
  Select,
  SelectTrigger,
  SelectValue,
} from "@/components/select";

/**
 * Every three-state boolean declares an explicit `undefined`: a cast `false` reads as the caller
 * claiming that state, which for `isInvalid` would silence the whole validation layer and for
 * `isOpen` would make the select controlled and permanently shut.
 *
 * The default list is written inline because `withDefaults` is hoisted out of `setup()`.
 */
const props = withDefaults(defineProps<SelectFixtureProps>(), {
  allowsEmptyCollection: undefined,
  form: undefined,
  defaultOpen: undefined,
  defaultValue: undefined,
  fullWidth: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isOpen: undefined,
  isRequired: undefined,
  items: (): SelectFixtureItem[] => [
    { email: "fl@ropav.com", id: "florida", name: "Florida" },
    { email: "ca@ropav.com", id: "california", name: "California" },
    { email: "tx@ropav.com", id: "texas", name: "Texas" },
  ],
  name: undefined,
  placeholder: "Select one",
  value: undefined,
  size: undefined,
  variant: undefined,
});

const emit = defineEmits<{
  change: [value: SelectedValue];
  openChange: [isOpen: boolean];
}>();
</script>

<template>
  <Select
    :allows-empty-collection="props.allowsEmptyCollection"
    :class="props.rootClass"
    :default-open="props.defaultOpen"
    :default-value="props.defaultValue"
    :form="props.form"
    :full-width="props.fullWidth"
    :is-disabled="props.isDisabled"
    :is-invalid="props.isInvalid"
    :is-open="props.isOpen"
    :is-required="props.isRequired"
    :item-text-value="(item: SelectFixtureItem) => item.name"
    :items="props.items"
    :name="props.name"
    :placeholder="props.placeholder"
    :selection-mode="props.selectionMode"
    :size="props.size"
    :value="props.value"
    :variant="props.variant"
    @change="emit('change', $event)"
    @open-change="emit('openChange', $event)"
  >
    <Label v-if="props.withLabel">State</Label>
    <SelectTrigger :class="props.triggerClass">
      <SelectValue :class="props.valueClass">
        <template v-if="props.withCustomValue" #default="{ isPlaceholder, selectedItems }">
          <span data-testid="custom-value">
            {{ isPlaceholder ? "nothing" : selectedItems.map((item) => item.key).join("+") }}
          </span>
        </template>
        <template v-else-if="props.withCustomValueList" #default="{ selectedItems }">
          <span v-for="item in selectedItems" :key="item.key" data-testid="value-item">
            {{ (item.value as SelectFixtureItem).name }}
          </span>
        </template>
      </SelectValue>
      <SelectIndicator v-if="props.withCustomIndicator" :class="props.indicatorClass">
        <IconChevronDown data-testid="custom-icon" />
      </SelectIndicator>
      <SelectIndicator v-else :class="props.indicatorClass" />
    </SelectTrigger>
    <Description v-if="props.withDescription">Pick a state</Description>
    <SelectPopover :class="props.popoverClass">
      <ListBox>
        <ListBoxItem
          v-for="item in props.items"
          :id="item.id"
          :key="item.id"
          :is-disabled="item.isDisabled"
          :text-value="item.name"
        >
          {{ item.name }}
          <ListBoxItemIndicator />
        </ListBoxItem>
      </ListBox>
    </SelectPopover>
    <FieldError v-if="props.withFieldError">Please choose a state</FieldError>
  </Select>
</template>
