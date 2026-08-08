<script setup lang="ts" vapor>
import type {DropdownTriggerProps} from "./dropdown.types";

import {computed} from "vue";

import {composePressResponder, usePressResponder} from "../../composables/press-responder";
import {dataAttr} from "../../utils/assertion";

import {useDropdownContext} from "./dropdown.context";

const props = withDefaults(defineProps<DropdownTriggerProps>(), {type: "button"});

defineSlots<{default?: () => unknown}>();

const {slots} = useDropdownContext();

// Supplied by the dropdown root, which is what makes this a menu trigger rather than a button.
const responder = usePressResponder();

const styles = computed(() => slots.value.trigger({class: props.class}));

const setElement = (element: unknown) => {
  responder?.registerElement((element as HTMLElement | null) ?? null);
};

// Listeners are attached here rather than spread with `v-bind`, which in vapor re-attaches them
// on every render — see `composePressResponder`.
const press = composePressResponder(responder);
</script>

<template>
  <button
    :ref="setElement"
    :class="styles"
    :data-pressed="dataAttr(responder?.isPressed.value)"
    data-slot="dropdown-trigger"
    :type="props.type"
    v-bind="responder?.attrs.value"
    @click="press.onClick"
    @dragstart="press.onDragstart"
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
