<script setup lang="ts" vapor>
import type { DateFieldFixtureProps } from "./fixtures.types";

import {
  DateFieldGroup,
  DateFieldInput,
  DateFieldPrefix,
  DateField,
  DateFieldSegment,
  DateFieldSuffix,
} from "@/components/date-field";
import { Description } from "@/components/description";
import { FieldError } from "@/components/field-error";
import { Label } from "@/components/label";

/*
 * The three-state booleans need explicit `undefined` here too: forwarding a cast `false` would
 * turn the field controlled, or claim it valid, without any test asking for it.
 */
const props = withDefaults(defineProps<DateFieldFixtureProps>(), {
  fullWidth: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  variant: undefined,
  withLabel: true,
});
</script>

<template>
  <DateField v-if="props.attributeForm" aria-label="Date" full-width :locale="props.locale">
    <DateFieldGroup full-width>
      <DateFieldInput>
        <template #default="{ segment }">
          <DateFieldSegment :segment="segment" />
        </template>
      </DateFieldInput>
    </DateFieldGroup>
  </DateField>
  <component :is="props.withForm ? 'form' : 'div'" v-else>
    <DateField
      :aria-label="props.withLabel ? undefined : (props.ariaLabel ?? 'Date')"
      :class="props.class"
      :create-calendar="props.createCalendar"
      :default-value="props.defaultValue"
      :full-width="props.fullWidth"
      :granularity="props.granularity"
      :is-disabled="props.isDisabled"
      :is-invalid="props.isInvalid"
      :is-read-only="props.isReadOnly"
      :is-required="props.isRequired"
      :locale="props.locale"
      :max-value="props.maxValue"
      :min-value="props.minValue"
      :name="props.name"
      :validation-behavior="props.validationBehavior"
      :value="props.value"
    >
      <Label v-if="props.withLabel">Date</Label>
      <DateFieldGroup :variant="props.variant">
        <DateFieldPrefix v-if="props.withPrefix">before</DateFieldPrefix>
        <DateFieldInput>
          <template #default="{ segment }">
            <DateFieldSegment :segment="segment" />
          </template>
        </DateFieldInput>
        <DateFieldSuffix v-if="props.withSuffix">after</DateFieldSuffix>
      </DateFieldGroup>
      <Description v-if="props.withDescription">When born</Description>
      <FieldError v-if="props.withFieldError" />
    </DateField>
    <button v-if="props.withForm" data-testid="reset" type="reset">Reset</button>
    <button v-if="props.withForm" data-testid="submit" type="submit">Submit</button>
  </component>
</template>
