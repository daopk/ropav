<script setup lang="ts" vapor>
import type { InputOTPSlotProps } from "./input-otp.types";

import { computed } from "vue";

import { useInputOTPStateContext } from "../../composables/use-input-otp";
import { dataAttr } from "../../utils/assertion";

import { useInputOTPContext } from "./input-otp.context";

const props = defineProps<InputOTPSlotProps>();

const { isDisabled, isInvalid, slots } = useInputOTPContext();
const { slotStates } = useInputOTPStateContext();

const styles = computed(() => slots.value.slot({ class: props.class }));

// Out of range when the caller renders more boxes than the code is long, which the field cannot
// stop it from doing. An empty box is the honest result.
const state = computed(() => slotStates.value[props.index]);

const valueStyles = computed(() => slots.value.slotValue());
const caretStyles = computed(() => slots.value.caret());
</script>

<template>
  <div
    :class="styles"
    :data-active="dataAttr(state?.isActive)"
    :data-disabled="dataAttr(isDisabled)"
    :data-filled="dataAttr(Boolean(state?.char))"
    :data-invalid="dataAttr(isInvalid)"
    data-slot="input-otp-slot"
  >
    <div v-if="state?.char" :class="valueStyles" data-slot="input-otp-slot-value">
      {{ state.char }}
    </div>
    <div
      v-if="state?.hasFakeCaret && state?.isActive"
      :class="caretStyles"
      data-slot="input-otp-caret"
    />
  </div>
</template>
