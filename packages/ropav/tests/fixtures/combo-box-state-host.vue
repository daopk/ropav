<script setup lang="ts" vapor>
import type { ComboBoxFixtureItem, ComboBoxStateHostProps } from "./combo-box.types";

import { useComboBoxState } from "@/composables/use-combo-box-state";

/**
 * Every three-state boolean declares an explicit `undefined`: a cast `false` would read as the
 * caller claiming that state, and for `isInvalid` it would pin the combo box valid and turn the
 * whole validation layer into dead code.
 *
 * `defaultFilter` declares one too, because `null` is a meaningful value here — it means the
 * caller narrows `items` itself — and must be told apart from "not given".
 *
 * The default list is written inline because `withDefaults` is hoisted out of `setup()`.
 */
const props = withDefaults(defineProps<ComboBoxStateHostProps>(), {
  allowsCustomValue: undefined,
  allowsEmptyCollection: undefined,
  defaultFilter: undefined,
  defaultInputValue: undefined,
  defaultValue: undefined,
  disabledKeys: undefined,
  inputValue: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  items: (): ComboBoxFixtureItem[] => [
    { id: "cat", name: "Cat" },
    { id: "dog", name: "Dog" },
    { id: "panda", name: "Panda" },
  ],
  menuTrigger: undefined,
  name: undefined,
  shouldCloseOnBlur: undefined,
  validate: undefined,
  validationBehavior: undefined,
  value: undefined,
});

const state = useComboBoxState<ComboBoxFixtureItem>({
  allowsCustomValue: () => props.allowsCustomValue,
  allowsEmptyCollection: () => props.allowsEmptyCollection,
  defaultFilter: () => props.defaultFilter,
  defaultInputValue: () => props.defaultInputValue,
  defaultValue: props.defaultValue,
  disabledKeys: () => props.disabledKeys,
  inputValue: () => props.inputValue,
  isInvalid: () => props.isInvalid,
  isReadOnly: () => props.isReadOnly,
  itemDisabled: (item) => Boolean(item.isDisabled),
  items: () => props.items,
  itemTextValue: (item) => item.name,
  menuTrigger: () => props.menuTrigger,
  name: () => props.name,
  onChange: (value) => props.onChange?.(value),
  onInputChange: (value) => props.onInputChange?.(value),
  onOpenChange: (isOpen, trigger) => props.onOpenChange?.(isOpen, trigger),
  selectionMode: () => props.selectionMode,
  shouldCloseOnBlur: () => props.shouldCloseOnBlur,
  validate: () => props.validate,
  validationBehavior: () => props.validationBehavior,
  value: () => props.value,
});

props.onReady?.(state);
</script>

<template>
  <div data-testid="combo-box-state" />
</template>
