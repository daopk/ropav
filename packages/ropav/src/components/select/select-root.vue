<script setup lang="ts" vapor generic="T">
import type { SelectedValue, UseSelectStateReturn } from "../../composables/use-select-state";
import type { SelectRootProps, SelectRootSlotProps } from "./select.types";

import { selectVariants } from "@ropav/styles";
import { computed } from "vue";

import { providePressResponder } from "../../composables/press-responder";
import { provideFieldIdsContext } from "../../composables/use-field-ids";
import { useLocale } from "../../composables/use-locale";
import { useLocalizedStringFormatter } from "../../composables/use-localized-string-formatter";
import { useSelect } from "../../composables/use-select";
import { useSelectState } from "../../composables/use-select-state";
import { selectStrings } from "../../i18n";
import { dataAttr } from "../../utils/assertion";
import { provideFieldErrorContext } from "../field-error";
import { provideListBoxStateContext } from "../list-box";
import { provideOverlayTargetContext } from "../overlay";

import SelectHiddenSelect from "./select-hidden-select.vue";
import { provideSelectContext } from "./select.context";

/*
 * Every three-state prop declares an explicit `undefined` default. Vue casts an absent boolean to
 * `false`, and a `false` here reads as the caller claiming that state: for `isInvalid` it would
 * pin the select valid and turn the whole validation layer into dead code, and for `isOpen` it
 * would make every select controlled and permanently shut.
 */
const props = withDefaults(defineProps<SelectRootProps<T>>(), {
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
}>();

defineSlots<{ default?: (props: SelectRootSlotProps) => unknown }>();

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
  selectVariants({ fullWidth: props.fullWidth, size: props.size, variant: props.variant }),
);

provideFieldIdsContext(select.fieldIds.context);
provideFieldErrorContext({ validation: state.displayValidation });

provideSelectContext({
  placeholder,
  select,
  selectedItems: state.selectedItems as never,
  selectedText,
  slots: styles,
  state: state as UseSelectStateReturn<unknown>,
});

/**
 * The listbox in the popover runs on this select's state rather than one of its own.
 *
 * That is the whole arrangement: the select owns the collection because it has to answer for the
 * options while the popover does not exist, and the listbox borrows it when it appears.
 */
provideListBoxStateContext({
  autoFocus: () => state.focusStrategy.value ?? true,
  collection: state.collection,
  labelledBy: () => select.labelledBy.value,
  listId: () => select.listId.value,
  selection: state.selection,
  // The pointer and the keyboard drive the same single choice here, so the highlight follows
  // the mouse.
  shouldFocusOnHover: true,
});

provideOverlayTargetContext({
  autoFocus: computed(() => state.focusStrategy.value ?? true),
  closeAll: state.close,
  isNonModal: false,
  labelledBy: select.labelledBy,
  overlayId: select.listId,
  placement: "bottom start",
  state,
  trigger: "Select",
  triggerElement: select.triggerElement,
});

// The trigger is whatever pressable sits inside, which is why the behaviour is handed down.
providePressResponder(select.responder);
</script>

<template>
  <div
    :class="styles.base({ class: props.class })"
    :data-disabled="dataAttr(props.isDisabled)"
    :data-focused="dataAttr(state.isFocused.value)"
    :data-invalid="dataAttr(select.isInvalid.value)"
    :data-open="dataAttr(state.isOpen.value)"
    :data-required="dataAttr(props.isRequired)"
    data-slot="select"
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
