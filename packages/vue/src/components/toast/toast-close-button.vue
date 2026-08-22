<script setup lang="ts" vapor>
import type {ToastCloseButtonProps} from "./toast.types";

import {computed} from "vue";

import CloseButtonRoot from "../close-button/close-button-root.vue";

import {useToastItemContext, useToastRegionContext} from "./toast.context";

const props = defineProps<ToastCloseButtonProps>();

const {slots} = useToastRegionContext();
const {close} = useToastItemContext();

const styles = computed(() => slots.value.close({class: props.class}));
</script>

<template>
  <CloseButtonRoot
    :class="styles"
    data-slot="toast-close"
    v-bind="{slot: 'close'}"
    @click="close"
  />
</template>
