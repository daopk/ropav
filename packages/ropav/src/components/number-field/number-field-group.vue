<script setup lang="ts" vapor>
import type { NumberFieldGroupProps, NumberFieldGroupSlotProps } from "./number-field.types";

import { computed } from "vue";

import { useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";

import { useNumberFieldContext } from "./number-field.context";

const props = defineProps<NumberFieldGroupProps>();

defineSlots<{ default?: (props: NumberFieldGroupSlotProps) => unknown }>();

const { field, slots } = useNumberFieldContext();

const styles = computed(() => slots.value.group({ class: props.class }));

// Hover is read off this one only; press has no meaning for a shell around a control. The
// stylesheet suppresses the hover fill while focus is inside, so the two have to be reported
// together or a group that is both hovered and focused keeps the hover fill.
const interaction = useInteractionStates({ isDisabled: field.isDisabled });
</script>

<template>
  <div
    :class="styles"
    :data-disabled="dataAttr(field.isDisabled.value)"
    :data-focus-within="dataAttr(field.isFocusWithin.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-invalid="dataAttr(field.isInvalid.value)"
    data-slot="number-field-group"
    v-bind="field.groupAttrs.value"
    @focusin="field.onFocusin"
    @focusout="field.onFocusout"
    @pointerenter="interaction.onPointerenter"
    @pointerleave="interaction.onPointerleave"
  >
    <slot
      :is-disabled="field.isDisabled.value"
      :is-focus-within="field.isFocusWithin.value"
      :is-hovered="interaction.isHovered.value"
      :is-invalid="field.isInvalid.value"
    />
  </div>
</template>
