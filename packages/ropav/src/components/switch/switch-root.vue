<script setup lang="ts" vapor>
import type {SwitchRootProps, SwitchSlotProps} from "./switch.types";

import {switchVariants} from "@heroui/styles";
import {computed} from "vue";

import {useControllableState} from "../../composables/use-controllable-state";
import {provideFieldIdsContext, useFieldIds} from "../../composables/use-field-ids";
import {useFormValidationState} from "../../composables/use-form-validation-state";
import {dataAttr} from "../../utils/assertion";
import {provideFieldErrorContext} from "../field-error";

import {provideSwitchContext} from "./switch.context";

// Both declare an explicit `undefined` default, because for both of them `undefined` means
// something a cast `false` would destroy. Vue turns an absent boolean prop into `false`,
// which reads as "the caller set false".
//
// For `isSelected` that pins the switch permanently off, ignoring `defaultSelected` and
// every click. For `isInvalid` it is a standing claim that the switch is valid, which
// shadows `validate`, the browser's own verdict and any server error — the whole validation
// layer would go quiet.
const props = withDefaults(defineProps<SwitchRootProps>(), {
  isInvalid: undefined,
  isSelected: undefined,
});

const emit = defineEmits<{
  change: [isSelected: boolean];
  "update:isSelected": [isSelected: boolean];
}>();

defineSlots<{default?: (props: SwitchSlotProps) => unknown}>();

const {setState, state} = useControllableState<boolean>({
  defaultValue: props.defaultSelected ?? false,
  onValueChange: (isSelected) => {
    emit("change", isSelected);
    emit("update:isSelected", isSelected);
  },
  value: () => props.isSelected,
});

const styles = computed(() => switchVariants({size: props.size}));

const validation = useFormValidationState<boolean>({
  isInvalid: () => props.isInvalid,
  name: () => props.name,
  validate: () => props.validate,
  validationBehavior: () => props.validationBehavior,
  value: () => state.value,
});

// A `FieldError` nested in the switch reads its message from here.
provideFieldErrorContext({validation: validation.displayValidation});

// Help text nested in the field claims its own id, and the hidden input points
// `aria-describedby` at whichever ids were actually claimed.
const {context: fieldIds, describedBy} = useFieldIds({slots: ["description", "errorMessage"]});

provideFieldIdsContext(fieldIds);

// The labelling attributes belong on the hidden input, which is the switch as far as
// assistive technology is concerned — left on the wrapper they would name a plain `div` and
// leave the switch itself nameless.
const resolvedDescribedBy = computed(() => {
  const ids = [describedBy.value, props.ariaDescribedby].filter(Boolean);

  return ids.length > 0 ? ids.join(" ") : undefined;
});

// Named apart from the props they resolve: a binding that shadows a prop name is easy to
// misread, and the value here is state rather than the prop it merges with.
const resolvedIsSelected = computed(() => state.value);
const resolvedIsDisabled = computed(() => Boolean(props.isDisabled));
const resolvedIsReadOnly = computed(() => Boolean(props.isReadOnly));
// Read off the displayed validation rather than the prop, so a `validate` failure or the
// browser's own verdict styles the switch exactly as `isInvalid` does — and, under native
// behaviour, only once the switch has committed.
const resolvedIsInvalid = computed(() => validation.displayValidation.value.isInvalid);
const resolvedIsRequired = computed(() => Boolean(props.isRequired));

provideSwitchContext({
  ariaLabel: computed(() => props.ariaLabel),
  ariaLabelledby: computed(() => props.ariaLabelledby),
  defaultSelected: computed(() => props.defaultSelected ?? false),
  describedBy: resolvedDescribedBy,
  form: computed(() => props.form),
  isDisabled: resolvedIsDisabled,
  isInvalid: resolvedIsInvalid,
  isReadOnly: resolvedIsReadOnly,
  isRequired: resolvedIsRequired,
  id: computed(() => props.id),
  isSelected: resolvedIsSelected,
  name: computed(() => props.name),
  validation,
  setSelected: setState,
  slots: styles,
  value: computed(() => props.value),
});
</script>

<template>
  <div
    :class="styles.base({class: props.class})"
    :data-disabled="dataAttr(resolvedIsDisabled)"
    :data-invalid="dataAttr(resolvedIsInvalid)"
    :data-readonly="dataAttr(resolvedIsReadOnly)"
    :data-required="dataAttr(resolvedIsRequired)"
    :data-selected="dataAttr(resolvedIsSelected)"
    data-slot="switch"
  >
    <slot
      :is-disabled="resolvedIsDisabled"
      :is-invalid="resolvedIsInvalid"
      :is-read-only="resolvedIsReadOnly"
      :is-required="resolvedIsRequired"
      :is-selected="resolvedIsSelected"
    />
  </div>
</template>
