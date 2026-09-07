<script setup lang="ts" vapor>
import type { InputOTPSeparatorProps } from "./input-otp.types";

const props = defineProps<InputOTPSeparatorProps>();

// A dash between two groups of boxes, and nothing more — no role, no separator semantics. It is
// decoration around a single field, so announcing it would only add noise.
</script>

<template>
  <div :class="['rp-input-otp__separator', props.class]" data-slot="input-otp-separator" />
</template>
