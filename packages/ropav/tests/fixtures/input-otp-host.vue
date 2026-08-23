<script setup lang="ts" vapor>
import type {InputOTPHostProps} from "./input-otp.types";

import {useInputOTP} from "@/composables/use-input-otp";

// The composable has to run inside a component: it hangs its document listeners and its style
// injection off `onMounted`, which never fires outside a mounted instance.
const props = withDefaults(defineProps<InputOTPHostProps>(), {isDisabled: undefined});

const otp = useInputOTP({
  autoComplete: () => props.autoComplete,
  defaultValue: () => props.defaultValue,
  inputMode: () => props.inputMode,
  isDisabled: () => props.isDisabled,
  maxLength: () => props.maxLength,
  noScriptCss: () => props.noScriptCss,
  onChange: (value) => props.onChange?.(value),
  onComplete: (value) => props.onComplete?.(value),
  pasteTransformer: () => props.pasteTransformer,
  pattern: () => props.pattern,
  placeholder: () => props.placeholder,
  pushPasswordManagerStrategy: () => props.pushPasswordManagerStrategy,
  textAlign: () => props.textAlign,
  value: () => props.value,
});

props.onReady(otp);
</script>

<template>
  <div
    :ref="otp.registerContainer"
    data-input-otp-container
    data-testid="container"
    :style="otp.rootStyle.value"
  >
    <span
      v-for="(slot, index) in otp.slotStates.value"
      :key="index"
      :data-active="slot.isActive ? 'true' : undefined"
      :data-caret="slot.hasFakeCaret ? 'true' : undefined"
      :data-placeholder="slot.placeholderChar ?? undefined"
      data-testid="slot"
      >{{ slot.char ?? "" }}</span
    >
    <input
      :ref="otp.registerInput"
      data-testid="control"
      :disabled="isDisabled || undefined"
      :style="otp.inputStyle.value"
      v-bind="otp.attrs.value"
      @blur="otp.handlers.onBlur"
      @focus="otp.handlers.onFocus"
      @input="otp.handlers.onInput"
      @mouseleave="otp.handlers.onMouseleave"
      @mouseover="otp.handlers.onMouseover"
      @paste="otp.handlers.onPaste"
    />
  </div>
</template>
