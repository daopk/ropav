<script setup lang="ts" vapor>
import type { RadioGroupFixtureProps } from "./fixtures.types";

import { computed } from "vue";

import { Description } from "@/components/description";
import { FieldError } from "@/components/field-error";
import { Form } from "@/components/form";
import { Label } from "@/components/label";
import { Radio, RadioContent, RadioControl, RadioIndicator } from "@/components/radio";
import { RadioGroup } from "@/components/radio-group";

const props = withDefaults(defineProps<RadioGroupFixtureProps>(), { isInvalid: undefined });

defineEmits<{ change: [value: string | null] }>();

const items = computed(() => props.items ?? ["basic", "premium", "team"]);
</script>

<template>
  <component :is="props.withForm ? Form : 'div'" :validation-errors="props.formValidationErrors">
    <RadioGroup
      :aria-label="props.ariaLabel"
      :class="props.class"
      :default-value="props.defaultValue"
      :form="props.form"
      :is-disabled="props.isDisabled"
      :is-invalid="props.isInvalid"
      :is-read-only="props.isReadOnly"
      :is-required="props.isRequired"
      :name="props.name"
      :orientation="props.orientation"
      :validate="props.validate"
      :validation-behavior="props.validationBehavior"
      :value="props.value"
      :variant="props.variant"
      @change="$emit('change', $event)"
    >
      <Label v-if="props.withLabel">Plan</Label>
      <Description v-if="props.withDescription">Pick the plan that fits</Description>
      <Radio
        v-for="(itemValue, index) in items"
        :key="itemValue"
        :is-disabled="props.disabledItems?.includes(itemValue)"
        :value="itemValue"
      >
        <RadioContent>
          <RadioControl>
            <RadioIndicator>
              <svg v-if="props.withCustomIndicator" data-testid="custom-indicator" />
            </RadioIndicator>
          </RadioControl>
          {{ itemValue }}
        </RadioContent>
        <Description v-if="index === 0 && props.withItemDescription">Good for one seat</Description>
        <FieldError v-if="index === 0 && props.withItemFieldError" />
      </Radio>
      <FieldError v-if="props.withFieldError" />
    </RadioGroup>
    <button v-if="props.withForm" data-testid="reset" type="reset">Reset</button>
    <button v-if="props.withForm" data-testid="submit" type="submit">Submit</button>
  </component>
</template>
