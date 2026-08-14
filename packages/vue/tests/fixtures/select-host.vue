<script setup lang="ts" vapor>
import type {SelectFixtureItem, SelectHostProps} from "./select.types";

import {useSelect} from "@/composables/use-select";
import {useSelectState} from "@/composables/use-select-state";

// Every three-state boolean declares an explicit `undefined`, at this layer too: `v-bind`
// forwards a cast `false` as a value that is present, and no inner default can undo that.
const props = withDefaults(defineProps<SelectHostProps>(), {
  allowsEmptyCollection: undefined,
  ariaDescribedby: undefined,
  ariaLabel: undefined,
  ariaLabelledby: undefined,
  defaultOpen: undefined,
  defaultValue: undefined,
  disabledKeys: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isOpen: undefined,
  isRequired: undefined,
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

const select = useSelect(
  {
    ariaDescribedby: () => props.ariaDescribedby,
    ariaLabel: () => props.ariaLabel,
    ariaLabelledby: () => props.ariaLabelledby,
    isDisabled: () => props.isDisabled,
    isRequired: () => props.isRequired,
    onFocusChange: (isFocused) => props.onFocusChange?.(isFocused),
  },
  state,
);

props.onReady?.(state);
props.onSelectReady?.(select);

const setTrigger = (element: unknown) => {
  select.responder.registerElement((element as HTMLElement | null) ?? null);
};
</script>

<template>
  <span :id="select.valueId.value" data-testid="value">{{ state.selectedKey.value ?? "" }}</span>
  <button
    :ref="setTrigger"
    v-bind="select.triggerAttributes.value"
    data-testid="trigger"
    @blur="select.onBlur"
    @focus="select.onFocus"
    @keydown="select.onKeydown"
    @keydown.capture="select.onKeydownCapture"
  >
    Trigger
  </button>
</template>
