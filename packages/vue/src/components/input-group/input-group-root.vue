<script setup lang="ts" vapor>
import type {InputGroupRootProps, InputGroupRootSlotProps} from "./input-group.types";

import {inputGroupVariants} from "@heroui/styles";
import {computed, shallowRef} from "vue";

import {useFocusWithin, useInteractionStates} from "../../composables/use-interaction-states";
import {useTextFieldControlContext} from "../../composables/use-text-field";
import {dataAttr} from "../../utils/assertion";
import {useTextFieldContext} from "../textfield/textfield.context";

import {provideInputGroupContext} from "./input-group.context";

// Three-state props declare an explicit `undefined` default so they can still fall through to
// the field. Cast to `false` they would read as the caller claiming that state, and the group
// could never pick up the disabled or invalid state of the field it sits in.
const props = withDefaults(defineProps<InputGroupRootProps>(), {
  fullWidth: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  variant: undefined,
});

defineSlots<{default?: (props: InputGroupRootSlotProps) => unknown}>();

// Both optional: a group outside any field is legal, exactly as it is in React.
const control = useTextFieldControlContext();
const textField = useTextFieldContext();

const element = shallowRef<HTMLDivElement | null>(null);

const setElement = (next: unknown) => {
  element.value = next instanceof HTMLDivElement ? next : null;
};

// Each named apart from the prop it resolves: an identifier matching a prop name resolves to
// the prop inside the template, which would silently drop the value coming from the field.
const resolvedVariant = computed(() => props.variant ?? textField?.variant.value);
const resolvedIsDisabled = computed(() => props.isDisabled ?? control?.isDisabled.value ?? false);
const resolvedIsInvalid = computed(() => props.isInvalid ?? control?.isInvalid.value ?? false);

const slots = computed(() =>
  inputGroupVariants({fullWidth: props.fullWidth, variant: resolvedVariant.value}),
);

provideInputGroupContext({slots});

const styles = computed(() => slots.value.base({class: props.class}));

// Hover is read off this one only; press has no meaning for a shell around a control. The
// stylesheet suppresses the hover fill while focus is inside, so the two have to be reported
// together or a group that is both hovered and focused keeps the hover fill.
const interaction = useInteractionStates({isDisabled: resolvedIsDisabled});
const focusWithin = useFocusWithin();

// Only `input`, as in React — clicking beside a textarea does not pull focus into it. The
// query is scoped to this group so a field holding more than one control keeps them apart.
const onClick = (event: MouseEvent) => {
  const target = event.target as Node | null;
  const input = element.value?.querySelector("input");

  if (input && target !== input && !input.contains(target)) input.focus();
};

// A group inside a field is presentational: the field is what assistive technology reads, so
// a second grouping around the control would only add noise. Standing alone it is a real
// group. A `role` from the caller wins either way, through attribute fallthrough.
const role = computed(() => (control ? "presentation" : "group"));
</script>

<template>
  <div
    :ref="setElement"
    :class="styles"
    :data-disabled="dataAttr(resolvedIsDisabled)"
    :data-focus-visible="dataAttr(focusWithin.isFocusVisible.value)"
    :data-focus-within="dataAttr(focusWithin.isFocusWithin.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-invalid="dataAttr(resolvedIsInvalid)"
    :data-readonly="dataAttr(props.isReadOnly)"
    data-slot="input-group"
    :role="role"
    @click="onClick"
    @focusin="focusWithin.onFocusin"
    @focusout="focusWithin.onFocusout"
    @pointerenter="interaction.onPointerenter"
    @pointerleave="interaction.onPointerleave"
  >
    <slot
      :is-disabled="resolvedIsDisabled"
      :is-focus-visible="focusWithin.isFocusVisible.value"
      :is-focus-within="focusWithin.isFocusWithin.value"
      :is-hovered="interaction.isHovered.value"
      :is-invalid="resolvedIsInvalid"
    />
  </div>
</template>
