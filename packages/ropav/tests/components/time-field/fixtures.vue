<script setup lang="ts" vapor>
import type { TimeFieldFixtureProps } from "./fixtures.types";

import { Description } from "@/components/description";
import { Label } from "@/components/label";
import {
  TimeFieldGroup,
  TimeFieldInput,
  TimeFieldPrefix,
  TimeFieldRoot,
  TimeFieldSegment,
  TimeFieldSuffix,
} from "@/components/time-field";

/*
 * The three-state booleans need explicit `undefined` here too: forwarding a cast `false` would
 * turn the field controlled, or claim it valid, without any test asking for it.
 */
const props = withDefaults(defineProps<TimeFieldFixtureProps>(), {
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
  <TimeFieldRoot v-if="props.attributeForm" aria-label="Time" full-width :locale="props.locale">
    <TimeFieldGroup full-width>
      <TimeFieldInput>
        <template #default="{ segment }">
          <TimeFieldSegment :segment="segment" />
        </template>
      </TimeFieldInput>
    </TimeFieldGroup>
  </TimeFieldRoot>
  <TimeFieldRoot
    v-else
    :aria-label="props.withLabel ? undefined : (props.ariaLabel ?? 'Time')"
    :class="props.class"
    :default-value="props.defaultValue"
    :full-width="props.fullWidth"
    :granularity="props.granularity"
    :hour-cycle="props.hourCycle"
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
    <Label v-if="props.withLabel">Time</Label>
    <TimeFieldGroup :variant="props.variant">
      <TimeFieldPrefix v-if="props.withPrefix">before</TimeFieldPrefix>
      <TimeFieldInput>
        <template #default="{ segment }">
          <TimeFieldSegment :segment="segment" />
        </template>
      </TimeFieldInput>
      <TimeFieldSuffix v-if="props.withSuffix">after</TimeFieldSuffix>
    </TimeFieldGroup>
    <Description v-if="props.withDescription">When to meet</Description>
  </TimeFieldRoot>
</template>
