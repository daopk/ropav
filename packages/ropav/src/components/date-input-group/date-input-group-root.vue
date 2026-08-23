<script setup lang="ts" vapor>
import type {
  DateInputGroupRootProps,
  DateInputGroupRootSlotProps,
} from "./date-input-group.types";

import { dateInputGroupVariants } from "@ropav/styles";
import { computed } from "vue";

import { useFocusWithin, useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";

import {
  provideDateInputGroupContext,
  useDateInputGroupOwnerContext,
} from "./date-input-group.context";

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

defineSlots<{ default?: (props: DateInputGroupRootSlotProps) => unknown }>();

const slots = computed(() =>
  dateInputGroupVariants({ fullWidth: props.fullWidth, variant: props.variant }),
);

provideDateInputGroupContext({ slots });

const styles = computed(() => slots.value.base({ class: props.class }));

/**
 * A picker above, when there is one, which owns this group rather than merely containing it.
 *
 * Absent for a plain field, and then everything below falls back to what this component knows on
 * its own.
 */
const owner = useDateInputGroupOwnerContext();

/*
 * The disabled and invalid states are the owner's when there is one: a picker holds the value and
 * the bounds, so it is the only thing that can judge them. A prop still wins, for markup that says
 * so outright.
 */
const isDisabled = computed(() => props.isDisabled ?? owner?.isDisabled.value);
const isInvalid = computed(() => props.isInvalid ?? owner?.isInvalid.value);

// Hover is read off this one only; press has no meaning for a shell around a control.
const interaction = useInteractionStates({ isDisabled });
const focusWithin = useFocusWithin();

const setElement = (next: unknown) => {
  owner?.setElement(next instanceof HTMLElement ? next : null);
};

const onClick = (event: MouseEvent) => owner?.handlers.onClick(event);
const onDragstart = (event: DragEvent) => owner?.handlers.onDragstart(event);
const onKeydown = (event: KeyboardEvent) => owner?.handlers.onKeydown(event);
const onMousedown = (event: MouseEvent) => owner?.handlers.onMousedown(event);
const onPointerdown = (event: PointerEvent) => owner?.handlers.onPointerdown(event);
const onPointerup = (event: PointerEvent) => owner?.handlers.onPointerup(event);

/*
 * Two things watch the pointer here when a picker owns the group: the hover state the stylesheet
 * reads, and the press machine that decides which segment a click beside them lands on.
 */
const onPointerenter = (event: PointerEvent) => {
  interaction.onPointerenter(event);
  owner?.handlers.onPointerenter(event);
};

/*
 * Two things watch focus here: the state the stylesheet reads, and the picker above, which reports
 * focus entering and leaving the whole thing to its caller.
 */
const onFocusin = (event: FocusEvent) => {
  focusWithin.onFocusin();
  owner?.handlers.onFocusin(event);
};

const onFocusout = (event: FocusEvent) => {
  focusWithin.onFocusout(event);
  owner?.handlers.onFocusout(event);
};

const onPointerleave = (event: PointerEvent) => {
  interaction.onPointerleave();
  owner?.handlers.onPointerleave(event);
};
</script>

<template>
  <div
    :ref="setElement"
    v-bind="owner?.attrs.value"
    :class="styles"
    :data-disabled="dataAttr(isDisabled)"
    :data-focus-visible="dataAttr(focusWithin.isFocusVisible.value)"
    :data-focus-within="dataAttr(focusWithin.isFocusWithin.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-invalid="dataAttr(isInvalid)"
    :data-readonly="dataAttr(props.isReadOnly)"
    data-slot="date-input-group"
    role="group"
    @click="onClick"
    @dragstart="onDragstart"
    @focusin="onFocusin"
    @focusout="onFocusout"
    @keydown="onKeydown"
    @mousedown="onMousedown"
    @pointerdown="onPointerdown"
    @pointerenter="onPointerenter"
    @pointerleave="onPointerleave"
    @pointerup="onPointerup"
  >
    <slot
      :is-disabled="Boolean(isDisabled)"
      :is-focus-visible="focusWithin.isFocusVisible.value"
      :is-focus-within="focusWithin.isFocusWithin.value"
      :is-hovered="interaction.isHovered.value"
      :is-invalid="Boolean(isInvalid)"
    />
  </div>
</template>
