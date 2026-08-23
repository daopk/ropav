<script setup lang="ts" vapor>
import type { InputOTPGroupProps } from "./input-otp.types";

import { computed } from "vue";

import { useInputOTPContext } from "./input-otp.context";

const props = defineProps<InputOTPGroupProps>();

const { slots } = useInputOTPContext();

const styles = computed(() => slots.value.group({ class: props.class }));
</script>

<template>
  <div :class="styles" data-slot="input-otp-group">
    <slot />
  </div>
</template>
