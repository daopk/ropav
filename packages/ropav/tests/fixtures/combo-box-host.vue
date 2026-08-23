<script setup lang="ts" vapor>
import type {ComboBoxFixtureItem, ComboBoxHostProps} from "./combo-box.types";
import type {UseListKeyboardReturn} from "@/composables/use-list-keyboard";

import {computed, shallowRef} from "vue";

import {composePressResponder} from "@/composables/press-responder";
import {useComboBox} from "@/composables/use-combo-box";
import {useComboBoxState} from "@/composables/use-combo-box-state";
import {useListKeyboard} from "@/composables/use-list-keyboard";

// Every three-state boolean declares an explicit `undefined`, at this layer too: `v-bind` forwards
// a cast `false` as a value that is present, and no inner default can undo that.
const props = withDefaults(defineProps<ComboBoxHostProps>(), {
  allowsCustomValue: undefined,
  allowsEmptyCollection: undefined,
  ariaDescribedby: undefined,
  ariaLabel: undefined,
  ariaLabelledby: undefined,
  defaultFilter: undefined,
  defaultInputValue: undefined,
  defaultValue: undefined,
  disabledKeys: undefined,
  inputValue: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  items: (): ComboBoxFixtureItem[] => [
    {id: "cat", name: "Cat"},
    {id: "dog", name: "Dog"},
    {id: "panda", name: "Panda"},
  ],
  menuTrigger: undefined,
  name: undefined,
  shouldCloseOnBlur: undefined,
  validate: undefined,
  validationBehavior: undefined,
  value: undefined,
  withListBox: undefined,
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

/*
 * The listbox reports its keyboard behaviour up, exactly as `ListBox` does through
 * `ListBoxStateContext`. Built here so a test can leave it out and see what a combo box does with
 * no list beside it — which is the state every closed combo box is in.
 */
const listElement = shallowRef<HTMLElement | null>(null);
const popoverElement = shallowRef<HTMLElement | null>(null);

const keyboard = useListKeyboard({
  collection: state.collection,
  element: listElement,
  listId: () => comboBox.listId.value,
  selection: state.selection,
  shouldUseVirtualFocus: true,
});

const comboBox = useComboBox(
  {
    ariaDescribedby: () => props.ariaDescribedby,
    ariaLabel: () => props.ariaLabel,
    ariaLabelledby: () => props.ariaLabelledby,
    isDisabled: () => props.isDisabled,
    isReadOnly: () => props.isReadOnly,
    isRequired: () => props.isRequired,
    keyboard: (): UseListKeyboardReturn | null => (props.withListBox ? keyboard : null),
    name: () => props.name,
    onFocusChange: (isFocused) => props.onFocusChange?.(isFocused),
    onKeydown: (event) => props.onKeydown?.(event),
    popoverElement: () => popoverElement.value,
  },
  state,
);

props.onReady?.(state);
props.onComboBoxReady?.(comboBox);

const control = comboBox.control;

// Claimed as the `Label` part does. An id nobody claims is never handed out, so a container that
// never references a slot cannot grow an attribute that means nothing.
const labelId = comboBox.fieldIds.claimLabelId();

// Listeners are attached statically rather than spread with `v-bind`, which in vapor re-attaches
// them on every render — a handler must never travel through `v-bind`.
const press = composePressResponder(comboBox.triggerResponder);

const setInput = (element: unknown) => {
  control.registerElement((element as HTMLInputElement | null) ?? null);
};

const setTrigger = (element: unknown) => {
  comboBox.triggerResponder.registerElement((element as HTMLElement | null) ?? null);
};

const setList = (element: unknown) => {
  listElement.value = (element as HTMLElement | null) ?? null;
};

const setPopover = (element: unknown) => {
  popoverElement.value = (element as HTMLElement | null) ?? null;
};

const options = computed(() => state.collection.orderedKeys());

const optionId = (key: string | number) => `${comboBox.listId.value}-option-${key}`;
</script>

<template>
  <label :id="labelId" data-testid="label">Favorite Animal</label>
  <div data-testid="group" role="group">
    <input
      :ref="setInput"
      data-testid="input"
      v-bind="control.attrs.value"
      @blur="control.handlers.onBlur"
      @focus="control.handlers.onFocus"
      @input="control.handlers.onInput"
      @keydown="control.handlers.onKeydown"
      @keyup="control.handlers.onKeyup"
    />
    <button
      :ref="setTrigger"
      data-testid="trigger"
      v-bind="comboBox.triggerAttributes.value"
      @click="press.onClick"
      @dragstart="press.onDragstart"
      @keydown="press.onKeydown"
      @mousedown="press.onMousedown"
      @pointerdown="press.onPointerdown"
      @pointerenter="press.onPointerenter"
      @pointerleave="press.onPointerleave"
      @pointerup="press.onPointerup"
    >
      Show
    </button>
  </div>
  <div :ref="setPopover" data-testid="popover">
    <div
      v-if="props.withListBox && state.isOpen.value"
      :id="comboBox.listId.value"
      :ref="setList"
      :aria-label="comboBox.listLabel.value['aria-label']"
      :aria-labelledby="comboBox.listLabel.value['aria-labelledby']"
      data-testid="listbox"
      role="listbox"
    >
      <div
        v-for="key in options"
        :id="optionId(key)"
        :key="key"
        :aria-selected="state.selection.isSelected(key)"
        :data-key="key"
        data-testid="option"
        role="option"
      >
        {{ state.collection.getItem(key)?.textValue() }}
      </div>
    </div>
  </div>
</template>
