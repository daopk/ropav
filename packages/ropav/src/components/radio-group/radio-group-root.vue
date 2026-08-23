<script setup lang="ts" vapor>
import type {RadioGroupRootProps, RadioGroupSlotProps} from "./radio-group.types";

import {radioGroupVariants} from "@heroui/styles";
import {computed, shallowRef} from "vue";

import {provideFieldIdsContext, useFieldIds} from "../../composables/use-field-ids";
import {useLocale} from "../../composables/use-locale";
import {useRadioGroupState} from "../../composables/use-radio-group-state";
import {dataAttr} from "../../utils/assertion";
import {provideFieldErrorContext} from "../field-error";
import {useFieldsetContext} from "../fieldset/fieldset.context";

import {provideRadioGroupContext} from "./radio-group.context";

// `isInvalid` declares an explicit `undefined` default because it is a three-state prop:
// absent means "no claim", while `false` is a standing claim that the group is valid, which
// would shadow `validate`, the browser's verdict and any server error alike.
const props = withDefaults(defineProps<RadioGroupRootProps>(), {
  isDisabled: undefined,
  isInvalid: undefined,
});

const fieldset = useFieldsetContext();

// The group renders as a `<div>`, which `<fieldset disabled>` does not reach, so the state has
// to be told outright.
const fieldsetIsDisabled = computed(() => props.isDisabled ?? fieldset?.isDisabled.value);

const emit = defineEmits<{
  change: [value: string | null];
  "update:value": [value: string | null];
}>();

defineSlots<{default?: (props: RadioGroupSlotProps) => unknown}>();

const state = useRadioGroupState({
  defaultValue: () => props.defaultValue,
  isDisabled: () => fieldsetIsDisabled.value,
  isInvalid: () => props.isInvalid,
  isReadOnly: () => props.isReadOnly,
  isRequired: () => props.isRequired,
  name: () => props.name,
  onValueChange: (value) => {
    emit("change", value);
    emit("update:value", value);
  },
  validate: () => props.validate,
  validationBehavior: () => props.validationBehavior,
  value: () => props.value,
});

const styles = computed(() => radioGroupVariants({class: props.class, variant: props.variant}));

const resolvedOrientation = computed(() => props.orientation ?? "vertical");
const locale = useLocale();

// A `<label>` implies a labelable control to point at, and a group is not one, so its label
// renders as a `span` the group names itself after.
const {
  context: fieldIds,
  describedBy,
  descriptionId,
  errorMessageId,
  labelId,
} = useFieldIds({
  labelElementType: "span",
  slots: ["label", "description", "errorMessage"],
});

provideFieldIdsContext(fieldIds);

// A radio has no validity of its own, so the group's `FieldError` is the only one that
// speaks — including one a caller nests inside a radio.
provideFieldErrorContext({validation: state.validation.displayValidation});

const resolvedAriaLabelledby = computed(() => {
  const ids = [labelId.value, props.ariaLabelledby].filter(Boolean);

  return ids.length > 0 ? ids.join(" ") : undefined;
});

const resolvedDescribedBy = computed(() => {
  const ids = [describedBy.value, props.ariaDescribedby].filter(Boolean);

  return ids.length > 0 ? ids.join(" ") : undefined;
});

// What each radio points `aria-describedby` at. The error comes first, matching React, and
// is only referenced while the group actually has one to show.
const itemDescribedBy = computed(() => {
  const ids = [
    state.isInvalid.value ? errorMessageId.value : undefined,
    descriptionId.value,
  ].filter(Boolean);

  return ids.length > 0 ? ids.join(" ") : undefined;
});

provideRadioGroupContext({
  describedBy: itemDescribedBy,
  form: computed(() => props.form),
  state,
});

const groupEl = shallowRef<HTMLElement | null>(null);

const setGroupEl = (element: unknown) => {
  groupEl.value = element instanceof HTMLElement ? element : null;
};

/** Radios the arrow keys can land on, in document order. */
const focusableRadios = () => {
  if (!groupEl.value) return [];

  return Array.from(groupEl.value.querySelectorAll<HTMLInputElement>('input[type="radio"]')).filter(
    (radio) => !radio.disabled,
  );
};

// Arrow keys move focus *and* selection, wrapping at both ends, which is the radio group
// keyboard model. The browser does this for named radios on its own, but only in a way that
// ignores `isReadOnly` — so it is done here and the native handling is suppressed, rather
// than letting the two run and move focus twice.
//
// Left and right follow the reading direction, and only they do: up and down are always
// previous and next, and a vertical group keeps left/right unflipped as well, because there
// the arrows no longer point along the row.
const onKeydown = (event: KeyboardEvent) => {
  const isHorizontalFlip =
    locale.value.direction === "rtl" && resolvedOrientation.value !== "vertical";
  const isNext =
    event.key === "ArrowDown" || event.key === (isHorizontalFlip ? "ArrowLeft" : "ArrowRight");
  const isPrevious =
    event.key === "ArrowUp" || event.key === (isHorizontalFlip ? "ArrowRight" : "ArrowLeft");

  if (!isNext && !isPrevious) return;
  if (state.isDisabled.value || state.isReadOnly.value) return;

  const radios = focusableRadios();

  if (radios.length === 0) return;

  const current = radios.indexOf(document.activeElement as HTMLInputElement);

  if (current === -1) return;

  event.preventDefault();

  const step = isNext ? 1 : -1;
  const next = radios[(current + step + radios.length) % radios.length]!;

  next.focus();
  state.setSelectedValue(next.value);
};
</script>

<template>
  <div
    :ref="setGroupEl"
    :aria-describedby="resolvedDescribedBy"
    :aria-disabled="state.isDisabled.value || undefined"
    :aria-invalid="state.isInvalid.value || undefined"
    :aria-label="props.ariaLabel"
    :aria-labelledby="resolvedAriaLabelledby"
    :aria-orientation="resolvedOrientation"
    :aria-readonly="state.isReadOnly.value || undefined"
    :aria-required="state.isRequired.value || undefined"
    :class="styles"
    :data-disabled="dataAttr(state.isDisabled.value)"
    :data-invalid="dataAttr(state.isInvalid.value)"
    :data-orientation="resolvedOrientation"
    :data-readonly="dataAttr(state.isReadOnly.value)"
    :data-required="dataAttr(state.isRequired.value)"
    data-slot="radio-group"
    role="radiogroup"
    @keydown="onKeydown"
  >
    <slot
      :is-disabled="state.isDisabled.value"
      :is-invalid="state.isInvalid.value"
      :is-read-only="state.isReadOnly.value"
      :is-required="state.isRequired.value"
      :selected-value="state.selectedValue.value"
    />
  </div>
</template>
