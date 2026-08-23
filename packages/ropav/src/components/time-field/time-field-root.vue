<script setup lang="ts" vapor>
import type { TimeValue } from "../../utils/date-format";
import type { DateFieldControl } from "../date-input-group";
import type { TimeFieldRootProps, TimeFieldRootSlotProps } from "./time-field.types";

import { timeFieldVariants } from "@ropav/styles";
import { computed, shallowRef } from "vue";

import { useTimeField } from "../../composables/use-date-field";
import { provideFieldIdsContext } from "../../composables/use-field-ids";
import { useTimeFieldState } from "../../composables/use-time-field-state";
import { dataAttr } from "../../utils/assertion";
import {
  provideDateFieldControlContext,
  provideDateInputGroupOwnerContext,
} from "../date-input-group";
import { provideFieldErrorContext } from "../field-error";

/*
 * Every three-state prop declares an explicit `undefined` default. Vue casts an absent boolean to
 * `false`, and a `false` here reads as the caller claiming that state: for `isInvalid` in
 * particular it would pin the field valid and turn the whole validation layer into dead code.
 */
const props = withDefaults(defineProps<TimeFieldRootProps>(), {
  autoFocus: undefined,
  fullWidth: undefined,
  hideTimeZone: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  shouldForceLeadingZeros: undefined,
});

const emit = defineEmits<{
  change: [value: TimeValue | null];
  "update:value": [value: TimeValue | null];
  focusChange: [isFocused: boolean];
}>();

defineSlots<{ default?: (props: TimeFieldRootSlotProps) => unknown }>();

const element = shallowRef<HTMLElement | null>(null);
const inputElement = shallowRef<HTMLInputElement | null>(null);

const state = useTimeFieldState({
  defaultValue: () => props.defaultValue,
  granularity: () => props.granularity,
  hideTimeZone: () => props.hideTimeZone,
  hourCycle: () => props.hourCycle,
  isDisabled: () => props.isDisabled,
  isInvalid: () => props.isInvalid,
  isReadOnly: () => props.isReadOnly,
  isRequired: () => props.isRequired,
  locale: () => props.locale,
  maxValue: () => props.maxValue,
  minValue: () => props.minValue,
  name: () => props.name,
  onChange: (value) => {
    emit("change", value);
    emit("update:value", value);
  },
  placeholderValue: () => props.placeholderValue,
  shouldForceLeadingZeros: () => props.shouldForceLeadingZeros,
  validate: props.validate,
  validationBehavior: () => props.validationBehavior,
  value: () => props.value,
});

const field = useTimeField({
  ariaDescribedBy: () => props.ariaDescribedby,
  ariaLabel: () => props.ariaLabel,
  ariaLabelledBy: () => props.ariaLabelledby,
  autoFocus: () => props.autoFocus,
  element,
  form: () => props.form,
  id: () => props.id,
  inputElement,
  isDisabled: () => props.isDisabled,
  isRequired: () => props.isRequired,
  name: () => props.name,
  onFocusChange: (isFocused) => emit("focusChange", isFocused),
  state,
});

provideFieldIdsContext(field.fieldIds);

/*
 * Wrapped in a `resolve` that ignores the slot: a field owns one value, so every part
 * inside it edits the same one however it asks.
 */
const control: DateFieldControl = {
  field,
  setElement: (next) => {
    element.value = next;
  },
  setInputElement: (next) => {
    inputElement.value = next;
  },
  state,
};

provideDateFieldControlContext({ resolve: () => control });

/*
 * The group around the segments is the field's, so it shows the field's state without being told.
 * Everything that names it is deliberately left out: react-aria-components hands the same props to
 * the group and to the row of segments inside it, so both end up with one id between them, and the
 * name is announced twice for two nested groups. Here only the inner one carries them.
 */
provideDateInputGroupOwnerContext({
  attrs: computed(() => ({ "aria-disabled": state.isDisabled.value || undefined })),
  handlers: {
    ...field.handlers,
    onFocusin: field.onFocusin,
    onFocusout: field.onFocusout,
    onKeydown: field.onKeydown,
  },
  isDisabled: state.isDisabled,
  isInvalid: field.isInvalid,
  // Nothing above needs it: the field's own element is the row of segments, which reports itself.
  setElement: () => {},
});
provideFieldErrorContext({ validation: state.displayValidation });

const styles = computed(() =>
  timeFieldVariants({ class: props.class, fullWidth: props.fullWidth }),
);
</script>

<template>
  <div
    :class="styles"
    :data-disabled="dataAttr(state.isDisabled.value)"
    :data-invalid="dataAttr(field.isInvalid.value)"
    :data-readonly="dataAttr(state.isReadOnly.value)"
    :data-required="dataAttr(state.isRequired.value)"
    data-slot="time-field"
  >
    <slot
      :is-disabled="state.isDisabled.value"
      :is-invalid="field.isInvalid.value"
      :is-read-only="state.isReadOnly.value"
      :is-required="state.isRequired.value"
    />
  </div>
</template>
