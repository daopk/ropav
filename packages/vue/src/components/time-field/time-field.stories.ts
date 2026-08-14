import type {TimeValue} from "../../utils/date-format";
import type {Meta, StoryObj} from "@storybook/vue3";

import {Time, getLocalTimeZone, now, parseTime} from "@internationalized/date";
import {computed, shallowRef} from "vue";

import {Button} from "../button";
import {Description} from "../description";
import {FieldError} from "../field-error";
import {Form} from "../form";
import {Label} from "../label";

import {
  TimeFieldGroup,
  TimeFieldInput,
  TimeFieldPrefix,
  TimeFieldRoot,
  TimeFieldSegment,
  TimeFieldSuffix,
} from "./index";

import IconChevronDown from "~icons/gravity-ui/chevron-down";
import IconClock from "~icons/gravity-ui/clock";

// Registered part by part: a story template is compiled at runtime, with no binding metadata to
// resolve `TimeField.Group` through, so dot notation cannot be used here.
const components = {
  Button,
  Description,
  FieldError,
  Form,
  IconChevronDown,
  IconClock,
  Label,
  TimeFieldGroup,
  TimeFieldInput,
  TimeFieldPrefix,
  TimeFieldRoot,
  TimeFieldSegment,
  TimeFieldSuffix,
};

/** The input and its segments, which every story below repeats. */
const input = `
  <TimeFieldInput>
    <template #default="{segment}">
      <TimeFieldSegment :segment="segment" />
    </template>
  </TimeFieldInput>
`;

const meta: Meta = {
  component: TimeFieldRoot,
  parameters: {
    layout: "centered",
  },
  title: "Components/Date and Time/TimeField",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components,
    template: `
      <TimeFieldRoot class="w-[256px]" name="time">
        <Label>Time</Label>
        <TimeFieldGroup>${input}</TimeFieldGroup>
      </TimeFieldRoot>
    `,
  }),
};

export const FullWidth: Story = {
  render: () => ({
    components,
    template: `
      <div class="w-[400px] space-y-4">
        <TimeFieldRoot full-width name="time">
          <Label>Time</Label>
          <TimeFieldGroup full-width>${input}</TimeFieldGroup>
        </TimeFieldRoot>
        <TimeFieldRoot full-width name="time-icons">
          <Label>Time</Label>
          <TimeFieldGroup full-width>
            <TimeFieldPrefix>
              <IconClock class="size-4 text-muted" />
            </TimeFieldPrefix>
            ${input}
            <TimeFieldSuffix>
              <IconChevronDown class="size-4 text-muted" />
            </TimeFieldSuffix>
          </TimeFieldGroup>
        </TimeFieldRoot>
      </div>
    `,
  }),
};

export const WithDescription: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <TimeFieldRoot class="w-[256px]" name="time">
          <Label>Start time</Label>
          <TimeFieldGroup>${input}</TimeFieldGroup>
          <Description>Enter the start time</Description>
        </TimeFieldRoot>
        <TimeFieldRoot class="w-[256px]" name="end-time">
          <Label>End time</Label>
          <TimeFieldGroup>${input}</TimeFieldGroup>
          <Description>Enter the end time</Description>
        </TimeFieldRoot>
      </div>
    `,
  }),
};

export const Required: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <TimeFieldRoot is-required class="w-[256px]" name="time">
          <Label>Time</Label>
          <TimeFieldGroup>${input}</TimeFieldGroup>
        </TimeFieldRoot>
        <TimeFieldRoot is-required class="w-[256px]" name="appointment-time">
          <Label>Appointment time</Label>
          <TimeFieldGroup>${input}</TimeFieldGroup>
          <Description>Required field</Description>
        </TimeFieldRoot>
      </div>
    `,
  }),
};

export const Invalid: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <TimeFieldRoot is-invalid is-required class="w-[256px]" name="time">
          <Label>Time</Label>
          <TimeFieldGroup>${input}</TimeFieldGroup>
          <FieldError>Please enter a valid time</FieldError>
        </TimeFieldRoot>
        <TimeFieldRoot is-invalid class="w-[256px]" name="invalid-time">
          <Label>Time</Label>
          <TimeFieldGroup>${input}</TimeFieldGroup>
          <FieldError>Time must be within business hours</FieldError>
        </TimeFieldRoot>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components,
    setup: () => {
      const current = now(getLocalTimeZone());

      return {timeValue: new Time(current.hour, current.minute, current.second)};
    },
    template: `
      <div class="flex flex-col gap-4">
        <TimeFieldRoot is-disabled class="w-[256px]" name="time" :value="timeValue">
          <Label>Time</Label>
          <TimeFieldGroup>${input}</TimeFieldGroup>
          <Description>This time field is disabled</Description>
        </TimeFieldRoot>
        <TimeFieldRoot is-disabled class="w-[256px]" name="time-empty">
          <Label>Time</Label>
          <TimeFieldGroup>${input}</TimeFieldGroup>
          <Description>This time field is disabled</Description>
        </TimeFieldRoot>
      </div>
    `,
  }),
};

export const Controlled: Story = {
  render: () => ({
    components,
    setup: () => {
      const value = shallowRef<TimeValue | null>(null);

      return {
        clear: () => (value.value = null),
        setNow: () => {
          const current = now(getLocalTimeZone());

          value.value = new Time(current.hour, current.minute, current.second);
        },
        value,
      };
    },
    template: `
      <div class="flex flex-col gap-4">
        <TimeFieldRoot class="w-[256px]" name="time" :value="value" @change="value = $event">
          <Label>Time</Label>
          <TimeFieldGroup>${input}</TimeFieldGroup>
          <Description>Current value: {{ value ? value.toString() : "(empty)" }}</Description>
        </TimeFieldRoot>
        <div class="flex gap-2">
          <Button variant="tertiary" @click="setNow">Set now</Button>
          <Button variant="tertiary" @click="clear">Clear</Button>
        </div>
      </div>
    `,
  }),
};

export const WithValidation: Story = {
  render: () => ({
    components,
    setup: () => {
      const minTime = parseTime("09:00");
      const maxTime = parseTime("17:00");
      const value = shallowRef<Time | null>(null);
      const isInvalid = computed(
        () =>
          value.value !== null &&
          (value.value.compare(minTime) < 0 || value.value.compare(maxTime) > 0),
      );

      return {isInvalid, maxTime, minTime, value};
    },
    template: `
      <div class="flex flex-col gap-4">
        <TimeFieldRoot
          is-required
          class="w-[256px]"
          :is-invalid="isInvalid"
          :max-value="maxTime"
          :min-value="minTime"
          name="time"
          :value="value"
          @change="value = $event"
        >
          <Label>Time</Label>
          <TimeFieldGroup>${input}</TimeFieldGroup>
          <FieldError v-if="isInvalid">Time must be between 9:00 AM and 5:00 PM</FieldError>
          <Description v-else>Enter a time between 9:00 AM and 5:00 PM</Description>
        </TimeFieldRoot>
      </div>
    `,
  }),
};

export const WithPrefixIcon: Story = {
  render: () => ({
    components,
    template: `
      <TimeFieldRoot class="w-[256px]" name="time">
        <Label>Time</Label>
        <TimeFieldGroup>
          <TimeFieldPrefix>
            <IconClock class="size-4 text-muted" />
          </TimeFieldPrefix>
          ${input}
        </TimeFieldGroup>
      </TimeFieldRoot>
    `,
  }),
};

export const WithSuffixIcon: Story = {
  render: () => ({
    components,
    template: `
      <TimeFieldRoot class="w-[256px]" name="time">
        <Label>Time</Label>
        <TimeFieldGroup>
          ${input}
          <TimeFieldSuffix>
            <IconClock class="size-4 text-muted" />
          </TimeFieldSuffix>
        </TimeFieldGroup>
      </TimeFieldRoot>
    `,
  }),
};

export const WithPrefixAndSuffix: Story = {
  render: () => ({
    components,
    template: `
      <TimeFieldRoot class="w-[256px]" name="time">
        <Label>Time</Label>
        <TimeFieldGroup>
          <TimeFieldPrefix>
            <IconClock class="size-4 text-muted" />
          </TimeFieldPrefix>
          ${input}
          <TimeFieldSuffix>
            <IconChevronDown class="size-4 text-muted" />
          </TimeFieldSuffix>
        </TimeFieldGroup>
        <Description>Enter a time</Description>
      </TimeFieldRoot>
    `,
  }),
};

export const FormExample: Story = {
  render: () => ({
    components,
    setup: () => {
      const minTime = parseTime("09:00");
      const maxTime = parseTime("17:00");
      const value = shallowRef<Time | null>(null);
      const isSubmitting = shallowRef(false);
      const isInvalid = computed(
        () =>
          value.value !== null &&
          (value.value.compare(minTime) < 0 || value.value.compare(maxTime) > 0),
      );

      const onSubmit = (event: Event) => {
        event.preventDefault();

        if (!value.value || isInvalid.value) return;

        isSubmitting.value = true;

        // Stands in for a request.
        setTimeout(() => {
          value.value = null;
          isSubmitting.value = false;
        }, 1500);
      };

      return {isInvalid, isSubmitting, maxTime, minTime, onSubmit, value};
    },
    template: `
      <Form class="flex w-[280px] flex-col gap-4" @submit="onSubmit">
        <TimeFieldRoot
          is-required
          class="w-full"
          :is-invalid="isInvalid"
          :max-value="maxTime"
          :min-value="minTime"
          name="time"
          :value="value"
          @change="value = $event"
        >
          <Label>Appointment time</Label>
          <TimeFieldGroup>
            <TimeFieldPrefix>
              <IconClock class="size-4 text-muted" />
            </TimeFieldPrefix>
            ${input}
          </TimeFieldGroup>
          <FieldError v-if="isInvalid">Time must be between 9:00 AM and 5:00 PM</FieldError>
          <Description v-else>Enter a time between 9:00 AM and 5:00 PM</Description>
        </TimeFieldRoot>
        <Button
          class="w-full"
          :is-disabled="!value || isInvalid"
          :is-pending="isSubmitting"
          type="submit"
          variant="primary"
        >
          {{ isSubmitting ? "Submitting..." : "Submit" }}
        </Button>
      </Form>
    `,
  }),
};

export const AllVariations: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-4">
          <TimeFieldRoot is-required class="w-[256px]" name="time1">
            <Label>Time</Label>
            <TimeFieldGroup>
              <TimeFieldPrefix>
                <IconClock class="size-4 text-muted" />
              </TimeFieldPrefix>
              ${input}
            </TimeFieldGroup>
            <Description>Enter a time</Description>
          </TimeFieldRoot>

          <TimeFieldRoot is-required class="w-[256px]" name="time2">
            <Label>Time</Label>
            <TimeFieldGroup>
              ${input}
              <TimeFieldSuffix>
                <IconClock class="size-4 text-muted" />
              </TimeFieldSuffix>
            </TimeFieldGroup>
            <Description>Enter a time</Description>
          </TimeFieldRoot>

          <TimeFieldRoot is-required class="w-[256px]" name="time3">
            <Label>Time</Label>
            <TimeFieldGroup>
              <TimeFieldPrefix>
                <IconClock class="size-4 text-muted" />
              </TimeFieldPrefix>
              ${input}
              <TimeFieldSuffix>
                <IconChevronDown class="size-4 text-muted" />
              </TimeFieldSuffix>
            </TimeFieldGroup>
            <Description>Enter a time</Description>
          </TimeFieldRoot>
        </div>
      </div>
    `,
  }),
};
