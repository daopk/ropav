<script setup lang="ts" vapor>
import type {AutocompleteIndicatorProps} from "./autocomplete.types";

import {computed, useSlots} from "vue";

import {composePressResponder, usePressResponder} from "../../composables/press-responder";
import {useInteractionStates} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";
import {composeSlotClassName} from "../../utils/compose";
import {IconChevronDown} from "../icons";

import {useAutocompleteContext} from "./autocomplete.context";

const props = defineProps<AutocompleteIndicatorProps>();

defineSlots<{default?: () => unknown}>();

const {select, slots, state} = useAutocompleteContext();

const callerSlots = useSlots();

/**
 * Which `data-slot` the glyph carries, which the stylesheet reads: only the built-in chevron is
 * given a size, since an icon of the caller's own brings one.
 *
 * Read off whether a slot was handed over at all, never by running it: presence is knowable in
 * vapor, contents are not. Branching on it also keeps the built-in icon out of `<slot>` fallback
 * content, which drops the slots of components a VDOM host nests inside.
 */
const hasSlot = computed(() => Boolean(callerSlots["default"]));

const dataSlot = computed(() =>
  hasSlot.value ? "autocomplete-indicator" : "autocomplete-default-indicator",
);

// Resolved here rather than in the template: a template unwraps the ref, and one of the slots is
// itself named `value`, so `slots.value` in a template reads that slot instead of the ref.
const styles = computed(() => composeSlotClassName(slots.value.indicator, props.class));

/**
 * This button is the autocomplete's real trigger, not decoration.
 *
 * The group around it is a `role="group"` holding a value and a clear button, none of which a
 * keyboard can open a listbox with. So the chevron is what carries `aria-haspopup`, answers Enter,
 * Space and ArrowDown, and is the one element in the field a user tabs to — which is why leaving
 * it out leaves the whole widget unreachable. The React build is the same shape: its indicator
 * renders a bare button that picks the trigger behaviour up from the select above it.
 */
const responder = usePressResponder();

const {isFocusVisible, isFocused, isHovered, onBlur, onFocus, onPointerenter, onPointerleave} =
  useInteractionStates({isDisabled: () => Boolean(select.triggerAttributes.value["disabled"])});

const setElement = (element: unknown) => {
  responder?.registerElement((element as HTMLElement | null) ?? null);
};

// Listeners are attached statically rather than spread with `v-bind`, which in vapor re-attaches
// them on every render — a handler must never travel through `v-bind`.
const press = composePressResponder(responder);

// The autocomplete tracks focus for itself as well, because a blur while the popover is open is
// not a blur out of the autocomplete at all.
const onTriggerFocus = () => {
  onFocus();
  select.onFocus();
};

const onTriggerBlur = () => {
  onBlur();
  select.onBlur();
};

const onKeydown = (event: KeyboardEvent) => {
  select.onKeydown(event);
};
</script>

<template>
  <button
    :ref="setElement"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-focused="dataAttr(isFocused)"
    :data-hovered="dataAttr(isHovered)"
    :data-pressed="dataAttr(responder?.isPressed.value)"
    tabindex="0"
    v-bind="select.triggerAttributes.value"
    @blur="onTriggerBlur"
    @click="press.onClick"
    @dragstart="press.onDragstart"
    @focus="onTriggerFocus"
    @keydown="onKeydown"
    @keydown.capture="select.onKeydownCapture"
    @mousedown="press.onMousedown"
    @pointerdown="press.onPointerdown"
    @pointerenter="onPointerenter"
    @pointerleave="onPointerleave"
    @pointerup="press.onPointerup"
  >
    <span :class="styles" :data-open="dataAttr(state.isOpen.value)" :data-slot="dataSlot">
      <slot v-if="hasSlot" />
      <IconChevronDown v-else />
    </span>
  </button>
</template>
