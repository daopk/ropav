<script setup lang="ts" vapor>
import type {RadioRootProps, RadioSlotProps} from "./radio.types";

import {radioVariants} from "@heroui/styles";
import {computed} from "vue";

import {provideFieldIdsContext, useFieldIds} from "../../composables/use-field-ids";
import {dataAttr} from "../../utils/assertion";
import {useRadioGroupContext} from "../radio-group/radio-group.context";

import {provideRadioContext} from "./radio.context";

const props = defineProps<RadioRootProps>();

defineSlots<{default?: (props: RadioSlotProps) => unknown}>();

const {describedBy: groupDescribedBy, form, state} = useRadioGroupContext();

const styles = computed(() => radioVariants());

const isSelected = computed(() => state.selectedValue.value === props.value);
const isDisabled = computed(() => Boolean(props.isDisabled) || state.isDisabled.value);

const {context: fieldIds, describedBy} = useFieldIds({slots: ["description"]});

provideFieldIdsContext(fieldIds);

// This radio's own help text first, then the group's, then whatever the caller added.
const resolvedDescribedBy = computed(() => {
  const ids = [describedBy.value, groupDescribedBy.value, props.ariaDescribedby].filter(Boolean);

  return ids.length > 0 ? ids.join(" ") : undefined;
});

// The group is one tab stop. The selected radio holds it; with nothing selected it falls to
// whichever radio focus last rested on, or to any of them before focus has been anywhere.
// A disabled radio takes no `tabindex` at all rather than `-1`, matching React.
const tabIndex = computed(() => {
  if (isDisabled.value) return undefined;

  if (state.selectedValue.value != null) return isSelected.value ? 0 : -1;

  const lastFocused = state.lastFocusedValue.value;

  return lastFocused === props.value || lastFocused == null ? 0 : -1;
});

provideRadioContext({
  ariaLabel: computed(() => props.ariaLabel),
  ariaLabelledby: computed(() => props.ariaLabelledby),
  describedBy: resolvedDescribedBy,
  form,
  id: computed(() => props.id),
  isDisabled,
  isInvalid: state.isInvalid,
  isReadOnly: state.isReadOnly,
  isRequired: state.isRequired,
  isSelected,
  name: state.name,
  onFocus: () => state.setLastFocusedValue(props.value),
  select: () => state.setSelectedValue(props.value),
  slots: styles,
  tabIndex,
  value: computed(() => props.value),
});
</script>

<template>
  <div
    :class="styles.base({class: props.class})"
    :data-disabled="dataAttr(isDisabled)"
    :data-invalid="dataAttr(state.isInvalid.value)"
    :data-readonly="dataAttr(state.isReadOnly.value)"
    :data-required="dataAttr(state.isRequired.value)"
    :data-selected="dataAttr(isSelected)"
    data-slot="radio"
  >
    <slot
      :is-disabled="isDisabled"
      :is-invalid="state.isInvalid.value"
      :is-read-only="state.isReadOnly.value"
      :is-required="state.isRequired.value"
      :is-selected="isSelected"
    />
  </div>
</template>
