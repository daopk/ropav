<script setup lang="ts" vapor>
import type {ToggleButtonRootProps, ToggleButtonSlotProps} from "./toggle-button.types";

import {toggleButtonVariants} from "@ropav/styles";
import {computed} from "vue";

import {useControllableState} from "../../composables/use-controllable-state";
import {useInteractionStates} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";
import {useFieldsetContext} from "../fieldset/fieldset.context";
import {useToggleButtonGroupContext} from "../toggle-button-group/toggle-button-group.context";

// These booleans declare an explicit `undefined` default so an absent prop stays absent:
// Vue otherwise casts a missing boolean to `false`, which reads as "the caller set false".
// For `isDisabled` that would swallow the value a surrounding group provides; for
// `isSelected` it is worse, since `undefined` is what marks the button as uncontrolled —
// a cast `false` pins it permanently off, ignoring `defaultSelected` and every click.
const props = withDefaults(defineProps<ToggleButtonRootProps>(), {
  isDisabled: undefined,
  isSelected: undefined,
  type: "button",
});

const emit = defineEmits<{
  change: [isSelected: boolean];
  click: [event: MouseEvent];
}>();

defineSlots<{default?: (props: ToggleButtonSlotProps) => unknown}>();

const group = useToggleButtonGroupContext();
const fieldset = useFieldsetContext();

// Standalone selection state. Inside a group this is left untouched — the group's keyed
// state is the single source of truth, so two buttons can never both think they are on.
const standalone = useControllableState<boolean>({
  defaultValue: props.defaultSelected ?? false,
  onValueChange: (selected) => emit("change", selected),
  value: () => props.isSelected,
});

const isSelected = computed(() =>
  group ? group.state.isSelected(props.id as never) : standalone.state.value,
);

// Named apart from the props they resolve: a binding that shadows a prop name is read as
// the prop inside the template, which would silently drop the value coming from the group.
const resolvedSize = computed(() => props.size ?? group?.size.value);
const resolvedIsDisabled = computed(
  () =>
    props.isDisabled ??
    (group ? group.state.isDisabled.value : undefined) ??
    fieldset?.isDisabled.value,
);

const styles = computed(() =>
  toggleButtonVariants({
    class: props.class,
    isIconOnly: props.isIconOnly,
    size: resolvedSize.value,
    variant: props.variant,
  }),
);

// The stylesheet keys hover, press and focus on these attributes, so they have to be
// rendered here rather than left to the native pseudo-classes.
const {
  isFocusVisible,
  isFocused,
  isHovered,
  isPressed,
  onBlur,
  onFocus,
  onPointerdown,
  onPointerenter,
  onPointerleave,
} = useInteractionStates({isDisabled: () => resolvedIsDisabled.value});

/**
 * Single selection turns the group into a set of mutually exclusive choices, which is a
 * radio group to assistive technology. React Aria swaps the roles for exactly that reason,
 * and `aria-pressed` has to go with it — a radio reports `aria-checked`, and carrying both
 * would describe the button twice.
 */
const isRadio = computed(() => group?.state.selectionMode.value === "single");

// Written even though a native button is already tabbable: Safari does not focus one unless
// an explicit tab index says so, which is the reason react-aria always sets it. A disabled
// button should not be reachable at all, so it gets none.
const tabindex = computed(() => (resolvedIsDisabled.value ? undefined : 0));

const onClick = (event: MouseEvent) => {
  // A disabled native button never fires a click, but an `aria-disabled` one would, and
  // so does a programmatic dispatch. Selection must not move either way.
  if (resolvedIsDisabled.value) return;

  if (group) group.state.toggleKey(props.id as never);
  else standalone.setState((previous) => !previous);

  emit("click", event);
};
</script>

<template>
  <button
    :aria-checked="isRadio ? isSelected : undefined"
    :aria-pressed="isRadio ? undefined : isSelected"
    :class="styles"
    :data-disabled="dataAttr(resolvedIsDisabled)"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-focused="dataAttr(isFocused)"
    :data-hovered="dataAttr(isHovered)"
    :data-pressed="dataAttr(isPressed)"
    :data-selected="dataAttr(isSelected)"
    data-slot="toggle-button"
    :disabled="resolvedIsDisabled || undefined"
    :role="isRadio ? 'radio' : undefined"
    :tabindex="tabindex"
    :type="type"
    @blur="onBlur"
    @click="onClick"
    @focus="onFocus"
    @pointerdown="onPointerdown"
    @pointerenter="onPointerenter"
    @pointerleave="onPointerleave"
  >
    <slot
      :is-disabled="Boolean(resolvedIsDisabled)"
      :is-focus-visible="isFocusVisible"
      :is-hovered="isHovered"
      :is-pressed="isPressed"
      :is-selected="isSelected"
    />
  </button>
</template>
