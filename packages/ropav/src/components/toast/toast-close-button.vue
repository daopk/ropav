<script setup lang="ts" vapor>
import type { ToastCloseButtonProps } from "./toast.types";

import { normalizeClass } from "vue";

import CloseButtonRoot from "../close-button/close-button-root.vue";

import { useToastItemContext } from "./toast.context";

// The receiver declares `class` as a string prop, so the list is joined here rather than by the
// template compiler, which only does that for a class landing on an element.
const props = defineProps<ToastCloseButtonProps>();

const { close } = useToastItemContext();
</script>

<template>
  <CloseButtonRoot
    :class="normalizeClass(['rp-toast__close-button', props.class])"
    data-slot="toast-close"
    v-bind="{ slot: 'close' }"
    @click="close"
  />
</template>
