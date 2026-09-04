<script setup lang="ts" vapor>
import type { DateRangePickerFixtureProps } from "./fixtures.types";

import {
  DateRangePickerGroup,
  DateRangePickerInput,
  DateRangePickerPopover,
  DateRangePickerRangeSeparator,
  DateRangePicker,
  DateRangePickerSegment,
  DateRangePickerSuffix,
  DateRangePickerTrigger,
  DateRangePickerTriggerIndicator,
} from "@/components/date-range-picker";
import { Description } from "@/components/description";
import { ErrorMessage } from "@/components/error-message";
import { Label } from "@/components/label";
import {
  RangeCalendarCell,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHeader,
  RangeCalendarHeaderCell,
  RangeCalendar,
} from "@/components/range-calendar";

/*
 * `slot` is bound through an object rather than written as `slot="start"`, because the linter reads
 * a literal `slot` attribute as Vue 2 slot syntax and rewrites it. It is an ordinary prop here.
 */
const START = { slot: "start" } as const;
const END = { slot: "end" } as const;

/*
 * The three-state booleans need explicit `undefined` here too: forwarding a cast `false` would turn
 * the picker controlled, or claim it valid, without any test asking for it.
 */
const props = withDefaults(defineProps<DateRangePickerFixtureProps>(), {
  allowsNonContiguousRanges: undefined,
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
  <DateRangePicker v-if="props.attributeForm" aria-label="Trip" is-disabled is-required>
    <DateRangePickerGroup>
      <DateRangePickerInput v-bind="START">
        <template #default="{ segment }">
          <DateRangePickerSegment :segment="segment" />
        </template>
      </DateRangePickerInput>
      <DateRangePickerRangeSeparator />
      <DateRangePickerInput v-bind="END">
        <template #default="{ segment }">
          <DateRangePickerSegment :segment="segment" />
        </template>
      </DateRangePickerInput>
    </DateRangePickerGroup>
  </DateRangePicker>
  <DateRangePicker v-else-if="props.missingSlot">
    <DateRangePickerGroup>
      <DateRangePickerInput>
        <template #default="{ segment }">
          <DateRangePickerSegment :segment="segment" />
        </template>
      </DateRangePickerInput>
    </DateRangePickerGroup>
  </DateRangePicker>
  <DateRangePicker
    v-else
    :id="props.id"
    :allows-non-contiguous-ranges="props.allowsNonContiguousRanges"
    :aria-describedby="props.ariaDescribedby"
    :aria-label="props.ariaLabel"
    :auto-focus="props.autoFocus"
    :class="props.class"
    :default-open="props.defaultOpen"
    :default-value="props.defaultValue"
    :end-name="props.endName"
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
    :page-behavior="props.pageBehavior"
    :placeholder-value="props.placeholderValue"
    :should-close-on-select="props.shouldCloseOnSelect"
    :start-name="props.startName"
    :validate="props.validate"
    :validation-behavior="props.validationBehavior"
    :value="props.value"
    @focus-change="props.onFocusChange"
    @open-change="props.onOpenChange"
    @update:value="props.onValueChange"
  >
    <Label v-if="props.label">{{ props.label }}</Label>
    <DateRangePickerGroup full-width>
      <DateRangePickerInput v-bind="START">
        <template #default="{ segment }">
          <DateRangePickerSegment :segment="segment" />
        </template>
      </DateRangePickerInput>
      <DateRangePickerRangeSeparator v-if="!props.customSeparator" />
      <DateRangePickerRangeSeparator v-else>
        <span data-slot="custom-separator">to</span>
      </DateRangePickerRangeSeparator>
      <DateRangePickerInput v-bind="END">
        <template #default="{ segment }">
          <DateRangePickerSegment :segment="segment" />
        </template>
      </DateRangePickerInput>
      <DateRangePickerSuffix>
        <DateRangePickerTrigger>
          <DateRangePickerTriggerIndicator v-if="!props.customIndicator" />
          <DateRangePickerTriggerIndicator v-else>
            <span data-slot="custom-indicator">pick</span>
          </DateRangePickerTriggerIndicator>
        </DateRangePickerTrigger>
      </DateRangePickerSuffix>
    </DateRangePickerGroup>
    <Description v-if="props.description">{{ props.description }}</Description>
    <ErrorMessage v-if="props.errorMessage">{{ props.errorMessage }}</ErrorMessage>
    <DateRangePickerPopover>
      <RangeCalendar aria-label="Selected range">
        <RangeCalendarGrid>
          <RangeCalendarGridHeader>
            <template #default="{ day }">
              <RangeCalendarHeaderCell>{{ day }}</RangeCalendarHeaderCell>
            </template>
          </RangeCalendarGridHeader>
          <RangeCalendarGridBody>
            <template #default="{ date }">
              <RangeCalendarCell :date="date" />
            </template>
          </RangeCalendarGridBody>
        </RangeCalendarGrid>
      </RangeCalendar>
    </DateRangePickerPopover>
  </DateRangePicker>
</template>
