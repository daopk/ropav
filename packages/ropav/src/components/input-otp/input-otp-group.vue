<script setup lang="ts" vapor>
import type { InputOTPGroupProps } from "./input-otp.types";

const props = defineProps<InputOTPGroupProps>();
</script>

<template>
  <div :class="['rp-input-otp__group', props.class]" data-slot="input-otp-group">
    <slot />
  </div>
</template>
