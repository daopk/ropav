<script setup lang="ts" vapor>
import type {InputOTPRootProps} from "./input-otp.types";

import {inputOTPVariants} from "@ropav/styles";
import {computed} from "vue";

import {provideInputOTPStateContext, useInputOTP} from "../../composables/use-input-otp";
import {dataAttr} from "../../utils/assertion";
import {provideFieldErrorContext} from "../field-error";

import {provideInputOTPContext} from "./input-otp.context";

const props = defineProps<InputOTPRootProps>();

const emit = defineEmits<{
  change: [value: string];
  "update:value": [value: string];
  complete: [value: string];
}>();

const otp = useInputOTP({
  autoComplete: () => props.autoComplete,
  defaultValue: () => props.defaultValue,
  inputMode: () => props.inputMode,
  isDisabled: () => props.isDisabled,
  maxLength: () => props.maxLength,
  onChange: (value) => {
    emit("change", value);
    emit("update:value", value);
  },
  onComplete: (value) => emit("complete", value),
  pasteTransformer: () => props.pasteTransformer,
  pattern: () => props.pattern,
  placeholder: () => props.placeholder,
  pushPasswordManagerStrategy: () => props.pushPasswordManagerStrategy,
  textAlign: () => props.textAlign,
  value: () => props.value,
});

const slots = computed(() => inputOTPVariants({variant: props.variant}));

const isDisabled = computed(() => props.isDisabled === true);
const isInvalid = computed(() => props.isInvalid === true);

provideInputOTPContext({isDisabled, isInvalid, slots});
provideInputOTPStateContext(otp);
// The field runs no validation of its own — it is handed a verdict and passes it on, so a nested
// `FieldError` has something to render.
provideFieldErrorContext({
  validation: computed(() => ({
    isInvalid: isInvalid.value,
    validationDetails: props.validationDetails ?? {
      badInput: false,
      customError: false,
      patternMismatch: false,
      rangeOverflow: false,
      rangeUnderflow: false,
      stepMismatch: false,
      tooLong: false,
      tooShort: false,
      typeMismatch: false,
      valid: !isInvalid.value,
      valueMissing: false,
    },
    validationErrors: props.validationErrors ?? [],
  })),
});

const containerStyles = computed(() => slots.value.base({class: props.class}));
const inputStyles = computed(() => slots.value.input({class: props.inputClass}));

/**
 * The control is laid over the whole field, and this layer is what stops the boxes from swallowing
 * the pointer on the way to it.
 */
const wrapperStyle = {inset: "0", pointerEvents: "none", position: "absolute"} as const;

/**
 * React renders a `<noscript>` here holding a stylesheet that makes the hidden control visible
 * when scripting is off. There is no `<noscript>` below, and it is not an omission: a Vapor
 * template is instantiated from an HTML string, and a browser with scripting on parses everything
 * inside `<noscript>` as plain text, so the `<style>` would never become an element at all. The
 * fallback only ever reaches a reader through server-rendered HTML, which this package does not
 * produce yet — `useInputOTP` still hands the stylesheet out for whoever wires that up.
 */
</script>

<template>
  <div
    :ref="otp.registerContainer"
    :class="containerStyles"
    data-input-otp-container="true"
    :style="otp.rootStyle.value"
  >
    <slot />
    <div :style="wrapperStyle">
      <input
        :id="id"
        :ref="otp.registerInput"
        :aria-describedby="ariaDescribedby"
        :aria-label="ariaLabel"
        :aria-labelledby="ariaLabelledby"
        :class="inputStyles"
        :data-disabled="dataAttr(isDisabled)"
        :data-invalid="dataAttr(isInvalid)"
        data-slot="input-otp"
        :disabled="isDisabled || undefined"
        :form="form"
        :name="name"
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
  </div>
</template>
