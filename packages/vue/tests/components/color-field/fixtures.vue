<script setup lang="ts" vapor>
import type {ColorFieldRootProps} from "@/components/color-field";
import type {Color} from "@/utils/color-types";

import {ColorField} from "@/components/color-field";
import {Description} from "@/components/description";
import {FieldError} from "@/components/field-error";
import {Label} from "@/components/label";

withDefaults(
  defineProps<
    ColorFieldRootProps & {
      variant?: "primary" | "secondary";
      placeholder?: string;
      withLabel?: boolean;
      withDescription?: boolean;
      withFieldError?: boolean;
      withPrefix?: boolean;
      withSuffix?: boolean;
      /** Wraps the field in a form, so a real reset and a real submit have something to act on. */
      withForm?: boolean;
    }
  >(),
  {
    autoFocus: undefined,
    fullWidth: undefined,
    isDisabled: undefined,
    isInvalid: undefined,
    isReadOnly: undefined,
    isRequired: undefined,
    isWheelDisabled: undefined,
    placeholder: undefined,
    variant: undefined,
    withLabel: true,
  },
);

defineEmits<{
  change: [value: Color | null];
  focusChange: [isFocused: boolean];
}>();
</script>

<template>
  <form v-if="$props.withForm" data-testid="form">
    <ColorField
      :channel="$props.channel"
      :color-space="$props.colorSpace"
      :default-value="$props.defaultValue"
      :is-required="$props.isRequired"
      :name="$props.name"
      :validation-behavior="$props.validationBehavior"
      :value="$props.value"
      @change="$emit('change', $event)"
    >
      <Label>Color</Label>
      <ColorField.Group>
        <ColorField.Input />
      </ColorField.Group>
    </ColorField>
    <button data-testid="reset" type="reset">Reset</button>
    <button data-testid="submit" type="submit">Submit</button>
  </form>
  <ColorField
    v-else
    :id="$props.id"
    :aria-describedby="$props.ariaDescribedby"
    :aria-label="$props.ariaLabel"
    :aria-labelledby="$props.ariaLabelledby"
    :channel="$props.channel"
    :class="$props.class"
    :color-space="$props.colorSpace"
    :default-value="$props.defaultValue"
    :form="$props.form"
    :full-width="$props.fullWidth"
    :is-disabled="$props.isDisabled"
    :is-invalid="$props.isInvalid"
    :is-read-only="$props.isReadOnly"
    :is-required="$props.isRequired"
    :is-wheel-disabled="$props.isWheelDisabled"
    :name="$props.name"
    :validate="$props.validate"
    :validation-behavior="$props.validationBehavior"
    :value="$props.value"
    @change="$emit('change', $event)"
    @focus-change="$emit('focusChange', $event)"
  >
    <Label v-if="$props.withLabel">Color</Label>
    <ColorField.Group :variant="$props.variant">
      <ColorField.Prefix v-if="$props.withPrefix">P</ColorField.Prefix>
      <ColorField.Input :placeholder="$props.placeholder" />
      <ColorField.Suffix v-if="$props.withSuffix">S</ColorField.Suffix>
    </ColorField.Group>
    <Description v-if="$props.withDescription">Pick one</Description>
    <FieldError v-if="$props.withFieldError">Bad</FieldError>
  </ColorField>
</template>
