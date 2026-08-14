import type {DateValue} from "@internationalized/date";
import type {Meta, StoryObj} from "@storybook/vue3";

import {getLocalTimeZone, today} from "@internationalized/date";
import {computed, shallowRef} from "vue";

import {Button} from "../button";
import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeader,
  CalendarHeaderCell,
  CalendarNavButton,
  CalendarRoot,
} from "../calendar";
import {
  CalendarYearPickerCell,
  CalendarYearPickerGrid,
  CalendarYearPickerGridBody,
  CalendarYearPickerTrigger,
  CalendarYearPickerTriggerHeading,
  CalendarYearPickerTriggerIndicator,
} from "../calendar-year-picker";
import {Description} from "../description";
import {FieldError} from "../field-error";
import {Form} from "../form";
import {Label} from "../label";

import {
  DatePickerGroup,
  DatePickerInput,
  DatePickerPopover,
  DatePickerRoot,
  DatePickerSegment,
  DatePickerSuffix,
  DatePickerTrigger,
  DatePickerTriggerIndicator,
} from "./index";

import IconChevronDown from "~icons/gravity-ui/chevron-down";

// Registered part by part: a story template is compiled at runtime, with no binding metadata to
// resolve `DatePicker.Trigger` through, so dot notation cannot be used here.
const components = {
  Button,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeader,
  CalendarHeaderCell,
  CalendarNavButton,
  CalendarRoot,
  CalendarYearPickerCell,
  CalendarYearPickerGrid,
  CalendarYearPickerGridBody,
  CalendarYearPickerTrigger,
  CalendarYearPickerTriggerHeading,
  CalendarYearPickerTriggerIndicator,
  DatePickerGroup,
  DatePickerInput,
  DatePickerPopover,
  DatePickerRoot,
  DatePickerSegment,
  DatePickerSuffix,
  DatePickerTrigger,
  DatePickerTriggerIndicator,
  Description,
  FieldError,
  Form,
  IconChevronDown,
  Label,
};

/**
 * `slot` is bound rather than written literally because the linter reads a literal `slot` attribute
 * as Vue 2 slot syntax. Passed to the stories as data so the templates can bind it.
 */
const PREVIOUS = {slot: "previous"} as const;
const NEXT = {slot: "next"} as const;

/** The calendar in the popover, which every story below repeats. */
const calendar = `
  <DatePickerPopover>
    <CalendarRoot aria-label="Selected date">
      <CalendarHeader>
        <CalendarYearPickerTrigger>
          <CalendarYearPickerTriggerHeading />
          <CalendarYearPickerTriggerIndicator />
        </CalendarYearPickerTrigger>
        <CalendarNavButton v-bind="previous" />
        <CalendarNavButton v-bind="next" />
      </CalendarHeader>
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
      <CalendarYearPickerGrid>
        <CalendarYearPickerGridBody>
          <template #default="{year}">
            <CalendarYearPickerCell :year="year" />
          </template>
        </CalendarYearPickerGridBody>
      </CalendarYearPickerGrid>
    </CalendarRoot>
  </DatePickerPopover>
`;

/** The row of segments and the button that opens the calendar. */
const field = `
  <DatePickerGroup full-width>
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
`;

const meta: Meta = {
  component: DatePickerRoot,
  parameters: {
    layout: "centered",
  },
  title: "Components/Date and Time/DatePicker",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components,
    setup: () => ({next: NEXT, previous: PREVIOUS}),
    template: `
      <DatePickerRoot class="w-[280px]" name="date">
        <Label>Date</Label>
        ${field}
        ${calendar}
      </DatePickerRoot>
    `,
  }),
};

export const Controlled: Story = {
  render: () => ({
    components,
    setup: () => {
      const value = shallowRef<DateValue | null>(today(getLocalTimeZone()));

      return {next: NEXT, previous: PREVIOUS, value};
    },
    template: `
      <div class="flex w-64 flex-col gap-2">
        <DatePickerRoot v-model:value="value" name="date">
          <Label>Date</Label>
          ${field}
          <Description>Select a date from the calendar.</Description>
          ${calendar}
        </DatePickerRoot>
        <Description>Current value: {{ value ? value.toString() : "(empty)" }}</Description>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components,
    setup: () => ({
      next: NEXT,
      previous: PREVIOUS,
      value: today(getLocalTimeZone()),
    }),
    template: `
      <DatePickerRoot is-disabled class="w-64" name="date" :value="value">
        <Label>Date</Label>
        ${field}
        ${calendar}
      </DatePickerRoot>
    `,
  }),
};

export const WithValidation: Story = {
  render: () => ({
    components,
    setup: () => {
      const currentDate = today(getLocalTimeZone());
      const value = shallowRef<DateValue | null>(null);
      const isInvalid = computed(() => value.value != null && value.value.compare(currentDate) < 0);

      return {currentDate, isInvalid, next: NEXT, previous: PREVIOUS, value};
    },
    template: `
      <DatePickerRoot
        v-model:value="value"
        is-required
        class="w-64"
        :is-invalid="isInvalid"
        :min-value="currentDate"
        name="date"
      >
        <Label>Appointment date</Label>
        ${field}
        <FieldError v-if="isInvalid">Date must be today or in the future.</FieldError>
        <Description v-else>Select a date from today onward.</Description>
        ${calendar}
      </DatePickerRoot>
    `,
  }),
};

export const WithCustomIndicator: Story = {
  render: () => ({
    components,
    setup: () => ({next: NEXT, previous: PREVIOUS}),
    template: `
      <DatePickerRoot class="w-64" name="date">
        <Label>Date</Label>
        <DatePickerGroup full-width>
          <DatePickerInput>
            <template #default="{segment}">
              <DatePickerSegment :segment="segment" />
            </template>
          </DatePickerInput>
          <DatePickerSuffix>
            <DatePickerTrigger>
              <DatePickerTriggerIndicator>
                <IconChevronDown class="size-4" />
              </DatePickerTriggerIndicator>
            </DatePickerTrigger>
          </DatePickerSuffix>
        </DatePickerGroup>
        <Description>Use a custom trigger icon while keeping DatePicker behavior.</Description>
        ${calendar}
      </DatePickerRoot>
    `,
  }),
};

export const FormExample: Story = {
  render: () => ({
    components,
    setup: () => {
      const currentDate = today(getLocalTimeZone());
      const value = shallowRef<DateValue | null>(null);
      const isSubmitting = shallowRef(false);
      const isInvalid = computed(() => value.value != null && value.value.compare(currentDate) < 0);

      const onSubmit = (event: Event) => {
        event.preventDefault();
        if (!value.value || isInvalid.value) return;

        isSubmitting.value = true;

        setTimeout(() => {
          value.value = null;
          isSubmitting.value = false;
        }, 1200);
      };

      return {
        currentDate,
        isInvalid,
        isSubmitting,
        next: NEXT,
        onSubmit,
        previous: PREVIOUS,
        value,
      };
    },
    template: `
      <Form class="flex w-64 flex-col gap-3" @submit="onSubmit">
        <DatePickerRoot
          v-model:value="value"
          is-required
          :is-invalid="isInvalid"
          :min-value="currentDate"
          name="appointmentDate"
        >
          <Label>Appointment date</Label>
          ${field}
          <FieldError v-if="isInvalid">Date must be today or in the future.</FieldError>
          <Description v-else>Choose a valid appointment date.</Description>
          ${calendar}
        </DatePickerRoot>
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
