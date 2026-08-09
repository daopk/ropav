<script setup lang="ts" vapor>
import type {DateInputGroupRootProps, DateInputGroupRootSlotProps} from "./date-input-group.types";

import {dateInputGroupVariants} from "@heroui/styles";
import {computed} from "vue";

import {useFocusWithin, useInteractionStates} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";

import {provideDateInputGroupContext} from "./date-input-group.context";

/*
 * Three-state props declare an explicit `undefined` default so they can still fall through to the
 * field. Cast to `false` they would read as the caller claiming that state, and the group could
 * never pick up the disabled or invalid state of the field it sits in.
 */
const props = withDefaults(defineProps<DateInputGroupRootProps>(), {
  fullWidth: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  variant: undefined,
});

defineSlots<{default?: (props: DateInputGroupRootSlotProps) => unknown}>();

const slots = computed(() =>
  dateInputGroupVariants({fullWidth: props.fullWidth, variant: props.variant}),
);

provideDateInputGroupContext({slots});

const styles = computed(() => slots.value.base({class: props.class}));

// Hover is read off this one only; press has no meaning for a shell around a control.
const interaction = useInteractionStates({isDisabled: () => props.isDisabled});
const focusWithin = useFocusWithin();
</script>

<template>
  <div
    :class="styles"
    :data-disabled="dataAttr(props.isDisabled)"
    :data-focus-visible="dataAttr(focusWithin.isFocusVisible.value)"
    :data-focus-within="dataAttr(focusWithin.isFocusWithin.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-invalid="dataAttr(props.isInvalid)"
    :data-readonly="dataAttr(props.isReadOnly)"
    data-slot="date-input-group"
    role="group"
    @focusin="focusWithin.onFocusin"
    @focusout="focusWithin.onFocusout"
    @pointerenter="interaction.onPointerenter"
    @pointerleave="interaction.onPointerleave"
  >
    <slot
      :is-disabled="Boolean(props.isDisabled)"
      :is-focus-visible="focusWithin.isFocusVisible.value"
      :is-focus-within="focusWithin.isFocusWithin.value"
      :is-hovered="interaction.isHovered.value"
      :is-invalid="Boolean(props.isInvalid)"
    />
  </div>
</template>
