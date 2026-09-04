<script setup lang="ts" vapor>
import type { ComboBoxFixtureItem, ComboBoxFixtureProps } from "./fixtures.types";
import type { ComboBoxMenuTrigger } from "@/composables/use-combo-box-state";
import type { SelectedValue } from "@/composables/use-select-state";

import {
  ComboBoxInputGroup,
  ComboBoxPopover,
  ComboBox,
  ComboBoxTrigger,
  ComboBoxValue,
} from "@/components/combo-box";
import { Description } from "@/components/description";
import { EmptyState } from "@/components/empty-state";
import { FieldError } from "@/components/field-error";
import { IconChevronDown } from "@/components/icons";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { ListBox } from "@/components/list-box";
import { ListBoxItemIndicator, ListBoxItem } from "@/components/list-box-item";

/**
 * Every three-state boolean declares an explicit `undefined`: a cast `false` reads as the caller
 * claiming that state, which for `isInvalid` would silence the whole validation layer and for
 * `allowsCustomValue` would pin the form value to the key.
 *
 * `defaultFilter` declares one too, because `null` is meaningful here — it means the caller narrows
 * `items` itself — and has to be told apart from "not given".
 *
 * The default list is written inline because `withDefaults` is hoisted out of `setup()`.
 */
const props = withDefaults(defineProps<ComboBoxFixtureProps>(), {
  allowsCustomValue: undefined,
  allowsEmptyCollection: undefined,
  defaultFilter: undefined,
  defaultInputValue: undefined,
  defaultValue: undefined,
  disabledKeys: undefined,
  form: undefined,
  formValue: undefined,
  fullWidth: undefined,
  inputValue: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  items: (): ComboBoxFixtureItem[] => [
    { id: "cat", name: "Cat" },
    { id: "dog", name: "Dog" },
    { id: "panda", name: "Panda" },
  ],
  menuTrigger: undefined,
  name: undefined,
  placeholder: "Search animals...",
  selectionMode: undefined,
  value: undefined,
  size: undefined,
  variant: undefined,
  withCustomIndicator: undefined,
  withCustomValue: undefined,
  withDescription: undefined,
  withEmptyState: undefined,
  withFieldError: undefined,
  withForm: undefined,
  withLabel: undefined,
  withValue: undefined,
});

const emit = defineEmits<{
  change: [value: SelectedValue];
  inputChange: [value: string];
  openChange: [isOpen: boolean, menuTrigger?: ComboBoxMenuTrigger];
}>();
</script>

<template>
  <component :is="props.withForm ? 'form' : 'div'">
    <ComboBox
      v-slot="{ items: matches }"
      :allows-custom-value="props.allowsCustomValue"
      :allows-empty-collection="props.allowsEmptyCollection"
      :class="props.rootClass"
      :default-filter="props.defaultFilter"
      :default-input-value="props.defaultInputValue"
      :default-value="props.defaultValue"
      :disabled-keys="props.disabledKeys"
      :form="props.form"
      :form-value="props.formValue"
      :full-width="props.fullWidth"
      :input-value="props.inputValue"
      :is-disabled="props.isDisabled"
      :is-invalid="props.isInvalid"
      :is-read-only="props.isReadOnly"
      :is-required="props.isRequired"
      :item-disabled="(item: ComboBoxFixtureItem) => Boolean(item.isDisabled)"
      :item-text-value="(item: ComboBoxFixtureItem) => item.name"
      :items="props.items"
      :menu-trigger="props.menuTrigger"
      :name="props.name"
      :selection-mode="props.selectionMode"
      :size="props.size"
      :value="props.value"
      :variant="props.variant"
      @change="emit('change', $event)"
      @input-change="emit('inputChange', $event)"
      @open-change="emit('openChange', $event)"
    >
      <Label v-if="props.withLabel">Favorite Animal</Label>
      <ComboBoxInputGroup :class="props.inputGroupClass">
        <Input :placeholder="props.placeholder" />
        <ComboBoxTrigger v-if="props.withCustomIndicator" :class="props.triggerClass">
          <IconChevronDown data-testid="custom-icon" />
        </ComboBoxTrigger>
        <ComboBoxTrigger v-else :class="props.triggerClass" />
      </ComboBoxInputGroup>
      <ComboBoxValue v-if="props.withValue" :class="props.valueClass" placeholder="Nothing chosen">
        <template v-if="props.withCustomValue" #default="{ isPlaceholder, selectedItems }">
          <span data-testid="custom-value">
            {{ isPlaceholder ? "nothing" : selectedItems.map((item) => item.key).join("+") }}
          </span>
        </template>
      </ComboBoxValue>
      <Description v-if="props.withDescription">Pick an animal</Description>
      <ComboBoxPopover :class="props.popoverClass">
        <ListBox :selection-mode="props.selectionMode">
          <template v-if="props.withEmptyState" #empty>
            <EmptyState>No results found</EmptyState>
          </template>
          <ListBoxItem
            v-for="item in matches as ComboBoxFixtureItem[]"
            :id="item.id"
            :key="item.id"
            :text-value="item.name"
          >
            {{ item.name }}
            <ListBoxItemIndicator />
          </ListBoxItem>
        </ListBox>
      </ComboBoxPopover>
      <FieldError v-if="props.withFieldError">Please choose an animal</FieldError>
    </ComboBox>
    <button v-if="props.withForm" data-testid="reset" type="reset">Reset</button>
  </component>
</template>
