<script setup lang="ts" vapor>
import type {CloseButtonRootProps, CloseButtonSlotProps} from "./close-button.types";

import {closeButtonVariants} from "@heroui/styles";
import {computed} from "vue";

import {composePressResponder, usePressResponder} from "../../composables/press-responder";
import {useInteractionStates} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";
import {IconClose} from "../icons";

const props = withDefaults(defineProps<CloseButtonRootProps>(), {type: "button"});

const emit = defineEmits<{click: [event: MouseEvent]}>();

defineSlots<{default?: (props: CloseButtonSlotProps) => unknown}>();

// Something above may be driving this button — a search field owns its clear button, a
// dropdown makes its first child the trigger — in which case the press behaviour and the
// ARIA wiring are handed down and this stays an ordinary button. React reaches the same
// place through the button context a `CloseButton` reads there.
const responder = usePressResponder();

const setElement = (element: unknown) => {
  responder?.registerElement((element as HTMLElement | null) ?? null);
};

const styles = computed(() => closeButtonVariants({class: props.class, variant: props.variant}));

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
} = useInteractionStates({
  isDisabled: () => props.isDisabled,
  isPending: () => props.isPending,
});

// Written even though a native button is already tabbable: Safari does not focus one unless
// an explicit tab index says so, which is the reason react-aria always sets it. A disabled
// button should not be reachable at all, so it gets none. A driving responder can still
// replace it — a search field's clear button is deliberately out of the tab order.
const tabindex = computed(() => (props.isDisabled ? undefined : 0));

// Blocking the click is not enough on its own: implicit submission reaches the form
// through the button's own type, without a click ever landing on the button.
const type = computed(() => (props.isPending && props.type === "submit" ? "button" : props.type));

const onClick = (event: MouseEvent) => {
  // A pending button stays focusable rather than `disabled`, so activation is blocked here.
  if (props.isPending) {
    event.preventDefault();

    return;
  }

  emit("click", event);
};

// A responder's listeners are chained here rather than spread with `v-bind`, which in vapor
// re-attaches them on every render — see `composePressResponder`.
const press = composePressResponder(responder, {
  onClick,
  onPointerdown,
  onPointerenter,
  onPointerleave,
});
</script>

<template>
  <button
    :ref="setElement"
    :aria-disabled="props.isPending || undefined"
    aria-label="Close"
    :class="styles"
    :data-disabled="dataAttr(props.isDisabled)"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-focused="dataAttr(isFocused)"
    :data-hovered="dataAttr(isHovered)"
    :data-pending="dataAttr(props.isPending)"
    :data-pressed="dataAttr(isPressed || responder?.isPressed.value)"
    data-slot="close-button"
    :disabled="props.isDisabled || undefined"
    :tabindex="tabindex"
    :type="type"
    v-bind="responder?.attrs.value"
    @blur="onBlur"
    @click="press.onClick"
    @dragstart="press.onDragstart"
    @focus="onFocus"
    @keydown="press.onKeydown"
    @mousedown="press.onMousedown"
    @pointerdown="press.onPointerdown"
    @pointerenter="press.onPointerenter"
    @pointerleave="press.onPointerleave"
    @pointerup="press.onPointerup"
  >
    <slot
      :is-disabled="Boolean(props.isDisabled)"
      :is-focus-visible="isFocusVisible"
      :is-hovered="isHovered"
      :is-pending="Boolean(props.isPending)"
      :is-pressed="isPressed"
    >
      <IconClose data-slot="close-button-icon" />
    </slot>
  </button>
</template>
