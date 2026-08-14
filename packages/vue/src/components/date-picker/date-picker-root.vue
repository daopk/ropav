<script setup lang="ts" vapor>
import type {DatePickerRootProps, DatePickerRootSlotProps} from "./date-picker.types";
import type {DateFieldControl} from "../date-input-group";
import type {DateValue} from "@internationalized/date";

import {datePickerVariants} from "@heroui/styles";
import {createCalendar as defaultCreateCalendar} from "@internationalized/date";
import {computed, onScopeDispose, shallowRef, watch} from "vue";

import {useDateField} from "../../composables/use-date-field";
import {useDateFieldState} from "../../composables/use-date-field-state";
import {useDatePicker} from "../../composables/use-date-picker";
import {useDatePickerState} from "../../composables/use-date-picker-state";
import {provideFieldIdsContext} from "../../composables/use-field-ids";
import {useFocusWithin} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";
import {provideCalendarOwnerContext} from "../calendar";
import {
  provideDateFieldControlContext,
  provideDateInputGroupOwnerContext,
} from "../date-input-group";
import DateInputGroupHiddenInput from "../date-input-group/date-input-group-hidden-input.vue";
import {provideFieldErrorContext} from "../field-error";
import {provideOverlayTargetContext} from "../overlay";

import {provideDatePickerContext} from "./date-picker.context";

/*
 * Every three-state prop declares an explicit `undefined` default. Vue casts an absent boolean to
 * `false`, and a `false` here reads as the caller claiming that state: for `isInvalid` in
 * particular it would pin the picker valid and turn the whole validation layer into dead code.
 */
const props = withDefaults(defineProps<DatePickerRootProps>(), {
  autoFocus: undefined,
  hideTimeZone: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isOpen: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  shouldCloseOnSelect: undefined,
  shouldForceLeadingZeros: undefined,
});

const emit = defineEmits<{
  change: [value: DateValue | null];
  "update:value": [value: DateValue | null];
  openChange: [isOpen: boolean];
  "update:isOpen": [isOpen: boolean];
  focusChange: [isFocused: boolean];
}>();

defineSlots<{default?: (props: DatePickerRootSlotProps) => unknown}>();

const state = useDatePickerState({
  defaultOpen: props.defaultOpen,
  defaultValue: () => props.defaultValue,
  granularity: () => props.granularity,
  hideTimeZone: () => props.hideTimeZone,
  hourCycle: () => props.hourCycle,
  isDateUnavailable: props.isDateUnavailable,
  isInvalid: () => props.isInvalid,
  isOpen: () => props.isOpen,
  maxValue: () => props.maxValue,
  minValue: () => props.minValue,
  name: () => props.name,
  onChange: (value) => {
    emit("change", value);
    emit("update:value", value);
  },
  onOpenChange: (isOpen) => {
    emit("openChange", isOpen);
    emit("update:isOpen", isOpen);
  },
  placeholderValue: () => props.placeholderValue,
  shouldCloseOnSelect: () => props.shouldCloseOnSelect,
  shouldForceLeadingZeros: () => props.shouldForceLeadingZeros,
  validate: props.validate,
  validationBehavior: () => props.validationBehavior,
  value: () => props.value,
});

/**
 * The group around the segments and the trigger, rendered by a part further down.
 *
 * It is the picker's element rather than the field's: what its popover is positioned against, what
 * carries its name, and what a click beside the segments is answered by.
 */
const groupElement = shallowRef<HTMLElement | null>(null);

const picker = useDatePicker(
  {
    ariaDescribedby: () => props.ariaDescribedby,
    ariaLabel: () => props.ariaLabel,
    ariaLabelledby: () => props.ariaLabelledby,
    element: groupElement,
    firstDayOfWeek: () => props.firstDayOfWeek,
    id: () => props.id,
    isDateUnavailable: props.isDateUnavailable,
    isDisabled: () => props.isDisabled,
    isReadOnly: () => props.isReadOnly,
    maxValue: () => props.maxValue,
    minValue: () => props.minValue,
    onFocusChange: (isFocused) => emit("focusChange", isFocused),
    pageBehavior: () => props.pageBehavior,
    placeholderValue: () => props.placeholderValue,
  },
  state,
);

/*
 * The field inside the picker, built here because there is no field root above the segments: the
 * markup puts `Input` and `Segment` straight inside the picker. It holds no opinion of its own
 * about the value — the picker's bounds are deliberately not passed on, and the picker's validation
 * state is, so the two can never reach different verdicts about the same date.
 */
const inputGroupElement = shallowRef<HTMLElement | null>(null);
const inputElement = shallowRef<HTMLInputElement | null>(null);

const fieldState = useDateFieldState({
  createCalendar: (identifier) => (props.createCalendar ?? defaultCreateCalendar)(identifier),
  granularity: () => props.granularity,
  hideTimeZone: () => props.hideTimeZone,
  hourCycle: () => props.hourCycle,
  isDisabled: () => props.isDisabled,
  isReadOnly: () => props.isReadOnly,
  isRequired: () => props.isRequired,
  locale: () => props.locale,
  name: () => props.name,
  onChange: (value) => state.setValue(value),
  placeholderValue: () => props.placeholderValue,
  shouldForceLeadingZeros: () => props.shouldForceLeadingZeros,
  validationBehavior: () => props.validationBehavior,
  validationState: state,
  value: () => state.value.value,
});

const field = useDateField({
  ariaDescribedBy: picker.field.ariaDescribedBy,
  autoFocus: () => props.autoFocus,
  element: inputGroupElement,
  focusManager: picker.field.focusManager,
  form: () => props.form,
  id: picker.field.id,
  inputElement,
  isDisabled: () => props.isDisabled,
  isRequired: () => props.isRequired,
  name: () => props.name,
  role: picker.field.role,
  state: fieldState,
});

const control: DateFieldControl = {
  field,
  setElement: (next) => {
    inputGroupElement.value = next;
  },
  setInputElement: (next) => {
    inputElement.value = next;
  },
  state: fieldState,
};

const slots = computed(() => datePickerVariants());
const styles = computed(() => slots.value.base({class: props.class}));

const triggerElement = shallowRef<HTMLElement | null>(null);

/**
 * Whether closing the popover should hand focus back to the trigger.
 *
 * Only after a key was pressed while it was open: a pointer user has already moved on and would be
 * surprised to have focus yanked back, while a keyboard user has nowhere else to be.
 */
let shouldRestoreFocus = false;

const onWindowKeydown = (event: KeyboardEvent) => {
  if (!event.metaKey && !event.ctrlKey && !event.altKey) shouldRestoreFocus = true;
};

/*
 * Capture phase, so a key handled and stopped inside the popover is still seen. Attached only while
 * the popover is open, which is also what keeps the flag from surviving into the next opening.
 */
watch(
  () => state.isOpen.value,
  (isOpen, wasOpen) => {
    if (isOpen) {
      window.addEventListener("keydown", onWindowKeydown, true);

      return;
    }

    window.removeEventListener("keydown", onWindowKeydown, true);

    if (wasOpen && shouldRestoreFocus) {
      // After the popover has gone, or focus would land on the trigger and then be taken away by
      // the overlay unwinding its own focus containment.
      requestAnimationFrame(() => triggerElement.value?.focus());
    }

    shouldRestoreFocus = false;
  },
);

onScopeDispose(() => window.removeEventListener("keydown", onWindowKeydown, true));

// Read off the root itself, as React does, and separate from the focus tracking on the group: this
// one is what the stylesheet keys the ring on.
const focusWithin = useFocusWithin();

const slotProps = computed<DatePickerRootSlotProps>(() => ({
  isDisabled: props.isDisabled ?? false,
  isInvalid: state.isInvalid.value,
  isOpen: state.isOpen.value,
  isReadOnly: props.isReadOnly ?? false,
  isRequired: props.isRequired ?? false,
}));

provideDatePickerContext({
  isOpen: state.isOpen,
  isTriggerDisabled: picker.isTriggerDisabled,
  onTriggerPress: picker.onTriggerPress,
  setTriggerElement: (next) => {
    triggerElement.value = next;
  },
  slots,
  triggerAttrs: picker.triggerAttrs,
});

provideFieldIdsContext(picker.fieldIds);
provideDateFieldControlContext({resolve: () => control});
provideDateInputGroupOwnerContext({
  attrs: picker.groupAttrs,
  handlers: picker.groupHandlers,
  isInvalid: state.isInvalid,
  setElement: (next) => {
    groupElement.value = next;
  },
});
provideFieldErrorContext({validation: state.displayValidation});
provideCalendarOwnerContext({props: picker.calendarProps});

provideOverlayTargetContext({
  // A dialog has no direction to carry into it, and the calendar inside takes focus itself.
  autoFocus: computed(() => false),
  closeAll: state.close,
  dialogId: computed(() => picker.dialogAttrs.value["id"] as string | undefined),
  isNonModal: false,
  labelledBy: computed(() => picker.dialogAttrs.value["aria-labelledby"] as string | undefined),
  // The popover is anchored to the whole group, not to the button inside it.
  overlayId: computed(() => picker.dialogAttrs.value["id"] as string),
  placement: "bottom start",
  state,
  trigger: "DatePicker",
  triggerElement: computed(() => groupElement.value),
});
</script>

<template>
  <div
    :class="styles"
    :data-disabled="dataAttr(props.isDisabled)"
    :data-focus-visible="dataAttr(focusWithin.isFocusVisible.value)"
    :data-focus-within="dataAttr(focusWithin.isFocusWithin.value)"
    :data-invalid="dataAttr(state.isInvalid.value)"
    :data-open="dataAttr(state.isOpen.value)"
    :data-readonly="dataAttr(props.isReadOnly)"
    :data-required="dataAttr(props.isRequired)"
    data-slot="date-picker"
    @focusin="focusWithin.onFocusin"
    @focusout="focusWithin.onFocusout"
  >
    <slot v-bind="slotProps" />
  </div>
  <DateInputGroupHiddenInput :autocomplete="props.autoComplete" :name="props.name" />
</template>
