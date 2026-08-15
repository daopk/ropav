<script setup lang="ts" vapor>
import type {SelectFixtureItem, SelectFixtureProps} from "./fixtures.types";
import type {SelectedValue} from "@/composables/use-select-state";

import {DescriptionRoot} from "@/components/description";
import {FieldErrorRoot} from "@/components/field-error";
import {IconChevronDown} from "@/components/icons";
import {LabelRoot} from "@/components/label";
import {ListBoxRoot} from "@/components/list-box";
import {ListBoxItemIndicator, ListBoxItemRoot} from "@/components/list-box-item";
import {
  SelectIndicator,
  SelectPopover,
  SelectRoot,
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
  defaultOpen: undefined,
  defaultValue: undefined,
  fullWidth: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isOpen: undefined,
  isRequired: undefined,
  items: (): SelectFixtureItem[] => [
    {email: "fl@heroui.com", id: "florida", name: "Florida"},
    {email: "ca@heroui.com", id: "california", name: "California"},
    {email: "tx@heroui.com", id: "texas", name: "Texas"},
  ],
  name: undefined,
  placeholder: "Select one",
  value: undefined,
  variant: undefined,
});

const emit = defineEmits<{
  change: [value: SelectedValue];
  openChange: [isOpen: boolean];
}>();
</script>

<template>
  <SelectRoot
    :class="props.rootClass"
    :default-open="props.defaultOpen"
    :default-value="props.defaultValue"
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
    :value="props.value"
    :variant="props.variant"
    @change="emit('change', $event)"
    @open-change="emit('openChange', $event)"
  >
    <LabelRoot v-if="props.withLabel">State</LabelRoot>
    <SelectTrigger :class="props.triggerClass">
      <SelectValue :class="props.valueClass">
        <template v-if="props.withCustomValue" #default="{isPlaceholder, selectedItems}">
          <span data-testid="custom-value">
            {{ isPlaceholder ? "nothing" : selectedItems.map((item) => item.key).join("+") }}
          </span>
        </template>
      </SelectValue>
      <SelectIndicator v-if="props.withCustomIndicator" :class="props.indicatorClass">
        <IconChevronDown data-testid="custom-icon" />
      </SelectIndicator>
      <SelectIndicator v-else :class="props.indicatorClass" />
    </SelectTrigger>
    <DescriptionRoot v-if="props.withDescription">Pick a state</DescriptionRoot>
    <SelectPopover :class="props.popoverClass">
      <ListBoxRoot>
        <ListBoxItemRoot
          v-for="item in props.items"
          :id="item.id"
          :key="item.id"
          :is-disabled="item.isDisabled"
          :text-value="item.name"
        >
          {{ item.name }}
          <ListBoxItemIndicator />
        </ListBoxItemRoot>
      </ListBoxRoot>
    </SelectPopover>
    <FieldErrorRoot v-if="props.withFieldError">Please choose a state</FieldErrorRoot>
  </SelectRoot>
</template>
