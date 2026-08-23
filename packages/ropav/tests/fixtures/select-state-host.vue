<script setup lang="ts" vapor>
import type {SelectFixtureItem, SelectStateHostProps} from "./select.types";

import {useSelectState} from "@/composables/use-select-state";

/**
 * Every three-state boolean declares an explicit `undefined`: a cast `false` would read as the
 * caller claiming that state, and for `isInvalid` it would pin the select valid and turn the
 * whole validation layer into dead code.
 *
 * The default list is written inline because `withDefaults` is hoisted out of `setup()`.
 */
const props = withDefaults(defineProps<SelectStateHostProps>(), {
  allowsEmptyCollection: undefined,
  defaultOpen: undefined,
  defaultValue: undefined,
  disabledKeys: undefined,
  isInvalid: undefined,
  isOpen: undefined,
  items: (): SelectFixtureItem[] => [
    {id: "florida", name: "Florida"},
    {id: "california", name: "California"},
    {id: "texas", name: "Texas"},
  ],
  name: undefined,
  shouldCloseOnSelect: undefined,
  validate: undefined,
  validationBehavior: undefined,
  value: undefined,
});

const state = useSelectState<SelectFixtureItem>({
  allowsEmptyCollection: () => props.allowsEmptyCollection,
  defaultOpen: props.defaultOpen,
  defaultValue: props.defaultValue,
  disabledKeys: () => props.disabledKeys,
  isInvalid: () => props.isInvalid,
  isOpen: () => props.isOpen,
  itemDisabled: (item) => Boolean(item.isDisabled),
  items: () => props.items,
  itemTextValue: (item) => item.name,
  name: () => props.name,
  onChange: (value) => props.onChange?.(value),
  onOpenChange: (isOpen) => props.onOpenChange?.(isOpen),
  selectionMode: () => props.selectionMode,
  shouldCloseOnSelect: () => props.shouldCloseOnSelect,
  validate: () => props.validate,
  validationBehavior: () => props.validationBehavior,
  value: () => props.value,
});

props.onReady?.(state);
</script>

<template>
  <div data-testid="select-state" />
</template>
