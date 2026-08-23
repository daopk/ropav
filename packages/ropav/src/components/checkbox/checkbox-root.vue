<script setup lang="ts" vapor>
import type { CheckboxRootProps, CheckboxSlotProps } from "./checkbox.types";

import { checkboxVariants } from "@ropav/styles";
import { computed } from "vue";

import { useControllableState } from "../../composables/use-controllable-state";
import { provideFieldIdsContext, useFieldIds } from "../../composables/use-field-ids";
import { useFormValidationState } from "../../composables/use-form-validation-state";
import { dataAttr } from "../../utils/assertion";
import { useCheckboxGroupContext } from "../checkbox-group/checkbox-group.context";
import { provideFieldErrorContext } from "../field-error";

import { provideCheckboxContext } from "./checkbox.context";

// Every prop that merges with a surrounding group declares an explicit `undefined` default.
// Vue casts an absent boolean prop to `false`, which reads as "the caller set false" — so
// `props.x ?? group.x` would never reach the group, and a caller could not override with
// `:is-disabled="false"` either. `isSelected` and `isInvalid` need it for a second reason:
// `undefined` is what marks them as unclaimed, and a cast `false` pins the checkbox off, or
// pins it valid and silences the whole validation layer.
const props = withDefaults(defineProps<CheckboxRootProps>(), {
  isDisabled: undefined,
  isIndeterminate: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  isSelected: undefined,
  variant: undefined,
});

const emit = defineEmits<{
  change: [isSelected: boolean];
  "update:isSelected": [isSelected: boolean];
}>();

defineSlots<{ default?: (props: CheckboxSlotProps) => unknown }>();

// Vue has no rules-of-hooks, so this reads as a plain branch: inside a group the checkbox
// contributes a value to the group's selection, on its own it owns a boolean.
const group = useCheckboxGroupContext();

const resolvedValue = computed(() => props.value ?? "on");

const own = useControllableState<boolean>({
  defaultValue: props.defaultSelected ?? false,
  onValueChange: (isSelected) => {
    emit("change", isSelected);
    emit("update:isSelected", isSelected);
  },
  value: () => props.isSelected,
});

const isSelected = computed(() =>
  group ? group.state.isSelected(resolvedValue.value) : own.state.value,
);

const setSelected = (next: boolean) => {
  if (!group) {
    own.setState(next);

    return;
  }

  group.state.toggleValue(resolvedValue.value, next);
  emit("change", next);
  emit("update:isSelected", next);
};

const resolvedIsDisabled = computed(
  () => props.isDisabled ?? group?.state.isDisabled.value ?? false,
);
const resolvedIsReadOnly = computed(
  () => props.isReadOnly ?? group?.state.isReadOnly.value ?? false,
);
// The group's requiredness is the emulated one — true only while nothing is selected — since
// "at least one of these" is not something a single input can express.
const resolvedIsRequired = computed(
  () => props.isRequired ?? group?.state.isItemRequired.value ?? false,
);
const resolvedIsIndeterminate = computed(() => Boolean(props.isIndeterminate));

const resolvedVariant = computed(() => props.variant ?? group?.variant.value);

const styles = computed(() => checkboxVariants({ variant: resolvedVariant.value }));

// Inside a group, validation is the group's business: its state is what the items report to
// and what the group's own `FieldError` shows.
const ownValidation = useFormValidationState<boolean>({
  isInvalid: () => props.isInvalid,
  name: () => props.name,
  validate: () => props.validate,
  validationBehavior: () => props.validationBehavior,
  value: () => isSelected.value,
});

const validation = group ? group.state.itemValidation : ownValidation;

// A `FieldError` nested inside a checkbox that belongs to a group would repeat the group's
// message under every option, so the group keeps it and the item hands out nothing.
provideFieldErrorContext(group ? null : { validation: validation.displayValidation });

const { context: fieldIds, describedBy } = useFieldIds({ slots: ["description", "errorMessage"] });

provideFieldIdsContext(fieldIds);

// This checkbox's own help text first, then the group's, then whatever the caller added.
const resolvedDescribedBy = computed(() => {
  const ids = [describedBy.value, group?.describedBy.value, props.ariaDescribedby].filter(Boolean);

  return ids.length > 0 ? ids.join(" ") : undefined;
});

const resolvedIsInvalid = computed(() => validation.displayValidation.value.isInvalid);

const defaultSelected = computed(() =>
  group
    ? group.state.defaultValue.value.includes(resolvedValue.value)
    : (props.defaultSelected ?? false),
);

provideCheckboxContext({
  ariaLabel: computed(() => props.ariaLabel),
  ariaLabelledby: computed(() => props.ariaLabelledby),
  defaultSelected,
  describedBy: resolvedDescribedBy,
  form: computed(() => props.form ?? group?.form.value),
  id: computed(() => props.id),
  isDisabled: resolvedIsDisabled,
  isIndeterminate: resolvedIsIndeterminate,
  isInvalid: resolvedIsInvalid,
  isReadOnly: resolvedIsReadOnly,
  isRequired: resolvedIsRequired,
  isSelected,
  name: computed(() => props.name ?? group?.name.value),
  registerInput: group ? group.state.registerInput : null,
  setSelected,
  slots: styles,
  validation,
  value: resolvedValue,
});
</script>

<template>
  <div
    :class="styles.base({ class: props.class })"
    :data-disabled="dataAttr(resolvedIsDisabled)"
    :data-indeterminate="dataAttr(resolvedIsIndeterminate)"
    :data-invalid="dataAttr(resolvedIsInvalid)"
    :data-readonly="dataAttr(resolvedIsReadOnly)"
    :data-required="dataAttr(props.isRequired)"
    :data-selected="dataAttr(isSelected)"
    data-slot="checkbox"
  >
    <slot
      :is-disabled="resolvedIsDisabled"
      :is-indeterminate="resolvedIsIndeterminate"
      :is-invalid="resolvedIsInvalid"
      :is-read-only="resolvedIsReadOnly"
      :is-required="resolvedIsRequired"
      :is-selected="isSelected"
    />
  </div>
</template>
