<script setup lang="ts" vapor>
import type {DatePickerFixtureProps} from "./fixtures.types";

import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarRoot,
} from "@/components/calendar";
import {
  DatePickerGroup,
  DatePickerInput,
  DatePickerPopover,
  DatePickerRoot,
  DatePickerSegment,
  DatePickerSuffix,
  DatePickerTrigger,
  DatePickerTriggerIndicator,
} from "@/components/date-picker";
import {Description} from "@/components/description";
import {ErrorMessage} from "@/components/error-message";
import {Label} from "@/components/label";

/*
 * The three-state booleans need explicit `undefined` here too: forwarding a cast `false` would turn
 * the picker controlled, or claim it valid, without any test asking for it.
 */
const props = withDefaults(defineProps<DatePickerFixtureProps>(), {
  autoFocus: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
  isOpen: undefined,
  isReadOnly: undefined,
  isRequired: undefined,
  shouldCloseOnSelect: undefined,
});
</script>

<template>
  <DatePickerRoot v-if="props.attributeForm" aria-label="Appointment" is-disabled is-required>
    <DatePickerGroup>
      <DatePickerInput>
        <template #default="{segment}">
          <DatePickerSegment :segment="segment" />
        </template>
      </DatePickerInput>
      <DatePickerSuffix>
        <DatePickerTrigger>
          <DatePickerTriggerIndicator />
        </DatePickerTrigger>
      </DatePickerSuffix>
    </DatePickerGroup>
  </DatePickerRoot>
  <DatePickerRoot
    v-else
    :id="props.id"
    :aria-describedby="props.ariaDescribedby"
    :aria-label="props.ariaLabel"
    :auto-focus="props.autoFocus"
    :class="props.class"
    :default-open="props.defaultOpen"
    :default-value="props.defaultValue"
    :first-day-of-week="props.firstDayOfWeek"
    :granularity="props.granularity"
    :is-date-unavailable="props.isDateUnavailable"
    :is-disabled="props.isDisabled"
    :is-invalid="props.isInvalid"
    :is-open="props.isOpen"
    :is-read-only="props.isReadOnly"
    :is-required="props.isRequired"
    :max-value="props.maxValue"
    :min-value="props.minValue"
    :name="props.name"
    :page-behavior="props.pageBehavior"
    :placeholder-value="props.placeholderValue"
    :should-close-on-select="props.shouldCloseOnSelect"
    :validate="props.validate"
    :validation-behavior="props.validationBehavior"
    :value="props.value"
    @focus-change="props.onFocusChange"
    @open-change="props.onOpenChange"
    @update:value="props.onValueChange"
  >
    <Label v-if="props.label">{{ props.label }}</Label>
    <DatePickerGroup full-width>
      <DatePickerInput>
        <template #default="{segment}">
          <DatePickerSegment :segment="segment" />
        </template>
      </DatePickerInput>
      <DatePickerSuffix>
        <DatePickerTrigger>
          <DatePickerTriggerIndicator v-if="!props.customIndicator" />
          <DatePickerTriggerIndicator v-else>
            <span data-slot="custom-indicator">pick</span>
          </DatePickerTriggerIndicator>
        </DatePickerTrigger>
      </DatePickerSuffix>
    </DatePickerGroup>
    <Description v-if="props.description">{{ props.description }}</Description>
    <ErrorMessage v-if="props.errorMessage">{{ props.errorMessage }}</ErrorMessage>
    <DatePickerPopover>
      <CalendarRoot aria-label="Selected date">
        <CalendarGrid>
          <CalendarGridHeader>
            <template #default="{day}">
              <CalendarHeaderCell>{{ day }}</CalendarHeaderCell>
            </template>
          </CalendarGridHeader>
          <CalendarGridBody>
            <template #default="{date}">
              <CalendarCell :date="date" />
            </template>
          </CalendarGridBody>
        </CalendarGrid>
      </CalendarRoot>
    </DatePickerPopover>
  </DatePickerRoot>
</template>
