<script setup lang="ts" vapor>
import type { CheckboxGroupRootProps, CheckboxGroupSlotProps } from "./checkbox-group.types";

import { checkboxGroupVariants } from "@ropav/styles";
import { computed } from "vue";

import { useCheckboxGroupState } from "../../composables/use-checkbox-group-state";
import { provideFieldIdsContext, useFieldIds } from "../../composables/use-field-ids";
import { dataAttr } from "../../utils/assertion";
import { provideFieldErrorContext } from "../field-error";
import { useFieldsetContext } from "../fieldset/fieldset.context";

import { provideCheckboxGroupContext } from "./checkbox-group.context";

// `isInvalid` declares an explicit `undefined` default because it is a three-state prop:
// absent means "no claim", while `false` is a standing claim that the group is valid, which
// would shadow `validate`, the browser's verdict and any server error alike.
const props = withDefaults(defineProps<CheckboxGroupRootProps>(), {
  isDisabled: undefined,
  isInvalid: undefined,
});

const fieldset = useFieldsetContext();

// The group renders as a `<div>`, which `<fieldset disabled>` does not reach, so the state has
// to be told outright.
const fieldsetIsDisabled = computed(() => props.isDisabled ?? fieldset?.isDisabled.value);

const emit = defineEmits<{
  change: [value: string[]];
  "update:value": [value: string[]];
}>();

defineSlots<{ default?: (props: CheckboxGroupSlotProps) => unknown }>();

const state = useCheckboxGroupState({
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

const styles = computed(() =>
  checkboxGroupVariants({ class: props.class, variant: props.variant }),
);

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

// Validation belongs to the group, so the group's own `FieldError` is the one that speaks.
provideFieldErrorContext({ validation: state.validation.displayValidation });

const resolvedAriaLabelledby = computed(() => {
  const ids = [labelId.value, props.ariaLabelledby].filter(Boolean);

  return ids.length > 0 ? ids.join(" ") : undefined;
});

const resolvedDescribedBy = computed(() => {
  const ids = [describedBy.value, props.ariaDescribedby].filter(Boolean);

  return ids.length > 0 ? ids.join(" ") : undefined;
});

// What each item points `aria-describedby` at. The error comes first, matching React, and is
// only referenced while the group actually has one to show.
const itemDescribedBy = computed(() => {
  const ids = [
    state.isInvalid.value ? errorMessageId.value : undefined,
    descriptionId.value,
  ].filter(Boolean);

  return ids.length > 0 ? ids.join(" ") : undefined;
});

provideCheckboxGroupContext({
  describedBy: itemDescribedBy,
  form: computed(() => props.form),
  name: computed(() => props.name),
  state,
  variant: computed(() => props.variant),
});

const resolvedIsDisabled = computed(() => state.isDisabled.value);
const resolvedIsRequired = computed(() => Boolean(props.isRequired));
</script>

<template>
  <div
    :aria-describedby="resolvedDescribedBy"
    :aria-disabled="resolvedIsDisabled || undefined"
    :aria-label="props.ariaLabel"
    :aria-labelledby="resolvedAriaLabelledby"
    :class="styles"
    :data-disabled="dataAttr(resolvedIsDisabled)"
    :data-invalid="dataAttr(state.isInvalid.value)"
    :data-readonly="dataAttr(state.isReadOnly.value)"
    :data-required="dataAttr(resolvedIsRequired)"
    data-slot="checkbox-group"
    role="group"
  >
    <slot
      :is-disabled="state.isDisabled.value"
      :is-invalid="state.isInvalid.value"
      :is-read-only="state.isReadOnly.value"
      :is-required="resolvedIsRequired"
      :value="state.value.value"
    />
  </div>
</template>
