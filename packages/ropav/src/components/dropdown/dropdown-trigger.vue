<script setup lang="ts" vapor>
import type { DropdownTriggerProps } from "./dropdown.types";

import { computed } from "vue";

import { composePressResponder, usePressResponder } from "../../composables/press-responder";
import { useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";

// `isDisabled` declares an explicit `undefined` default so an absent prop stays absent: Vue
// otherwise casts a missing boolean to `false`, which reads as "the caller set false" and would
// swallow the state the dropdown root supplies.
const props = withDefaults(defineProps<DropdownTriggerProps>(), {
  isDisabled: undefined,
  type: "button",
});

defineSlots<{ default?: () => unknown }>();

// Supplied by the dropdown root, which is what makes this a menu trigger rather than a button.
const responder = usePressResponder();

const setElement = (element: unknown) => {
  responder?.registerElement((element as HTMLElement | null) ?? null);
};

// The trigger's own prop wins, so a caller can disable the control without closing the menu off,
// and a dropdown held disabled reaches a trigger that took no prop of its own.
const resolvedIsDisabled = computed(() => props.isDisabled ?? responder?.isDisabled?.value);

// The stylesheet keys hover, press, focus and the disabled look on these attributes, so they have
// to be rendered here rather than left to the native pseudo-classes.
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
} = useInteractionStates({ isDisabled: () => resolvedIsDisabled.value });

// Written even though a native button is already tabbable: Safari does not focus one unless an
// explicit tab index says so, which is the reason react-aria always sets it. A disabled button
// should not be reachable at all, so it gets none. Set before `v-bind` so the responder could
// still override it.
const tabindex = computed(() => (resolvedIsDisabled.value ? undefined : 0));

// Listeners are attached here rather than spread with `v-bind`, which in vapor re-attaches them
// on every render — see `composePressResponder`.
const press = composePressResponder(responder, {
  onPointerdown,
  onPointerenter,
  onPointerleave,
});
</script>

<template>
  <button
    :ref="setElement"
    :class="['rp-dropdown__trigger', props.class]"
    :data-disabled="dataAttr(resolvedIsDisabled)"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-focused="dataAttr(isFocused)"
    :data-hovered="dataAttr(isHovered)"
    :data-pressed="dataAttr(isPressed || responder?.isPressed.value)"
    data-slot="dropdown-trigger"
    :disabled="resolvedIsDisabled || undefined"
    :tabindex="tabindex"
    :type="props.type"
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
    <slot />
  </button>
</template>
