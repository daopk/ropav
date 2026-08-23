<script setup lang="ts" vapor generic="T">
import type {AutocompleteRootProps, AutocompleteRootSlotProps} from "./autocomplete.types";
import type {SelectedValue, UseSelectStateReturn} from "../../composables/use-select-state";

import {autocompleteVariants} from "@heroui/styles";
import {computed, shallowRef} from "vue";

import {providePressResponder} from "../../composables/press-responder";
import {provideFieldIdsContext} from "../../composables/use-field-ids";
import {useLocale} from "../../composables/use-locale";
import {useLocalizedStringFormatter} from "../../composables/use-localized-string-formatter";
import {useSelect} from "../../composables/use-select";
import {useSelectState} from "../../composables/use-select-state";
import {selectStrings} from "../../i18n";
import {dataAttr} from "../../utils/assertion";
import {provideFieldErrorContext} from "../field-error";
import {provideListBoxStateContext} from "../list-box";
import {provideOverlayTargetContext} from "../overlay";
import SelectHiddenSelect from "../select/select-hidden-select.vue";
import {provideSelectContext} from "../select/select.context";

import {provideAutocompleteContext} from "./autocomplete.context";

/*
 * Every three-state prop declares an explicit `undefined` default. Vue casts an absent boolean to
 * `false`, and a `false` here reads as the caller claiming that state: for `isInvalid` it would
 * pin the autocomplete valid and turn the whole validation layer into dead code, and for `isOpen`
 * it would make every autocomplete controlled and permanently shut.
 */
const props = withDefaults(defineProps<AutocompleteRootProps<T>>(), {
  allowsEmptyCollection: undefined,
  fullWidth: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isOpen: undefined,
  isRequired: undefined,
  shouldCloseOnSelect: undefined,
});

const emit = defineEmits<{
  change: [value: SelectedValue];
  "update:value": [value: SelectedValue];
  openChange: [isOpen: boolean];
  "update:isOpen": [isOpen: boolean];
  focusChange: [isFocused: boolean];
  clear: [];
}>();

defineSlots<{default?: (props: AutocompleteRootSlotProps) => unknown}>();

/**
 * An autocomplete runs on a select's state, unchanged.
 *
 * It is not a combo box: the value is a key out of a fixed set of options and the text in the
 * field is only ever a way of narrowing which of them are on screen. So the whole select layer
 * applies — the hidden native control, the validation, choosing by typing while shut — and the
 * filtering sits on top of it rather than replacing any of it.
 */
const state = useSelectState<T>({
  allowsEmptyCollection: () => props.allowsEmptyCollection,
  defaultOpen: props.defaultOpen,
  defaultValue: props.defaultValue,
  disabledBehavior: () => props.disabledBehavior,
  disabledKeys: () => props.disabledKeys,
  isInvalid: () => props.isInvalid,
  isOpen: () => props.isOpen,
  itemDisabled: props.itemDisabled,
  itemKey: props.itemKey,
  items: () => props.items,
  itemTextValue: props.itemTextValue,
  name: () => props.name,
  onChange: (value) => {
    emit("change", value);
    emit("update:value", value);
  },
  onOpenChange: (isOpen) => {
    emit("openChange", isOpen);
    emit("update:isOpen", isOpen);
  },
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
    onFocusChange: (isFocused) => emit("focusChange", isFocused),
  },
  state,
);

const strings = useLocalizedStringFormatter(selectStrings);
const locale = useLocale();

const placeholder = computed(() => props.placeholder ?? strings.value.format("selectPlaceholder"));

/**
 * The chosen options' text, joined the way the locale joins a list.
 *
 * `Intl.ListFormat` rather than `", "`, exactly as upstream: English wants "A, B, and C" and most
 * languages want something else entirely, none of which a hard-coded separator produces.
 */
const selectedText = computed(() => {
  const texts = state.selectedItems.value.map((item) => item.textValue);

  if (state.selectionMode.value === "single") return texts[0] ?? "";

  return new Intl.ListFormat(locale.value.locale).format(texts);
});

const styles = computed(() =>
  autocompleteVariants({fullWidth: props.fullWidth, variant: props.variant}),
);

const isDisabled = computed(() => Boolean(props.isDisabled));

const triggerElement = shallowRef<HTMLElement | null>(null);
const clearButtonElement = shallowRef<HTMLElement | null>(null);

provideFieldIdsContext(select.fieldIds.context);
provideFieldErrorContext({validation: state.displayValidation});

provideAutocompleteContext({
  clearButtonElement,
  isDisabled,
  itemDisabled: props.itemDisabled as ((item: unknown) => boolean) | undefined,
  itemKey: props.itemKey as ((item: unknown, index: number) => never) | undefined,
  items: computed(() => props.items as readonly unknown[]),
  itemTextValue: props.itemTextValue as ((item: unknown) => string | undefined) | undefined,
  onClear: () => emit("clear"),
  placeholder,
  select,
  selectedItems: state.selectedItems as never,
  selectedText,
  setClearButtonElement: (element) => {
    clearButtonElement.value = element;
  },
  setTriggerElement: (element) => {
    triggerElement.value = element;
  },
  slots: styles,
  state: state as UseSelectStateReturn<unknown>,
  triggerElement,
});

/**
 * The hidden native control is a select's, so it is handed a select's context to read.
 *
 * True rather than convenient: the root *is* a select, and the control it submits through, the
 * value it holds and the validation it reports are the same ones. Only the slot names differ, and
 * that part is what {@link provideAutocompleteContext} above carries.
 */
provideSelectContext({
  placeholder,
  select,
  selectedItems: state.selectedItems as never,
  selectedText,
  slots: styles as never,
  state: state as UseSelectStateReturn<unknown>,
});

/**
 * The listbox in the popover runs on this autocomplete's state rather than one of its own.
 *
 * `Autocomplete.Filter` provides this again, over the options that matched what was typed. This
 * one is what a popover with no filter inside it falls back to, and what answers while the
 * filter's own collection is still empty.
 */
provideListBoxStateContext({
  autoFocus: () => state.focusStrategy.value ?? true,
  collection: state.collection,
  labelledBy: () => select.labelledBy.value,
  listId: () => select.listId.value,
  selection: state.selection,
  shouldFocusOnHover: true,
});

/**
 * The popover is anchored to the trigger group, not to the button inside it.
 *
 * The chevron is the accessible trigger — it carries `aria-haspopup` and answers the keyboard —
 * but it is a fraction of the field's width, and a popover lined up with it would be too. The
 * group is what `--trigger-width` has to measure, which `useOverlayPosition` writes from here.
 */
provideOverlayTargetContext({
  autoFocus: computed(() => state.focusStrategy.value ?? true),
  closeAll: state.close,
  isNonModal: false,
  labelledBy: select.labelledBy,
  overlayId: select.listId,
  placement: "bottom start",
  state,
  // Kept as the select's own kind: the stylesheet and `data-trigger` match the React build.
  trigger: "Select",
  triggerElement: computed(() => triggerElement.value ?? select.triggerElement.value),
});

// The trigger is whatever pressable sits inside, which is why the behaviour is handed down.
providePressResponder(select.responder);
</script>

<template>
  <div
    :class="styles.base({class: props.class})"
    :data-disabled="dataAttr(props.isDisabled)"
    :data-focused="dataAttr(state.isFocused.value)"
    :data-invalid="dataAttr(select.isInvalid.value)"
    :data-open="dataAttr(state.isOpen.value)"
    :data-required="dataAttr(props.isRequired)"
    data-slot="autocomplete"
  >
    <slot
      :is-disabled="Boolean(props.isDisabled)"
      :is-focused="state.isFocused.value"
      :is-invalid="select.isInvalid.value"
      :is-open="state.isOpen.value"
      :is-required="Boolean(props.isRequired)"
    />
    <SelectHiddenSelect
      :autocomplete="props.autoComplete"
      :form="props.form"
      :is-disabled="props.isDisabled"
      :is-required="props.isRequired"
      :name="props.name"
    />
  </div>
</template>
