<script setup lang="ts" vapor>
import type {DropdownTriggerProps} from "./dropdown.types";

import {computed} from "vue";

import {usePressResponder} from "../../composables/press-responder";
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
</script>

<template>
  <button
    :ref="setElement"
    :class="styles"
    :data-pressed="dataAttr(responder?.isPressed.value)"
    data-slot="dropdown-trigger"
    :type="props.type"
    v-bind="responder?.bind.value"
  >
    <slot />
  </button>
</template>
