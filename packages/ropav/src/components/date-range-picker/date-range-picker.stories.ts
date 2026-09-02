import type { DateRange } from "../../composables/use-calendar";
import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { getLocalTimeZone, today } from "@internationalized/date";
import { computed, shallowRef } from "vue";
import IconChevronDown from "~icons/gravity-ui/chevron-down";

import { Button } from "../button";
import {
  CalendarYearPickerCell,
  CalendarYearPickerGrid,
  CalendarYearPickerGridBody,
  CalendarYearPickerTrigger,
  CalendarYearPickerTriggerHeading,
  CalendarYearPickerTriggerIndicator,
} from "../calendar-year-picker";
import { Description } from "../description";
import { FieldError } from "../field-error";
import { Form } from "../form";
import { Label } from "../label";
import {
  RangeCalendarCell,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHeader,
  RangeCalendarHeader,
  RangeCalendarHeaderCell,
  RangeCalendarNavButton,
  RangeCalendarRoot,
} from "../range-calendar";

import {
  DateRangePickerGroup,
  DateRangePickerInput,
  DateRangePickerPopover,
  DateRangePickerRangeSeparator,
  DateRangePickerRoot,
  DateRangePickerSegment,
  DateRangePickerSuffix,
  DateRangePickerTrigger,
  DateRangePickerTriggerIndicator,
} from "./index";

// Registered part by part: a story template is compiled at runtime, with no binding metadata to
// resolve `DateRangePicker.Trigger` through, so dot notation cannot be used here.
const components = {
  Button,
  CalendarYearPickerCell,
  CalendarYearPickerGrid,
  CalendarYearPickerGridBody,
  CalendarYearPickerTrigger,
  CalendarYearPickerTriggerHeading,
  CalendarYearPickerTriggerIndicator,
  DateRangePickerGroup,
  DateRangePickerInput,
  DateRangePickerPopover,
  DateRangePickerRangeSeparator,
  DateRangePickerRoot,
  DateRangePickerSegment,
  DateRangePickerSuffix,
  DateRangePickerTrigger,
  DateRangePickerTriggerIndicator,
  Description,
  FieldError,
  Form,
  IconChevronDown,
  Label,
  RangeCalendarCell,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHeader,
  RangeCalendarHeader,
  RangeCalendarHeaderCell,
  RangeCalendarNavButton,
  RangeCalendarRoot,
};

/**
 * `slot` is bound rather than written literally because the linter reads a literal `slot` attribute
 * as Vue 2 slot syntax. Passed to the stories as data so the templates can bind it.
 */
const PREVIOUS = { slot: "previous" } as const;
const NEXT = { slot: "next" } as const;
const START = { slot: "start" } as const;
const END = { slot: "end" } as const;

/** Everything every story below shares, so each one differs only in what it is showing. */
const bindings = { end: END, next: NEXT, previous: PREVIOUS, start: START };

/** The range calendar in the popover, which every story below repeats. */
const calendar = `
  <DateRangePickerPopover>
    <RangeCalendarRoot aria-label="Selected range">
      <RangeCalendarHeader>
        <CalendarYearPickerTrigger>
          <CalendarYearPickerTriggerHeading />
          <CalendarYearPickerTriggerIndicator />
        </CalendarYearPickerTrigger>
        <RangeCalendarNavButton v-bind="previous" />
        <RangeCalendarNavButton v-bind="next" />
      </RangeCalendarHeader>
      <RangeCalendarGrid>
        <RangeCalendarGridHeader>
          <template #default="{day}">
            <RangeCalendarHeaderCell>{{ day }}</RangeCalendarHeaderCell>
          </template>
        </RangeCalendarGridHeader>
        <RangeCalendarGridBody>
          <template #default="{date}">
            <RangeCalendarCell :date="date" />
          </template>
        </RangeCalendarGridBody>
      </RangeCalendarGrid>
      <CalendarYearPickerGrid>
        <CalendarYearPickerGridBody>
          <template #default="{year}">
            <CalendarYearPickerCell :year="year" />
          </template>
        </CalendarYearPickerGridBody>
      </CalendarYearPickerGrid>
    </RangeCalendarRoot>
  </DateRangePickerPopover>
`;

/** The two rows of segments, the separator between them, and the button that opens the calendar. */
const field = `
  <DateRangePickerGroup full-width>
    <DateRangePickerInput v-bind="start">
      <template #default="{segment}">
        <DateRangePickerSegment :segment="segment" />
      </template>
    </DateRangePickerInput>
    <DateRangePickerRangeSeparator />
    <DateRangePickerInput v-bind="end">
      <template #default="{segment}">
        <DateRangePickerSegment :segment="segment" />
      </template>
    </DateRangePickerInput>
    <DateRangePickerSuffix>
      <DateRangePickerTrigger>
        <DateRangePickerTriggerIndicator />
      </DateRangePickerTrigger>
    </DateRangePickerSuffix>
  </DateRangePickerGroup>
`;

/** The same field, with the size handed to the group that draws it. */
const sizedField = field.replace(
  "<DateRangePickerGroup full-width>",
  '<DateRangePickerGroup full-width :size="size">',
);

const meta: StoryMeta = {
  component: DateRangePickerRoot,
  parameters: {
    layout: "centered",
  },
  title: "Components/Date and Time/DateRangePicker",
};

export default meta;

type Story = StoryObj<typeof meta>;

/** The three heights a button stands at, set on the group that draws the field. */
export const Sizes: Story = {
  render: () => ({
    components,
    setup: () => ({ ...bindings, sizes: ["sm", "md", "lg"] as const }),
    template: `
      <div class="flex flex-col gap-4">
        <DateRangePickerRoot
          v-for="size in sizes"
          :key="size"
          class="w-[320px]"
          :end-name="'end-' + size"
          :start-name="'start-' + size"
        >
          <Label>Size {{ size }}</Label>
          ${sizedField}
        </DateRangePickerRoot>
      </div>
    `,
  }),
};

export const Default: Story = {
  render: () => ({
    components,
    setup: () => ({ ...bindings }),
    template: `
      <DateRangePickerRoot class="w-[320px]" end-name="endDate" start-name="startDate">
        <Label>Trip dates</Label>
        ${field}
        ${calendar}
      </DateRangePickerRoot>
    `,
  }),
};

export const Controlled: Story = {
  render: () => ({
    components,
    setup: () => {
      const start = today(getLocalTimeZone());
      const value = shallowRef<DateRange | null>({ end: start.add({ days: 4 }), start });

      return { ...bindings, value };
    },
    template: `
      <div class="flex w-[320px] flex-col gap-2">
        <DateRangePickerRoot
          v-model:value="value"
          end-name="endDate"
          start-name="startDate"
        >
          <Label>Trip dates</Label>
          ${field}
          <Description>Select your check-in and check-out dates.</Description>
          ${calendar}
        </DateRangePickerRoot>
        <Description>
          Current value:
          {{ value ? value.start.toString() + " -> " + value.end.toString() : "(empty)" }}
        </Description>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components,
    setup: () => {
      const start = today(getLocalTimeZone());

      return { ...bindings, value: { end: start.add({ days: 4 }), start } };
    },
    template: `
      <DateRangePickerRoot
        is-disabled
        class="w-[320px]"
        end-name="endDate"
        start-name="startDate"
        :value="value"
      >
        <Label>Trip dates</Label>
        ${field}
        ${calendar}
      </DateRangePickerRoot>
    `,
  }),
};

export const WithValidation: Story = {
  render: () => ({
    components,
    setup: () => {
      const currentDate = today(getLocalTimeZone());
      const value = shallowRef<DateRange | null>(null);
      const isInvalid = computed(
        () =>
          value.value != null &&
          (value.value.start.compare(currentDate) < 0 ||
            value.value.end.compare(value.value.start) < 0),
      );

      return { ...bindings, currentDate, isInvalid, value };
    },
    template: `
      <DateRangePickerRoot
        v-model:value="value"
        is-required
        class="w-[320px]"
        end-name="endDate"
        :is-invalid="isInvalid"
        :min-value="currentDate"
        start-name="startDate"
      >
        <Label>Booking period</Label>
        ${field}
        <FieldError v-if="isInvalid">Select a valid range starting today or later.</FieldError>
        <Description v-else>Choose a check-in and check-out date.</Description>
        ${calendar}
      </DateRangePickerRoot>
    `,
  }),
};

export const WithCustomIndicator: Story = {
  render: () => ({
    components,
    setup: () => ({ ...bindings }),
    template: `
      <DateRangePickerRoot class="w-[320px]" end-name="endDate" start-name="startDate">
        <Label>Trip dates</Label>
        <DateRangePickerGroup full-width>
          <DateRangePickerInput v-bind="start">
            <template #default="{segment}">
              <DateRangePickerSegment :segment="segment" />
            </template>
          </DateRangePickerInput>
          <DateRangePickerRangeSeparator />
          <DateRangePickerInput v-bind="end">
            <template #default="{segment}">
              <DateRangePickerSegment :segment="segment" />
            </template>
          </DateRangePickerInput>
          <DateRangePickerSuffix>
            <DateRangePickerTrigger>
              <DateRangePickerTriggerIndicator>
                <IconChevronDown class="size-4" />
              </DateRangePickerTriggerIndicator>
            </DateRangePickerTrigger>
          </DateRangePickerSuffix>
        </DateRangePickerGroup>
        <Description>
          Use a custom trigger icon while preserving DateRangePicker behavior.
        </Description>
        ${calendar}
      </DateRangePickerRoot>
    `,
  }),
};

export const FormExample: Story = {
  render: () => ({
    components,
    setup: () => {
      const currentDate = today(getLocalTimeZone());
      const value = shallowRef<DateRange | null>(null);
      const isSubmitting = shallowRef(false);
      const isInvalid = computed(
        () =>
          value.value != null &&
          (value.value.start.compare(currentDate) < 0 ||
            value.value.end.compare(value.value.start) < 0),
      );

      const onSubmit = (event: Event) => {
        event.preventDefault();
        if (!value.value || isInvalid.value) return;

        isSubmitting.value = true;

        setTimeout(() => {
          value.value = null;
          isSubmitting.value = false;
        }, 1200);
      };

      return { ...bindings, currentDate, isInvalid, isSubmitting, onSubmit, value };
    },
    template: `
      <Form class="flex w-[320px] flex-col gap-3" @submit="onSubmit">
        <DateRangePickerRoot
          v-model:value="value"
          is-required
          end-name="tripEndDate"
          :is-invalid="isInvalid"
          :min-value="currentDate"
          start-name="tripStartDate"
        >
          <Label>Trip dates</Label>
          ${field}
          <FieldError v-if="isInvalid">Please choose a valid range in the future.</FieldError>
          <Description v-else>Select your check-in and check-out dates.</Description>
          ${calendar}
        </DateRangePickerRoot>
        <Button
          class="w-full"
          :is-disabled="!value || isInvalid"
          :is-pending="isSubmitting"
          type="submit"
        >
          {{ isSubmitting ? "Submitting..." : "Submit" }}
        </Button>
      </Form>
    `,
  }),
};
