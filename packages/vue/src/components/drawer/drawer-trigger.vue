<script setup lang="ts" vapor>
import type {DrawerTriggerProps} from "./drawer.types";

import {computed} from "vue";

import {composeFocusResponder, useFocusResponder} from "../../composables/focus-responder";
import {composePressResponder, usePressResponder} from "../../composables/press-responder";
import {useInteractionStates} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";

import {useDrawerContext} from "./drawer.context";

const props = defineProps<DrawerTriggerProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useDrawerContext();

// Supplied by the root, which is what makes this a trigger rather than a plain button.
const responder = usePressResponder();

// Hover and focus can be handed down separately — a tooltip wrapped around this button watches it
// without the button having to know.
const focusResponder = useFocusResponder();

const styles = computed(() => slots.value.trigger({class: props.class}));

const setElement = (element: unknown) => {
  const next = (element as HTMLElement | null) ?? null;

  responder?.registerElement(next);
  focusResponder?.registerElement(next);
};

// The stylesheet keys press, focus and the disabled look on these attributes, so they are rendered
// here rather than left to the native pseudo-classes alone.
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
} = useInteractionStates({isDisabled: () => props.isDisabled});

// Written even though a native button is already tabbable: Safari does not focus one unless an
// explicit tab index says so. A disabled button should not be reachable at all, so it gets none.
const tabindex = computed(() => (props.isDisabled ? undefined : 0));

const focus = composeFocusResponder(focusResponder, {onBlur, onFocus});

const attrs = computed(() => ({
  ...focusResponder?.attrs.value,
  ...responder?.attrs.value,
}));

/**
 * Unlike a modal's or an alert dialog's, this trigger is a real `button`.
 *
 * That is what React does here too — the other two wrap a `div` given a button role — and it is
 * worth keeping: a drawer is usually opened from an ordinary control, and a native button brings
 * its own keyboard activation and form semantics.
 *
 * Listeners are chained rather than spread with `v-bind`, which in vapor re-attaches them on every
 * render — see `composePressResponder`.
 */
const press = composePressResponder(responder, {
  onKeydown: focus.onKeydown,
  onPointerdown: (event) => {
    onPointerdown(event);
    focus.onPointerdown(event);
  },
  onPointerenter: (event) => {
    onPointerenter(event);
    focus.onPointerenter(event);
  },
  onPointerleave: (event) => {
    onPointerleave();
    focus.onPointerleave(event);
  },
});
</script>

<template>
  <button
    :ref="setElement"
    :class="styles"
    :data-disabled="dataAttr(props.isDisabled)"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-focused="dataAttr(isFocused)"
    :data-hovered="dataAttr(isHovered)"
    :data-pressed="dataAttr(isPressed || responder?.isPressed.value)"
    data-slot="drawer-trigger"
    :disabled="props.isDisabled || undefined"
    :tabindex="tabindex"
    type="button"
    v-bind="attrs"
    @blur="focus.onBlur"
    @click="press.onClick"
    @dragstart="press.onDragstart"
    @focus="focus.onFocus"
    @keydown="press.onKeydown"
    @mousedown="press.onMousedown"
    @pointerdown="press.onPointerdown"
    @pointerenter="press.onPointerenter"
    @pointerleave="press.onPointerleave"
    @pointerup="press.onPointerup"
  >
    <slot />
  </button>
</template>
