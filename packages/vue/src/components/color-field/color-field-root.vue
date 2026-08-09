<script setup lang="ts" vapor>
import type {ColorFieldRootProps, ColorFieldRootSlotProps} from "./color-field.types";
import type {Color} from "../../utils/color-types";

import ColorFieldChannel from "./color-field-channel.vue";
import ColorFieldHex from "./color-field-hex.vue";

/**
 * Two components under one name, and the dispatch is deliberate rather than a shortcut.
 *
 * A hex field and a channel field share a class and a slot contract and nothing else: different
 * state, different keyboard, different DOM. React branches the same way — `ColorField` returns one
 * of two components — so a `channel` that changes at runtime rebuilds the field in both, which is
 * the only honest answer when the control itself is a different control.
 *
 * The dispatcher adds no element of its own: exactly one of the two branches renders, and the
 * caller's attributes and slot pass straight through to it.
 */
const props = withDefaults(defineProps<ColorFieldRootProps>(), {
  autoFocus: undefined,
  fullWidth: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  isWheelDisabled: undefined,
});

const emit = defineEmits<{
  change: [value: Color | null];
  "update:value": [value: Color | null];
  focusChange: [isFocused: boolean];
}>();

defineSlots<{default?: (props: ColorFieldRootSlotProps) => unknown}>();
</script>

<template>
  <ColorFieldChannel
    v-if="props.channel"
    :id="props.id"
    :aria-describedby="props.ariaDescribedby"
    :aria-label="props.ariaLabel"
    :aria-labelledby="props.ariaLabelledby"
    :auto-focus="props.autoFocus"
    :channel="props.channel"
    :class="props.class"
    :color-space="props.colorSpace"
    :default-value="props.defaultValue"
    :form="props.form"
    :full-width="props.fullWidth"
    :is-disabled="props.isDisabled"
    :is-read-only="props.isReadOnly"
    :is-required="props.isRequired"
    :is-wheel-disabled="props.isWheelDisabled"
    :name="props.name"
    :validation-behavior="props.validationBehavior"
    :value="props.value"
    @change="emit('change', $event)"
    @focus-change="emit('focusChange', $event)"
    @update:value="emit('update:value', $event)"
  >
    <template #default="slotProps">
      <slot v-bind="slotProps" />
    </template>
  </ColorFieldChannel>
  <ColorFieldHex
    v-else
    :id="props.id"
    :aria-describedby="props.ariaDescribedby"
    :aria-label="props.ariaLabel"
    :aria-labelledby="props.ariaLabelledby"
    :auto-focus="props.autoFocus"
    :class="props.class"
    :default-value="props.defaultValue"
    :form="props.form"
    :full-width="props.fullWidth"
    :is-disabled="props.isDisabled"
    :is-invalid="props.isInvalid"
    :is-read-only="props.isReadOnly"
    :is-required="props.isRequired"
    :is-wheel-disabled="props.isWheelDisabled"
    :name="props.name"
    :validate="props.validate"
    :validation-behavior="props.validationBehavior"
    :value="props.value"
    @change="emit('change', $event)"
    @focus-change="emit('focusChange', $event)"
    @update:value="emit('update:value', $event)"
  >
    <template #default="slotProps">
      <slot v-bind="slotProps" />
    </template>
  </ColorFieldHex>
</template>
