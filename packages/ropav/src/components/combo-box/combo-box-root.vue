<script setup lang="ts" vapor generic="T">
import type { UseComboBoxStateReturn } from "../../composables/use-combo-box-state";
import type { UseListKeyboardReturn } from "../../composables/use-list-keyboard";
import type { SelectedValue } from "../../composables/use-select-state";
import type { ComboBoxRootProps, ComboBoxRootSlotProps } from "./combo-box.types";

import { comboBoxVariants } from "@ropav/styles";
import { computed, shallowRef } from "vue";

import { providePressResponder } from "../../composables/press-responder";
import { useComboBox } from "../../composables/use-combo-box";
import { useComboBoxState } from "../../composables/use-combo-box-state";
import { provideFieldIdsContext } from "../../composables/use-field-ids";
import { useLocale } from "../../composables/use-locale";
import { provideTextFieldControlContext } from "../../composables/use-text-field";
import { dataAttr } from "../../utils/assertion";
import { provideFieldErrorContext } from "../field-error";
import { provideListBoxStateContext } from "../list-box";
import { provideOverlayTargetContext } from "../overlay";
import { provideTextFieldContext } from "../textfield/textfield.context";

import ComboBoxHiddenInput from "./combo-box-hidden-input.vue";
import { provideComboBoxContext } from "./combo-box.context";

/*
 * Every three-state prop declares an explicit `undefined` default. Vue casts an absent boolean to
 * `false`, and a `false` here reads as the caller claiming that state: for `isInvalid` it would pin
 * the combo box valid and turn the whole validation layer into dead code, and for
 * `shouldCloseOnBlur` it would leave a half-typed field standing open after focus had gone.
 *
 * `defaultFilter` declares one too, because `null` is a meaningful value here — it means the caller
 * narrows `items` itself — and has to be told apart from "not given".
 */
const props = withDefaults(defineProps<ComboBoxRootProps<T>>(), {
  allowsCustomValue: undefined,
  allowsEmptyCollection: undefined,
  autoFocus: undefined,
  defaultFilter: undefined,
  fullWidth: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  // Matches the React build, which overrides react-stately's own `"input"`.
  menuTrigger: "focus",
  shouldCloseOnBlur: undefined,
  shouldFocusWrap: undefined,
  variant: undefined,
});

const emit = defineEmits<{
  change: [value: SelectedValue];
  "update:value": [value: SelectedValue];
  inputChange: [value: string];
  "update:inputValue": [value: string];
  openChange: [isOpen: boolean, menuTrigger?: "focus" | "input" | "manual"];
  focusChange: [isFocused: boolean];
}>();

defineSlots<{ default?: (props: ComboBoxRootSlotProps<T>) => unknown }>();

const state = useComboBoxState<T>({
  allowsCustomValue: () => props.allowsCustomValue,
  allowsEmptyCollection: () => props.allowsEmptyCollection,
  defaultFilter: () => props.defaultFilter,
  defaultInputValue: () => props.defaultInputValue,
  defaultValue: props.defaultValue,
  disabledBehavior: () => props.disabledBehavior,
  disabledKeys: () => props.disabledKeys,
  inputValue: () => props.inputValue,
  isInvalid: () => props.isInvalid,
  isReadOnly: () => props.isReadOnly,
  itemDisabled: props.itemDisabled,
  itemKey: props.itemKey,
  items: () => props.items,
  itemTextValue: props.itemTextValue,
  menuTrigger: () => props.menuTrigger,
  name: () => props.name,
  onChange: (value) => {
    emit("change", value);
    emit("update:value", value);
  },
  onInputChange: (value) => {
    emit("inputChange", value);
    emit("update:inputValue", value);
  },
  onOpenChange: (isOpen, menuTrigger) => emit("openChange", isOpen, menuTrigger),
  selectionMode: () => props.selectionMode,
  shouldCloseOnBlur: () => props.shouldCloseOnBlur,
  validate: () => props.validate,
  validationBehavior: () => props.validationBehavior,
  value: () => props.value,
});

/**
 * The listbox's keyboard behaviour, reported up from the listbox once it exists.
 *
 * The field is where the caret is, so it is the field that has to answer the arrow keys — but only
 * the listbox can build the object that knows how to move through its own options and its own
 * layout. Handing it upward is what makes paging follow the geometry on screen.
 */
const keyboard = shallowRef<UseListKeyboardReturn | null>(null);

/** The group around the field, which the popover is measured and positioned against. */
const groupElement = shallowRef<HTMLElement | null>(null);
const popoverElement = shallowRef<HTMLElement | null>(null);

const comboBox = useComboBox(
  {
    ariaDescribedby: () => props.ariaDescribedby,
    ariaLabel: () => props.ariaLabel,
    ariaLabelledby: () => props.ariaLabelledby,
    autoComplete: () => props.autoComplete,
    autoFocus: () => props.autoFocus,
    form: () => props.form,
    id: () => props.id,
    inputMode: () => props.inputMode,
    isDisabled: () => props.isDisabled,
    isReadOnly: () => props.isReadOnly,
    isRequired: () => props.isRequired,
    keyboard: () => keyboard.value,
    maxLength: () => props.maxLength,
    minLength: () => props.minLength,
    // Only the field carries the name when the *text* is what a form submits; otherwise the key
    // travels in a hidden input beside it and the field must not send a second value of its own.
    name: () => (formValue.value === "text" ? props.name : undefined),
    onFocusChange: (isFocused) => emit("focusChange", isFocused),
    pattern: () => props.pattern,
    placeholder: () => props.placeholder,
    popoverElement: () => popoverElement.value,
    shouldFocusWrap: () => props.shouldFocusWrap,
  },
  state,
);

/**
 * Which half of the combo box a form carries.
 *
 * Custom values force the text: the whole point of allowing them is text with no key behind it,
 * and a form sending an empty key for a field the user can see is filled is worse than no value.
 */
const formValue = computed(() => (props.allowsCustomValue ? "text" : (props.formValue ?? "key")));

const locale = useLocale();

/**
 * The chosen options' text, joined the way the locale joins a list.
 *
 * `Intl.ListFormat` rather than `", "`, exactly as upstream: English wants "A, B, and C" and most
 * languages want something else entirely, none of which a hard-coded separator produces.
 */
const selectedText = computed(() => {
  const texts = state.selectedItems.value.map((item) => item.textValue).filter(Boolean);

  if (state.selectionMode.value === "single") return texts[0] ?? "";

  return new Intl.ListFormat(locale.value.locale).format(texts);
});

const styles = computed(() => comboBoxVariants({ fullWidth: props.fullWidth }));

const isDisabled = computed(() => Boolean(props.isDisabled));

/**
 * The options that matched, handed to whoever writes the listbox.
 *
 * Read off the displayed collection rather than by filtering `items` a second time: that collection
 * is already the answer, and it is the one that freezes while the popover closes — so a listbox
 * rendered from it does not rearrange itself on the way out.
 */
const matches = computed(() => state.displayedItems.value as readonly T[]);

provideFieldIdsContext(comboBox.fieldIds);
provideFieldErrorContext({ validation: state.displayValidation });

/**
 * The plain `Input` is the combo box's field.
 *
 * Everything that makes it one — the role, the expanded state, the option it names, the keys the
 * list answers — arrives through this context, which is why there is no combo box input part. The
 * React build reaches the same place by providing RAC's `InputContext`.
 */
provideTextFieldControlContext(comboBox.control);

// Carries the variant alone, which is the one thing the `Input` inside styles itself from. The
// React build routes it through its own combo box context for the same purpose.
provideTextFieldContext({ variant: computed(() => props.variant) });

provideComboBoxContext({
  comboBox,
  isDisabled,
  selectedItems: state.selectedItems as never,
  selectedText,
  setGroupElement: (element) => {
    groupElement.value = element;
  },
  slots: styles,
  state: state as UseComboBoxStateReturn<unknown>,
});

/**
 * The listbox in the popover runs on this combo box's state rather than one of its own.
 *
 * Virtual focus is the part that matters here: the caret never leaves the field, so an option
 * cannot read its own ring off a focus event — it draws it from the focused key instead, and the
 * field names it with `aria-activedescendant`.
 */
provideListBoxStateContext({
  ariaLabel: () => comboBox.listLabel.value["aria-label"],
  autoFocus: () => state.focusStrategy.value ?? true,
  collection: state.collection,
  labelledBy: () => comboBox.listLabel.value["aria-labelledby"],
  listId: () => comboBox.listId.value,
  registerKeyboard: (next) => {
    keyboard.value = next;
  },
  selection: state.selection,
  // The pointer and the keyboard drive the same highlight, so it follows the mouse.
  shouldFocusOnHover: true,
  shouldUseVirtualFocus: true,
});

/**
 * The popover is anchored to the group around the field, not to the chevron inside it.
 *
 * `--trigger-width` has to be the field's width, and the chevron is a fraction of it. Falls back to
 * the field itself, which is what a combo box written without a group has.
 *
 * Non-modal, and that is the whole arrangement rather than a preference: focus stays in the field
 * behind the popover, so containing focus inside it would take the caret out of what is being
 * typed. Closing on an outside click therefore comes from the field losing focus, and hiding the
 * rest of the page from assistive technology is done over both halves at once in `useComboBox`.
 */
provideOverlayTargetContext({
  autoFocus: computed(() => false),
  closeAll: state.close,
  isNonModal: true,
  /*
   * Nothing names the popover, which matches the React build: it carries no role, so an
   * `aria-labelledby` on it would be ignored anywhere it was read. The listbox inside is the thing
   * with a role, and it is named through `ListBoxStateContext` above.
   */
  labelledBy: computed(() => undefined),
  overlayId: comboBox.listId,
  placement: "bottom start",
  registerOverlayElement: (element) => {
    popoverElement.value = element;
  },
  state,
  trigger: "ComboBox",
  triggerElement: computed(() => groupElement.value ?? comboBox.inputElement.value),
});

// The chevron is whatever pressable sits inside, which is why the behaviour is handed down.
providePressResponder(comboBox.triggerResponder);
</script>

<template>
  <div
    :class="styles.base({ class: props.class })"
    :data-disabled="dataAttr(props.isDisabled)"
    :data-focused="dataAttr(state.isFocused.value)"
    :data-invalid="dataAttr(comboBox.isInvalid.value)"
    :data-open="dataAttr(state.isOpen.value)"
    :data-readonly="dataAttr(props.isReadOnly)"
    :data-required="dataAttr(props.isRequired)"
    data-slot="combo-box"
  >
    <slot
      :input-value="state.inputValue.value"
      :is-disabled="Boolean(props.isDisabled)"
      :is-invalid="comboBox.isInvalid.value"
      :is-open="state.isOpen.value"
      :is-read-only="Boolean(props.isReadOnly)"
      :is-required="Boolean(props.isRequired)"
      :items="matches"
    />
    <ComboBoxHiddenInput
      v-if="formValue === 'key' && props.name"
      :form="props.form"
      :name="props.name"
    />
  </div>
</template>
