<script setup lang="ts" vapor>
import type {InputOTPSeparatorProps} from "./input-otp.types";

import {computed} from "vue";

import {useInputOTPContext} from "./input-otp.context";

const props = defineProps<InputOTPSeparatorProps>();

const {slots} = useInputOTPContext();

const styles = computed(() => slots.value.separator({class: props.class}));

// A dash between two groups of boxes, and nothing more — no role, no separator semantics. It is
// decoration around a single field, so announcing it would only add noise.
</script>

<template>
  <div :class="styles" data-slot="input-otp-separator" />
</template>
