<script setup lang="ts" vapor>
import type {ModalCloseTriggerProps} from "./modal.types";

import {computed} from "vue";

import {CloseButtonRoot} from "../close-button";

import {useModalContext} from "./modal.context";

const props = defineProps<ModalCloseTriggerProps>();

const {slots, state} = useModalContext();

const styles = computed(() => slots.value.closeTrigger({class: props.class}));

// A component's `click` is an emit rather than a DOM listener, so it is not subject to the rule
// that keeps handlers off `v-bind`.
const onClick = () => state.close();
</script>

<template>
  <CloseButtonRoot
    :aria-label="props['aria-label']"
    :class="styles"
    data-slot="modal-close-trigger"
    @click="onClick"
  />
</template>
