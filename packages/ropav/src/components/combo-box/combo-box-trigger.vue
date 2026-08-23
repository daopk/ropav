<script setup lang="ts" vapor>
import type {ComboBoxTriggerProps} from "./combo-box.types";

import {computed, useSlots} from "vue";

import {composePressResponder, usePressResponder} from "../../composables/press-responder";
import {useInteractionStates} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";
import {IconChevronDown} from "../icons";

import {useComboBoxContext} from "./combo-box.context";

const props = defineProps<ComboBoxTriggerProps>();

defineSlots<{default?: () => unknown}>();

const {comboBox, slots, state} = useComboBoxContext();

const callerSlots = useSlots();

/**
 * Whether the caller handed over a glyph of their own, read off the slot's presence and never by
 * running it: presence is knowable in vapor, contents are not.
 *
 * Only the built-in chevron carries the `data-slot` the stylesheet sizes and rotates, which is the
 * same split the React build makes — an icon of the caller's own brings its own size.
 */
const hasSlot = computed(() => Boolean(callerSlots["default"]));

const responder = usePressResponder();

const isDisabled = computed(() => Boolean(comboBox.triggerAttributes.value.disabled));

const {isFocusVisible, isFocused, isHovered, onBlur, onFocus, onPointerenter, onPointerleave} =
  useInteractionStates({isDisabled: () => isDisabled.value});

const setElement = (element: unknown) => {
  responder?.registerElement((element as HTMLElement | null) ?? null);
};

// Listeners are attached statically rather than spread with `v-bind`, which in vapor re-attaches
// them on every render — a handler must never travel through `v-bind`.
const press = composePressResponder(responder);

const styles = computed(() => slots.value.trigger({class: props.class}));
</script>

<template>
  <button
    :ref="setElement"
    :class="styles"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-focused="dataAttr(isFocused)"
    :data-hovered="dataAttr(isHovered)"
    :data-open="dataAttr(state.isOpen.value)"
    :data-pressed="dataAttr(responder?.isPressed.value)"
    data-slot="combo-box-trigger"
    v-bind="comboBox.triggerAttributes.value"
    @blur="onBlur"
    @click="press.onClick"
    @dragstart="press.onDragstart"
    @focus="onFocus"
    @keydown="press.onKeydown"
    @mousedown="press.onMousedown"
    @pointerdown="press.onPointerdown"
    @pointerenter="onPointerenter"
    @pointerleave="onPointerleave"
    @pointerup="press.onPointerup"
  >
    <slot v-if="hasSlot" />
    <IconChevronDown v-else data-slot="combo-box-trigger-default-icon" />
  </button>
</template>
