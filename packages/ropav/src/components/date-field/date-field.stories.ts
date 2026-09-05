import type { SelectedValue } from "../../composables/use-select-state";
// Aliased: the `Granularity` story below would otherwise merge with the type name.
import type { Granularity as DateGranularity } from "../../utils/date-format";
import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { getLocalTimeZone, parseDate, parseZonedDateTime, today } from "@internationalized/date";
import { computed, shallowRef } from "vue";
import IconCalendar from "~icons/gravity-ui/calendar";
import IconChevronDown from "~icons/gravity-ui/chevron-down";
import IconCircleQuestion from "~icons/gravity-ui/circle-question";

import { Button } from "../button";
import { Description } from "../description";
import { FieldError } from "../field-error";
import { Form } from "../form";
import { Label } from "../label";
import { ListBox } from "../list-box";
import { ListBoxItemIndicator, ListBoxItem } from "../list-box-item";
import { SelectIndicator, SelectPopover, Select, SelectTrigger, SelectValue } from "../select";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";

import {
  DateFieldGroup,
  DateFieldInput,
  DateFieldPrefix,
  DateField,
  DateFieldSegment,
  DateFieldSuffix,
} from "./index";

// Registered part by part: a story template is compiled at runtime, with no binding metadata to
// resolve `DateFieldGroup` through, so dot notation cannot be used here.
const components = {
  Button,
  DateField,
  DateFieldGroup,
  DateFieldInput,
  DateFieldPrefix,
  DateFieldSegment,
  DateFieldSuffix,
  Description,
  FieldError,
  Form,
  IconCalendar,
  IconChevronDown,
  IconCircleQuestion,
  Label,
  ListBox: ListBox,
  ListBoxItem: ListBoxItem,
  ListBoxItemIndicator,
  Select: Select,
  SelectIndicator,
  SelectPopover,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
};

/** The input and its segments, which every story below repeats. */
const input = `
  <DateFieldInput>
    <template #default="{segment}">
      <DateFieldSegment :segment="segment" />
    </template>
  </DateFieldInput>
`;

/** The four granularities a date field can show, as data — a Vue select reads its options. */
const GRANULARITY_OPTIONS: { id: DateGranularity; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "hour", label: "Hour" },
  { id: "minute", label: "Minute" },
  { id: "second", label: "Second" },
];

const byLabel = (option: { label: string }) => option.label;

const meta: StoryMeta = {
  component: DateField,
  parameters: {
    layout: "centered",
  },
  title: "Components/Date and Time/DateField",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components,
    template: `
      <DateField class="w-[256px]" name="date">
        <Label>Date</Label>
        <DateFieldGroup>${input}</DateFieldGroup>
      </DateField>
    `,
  }),
};

/** The three heights a button stands at, set on the group that draws the field. */
export const Sizes: Story = {
  render: () => ({
    components,
    setup: () => ({ sizes: ["sm", "md", "lg"] as const }),
    template: `
      <div class="flex flex-col gap-4">
        <DateField
          v-for="size in sizes"
          :key="size"
          class="w-[256px]"
          :name="'size-' + size"
        >
          <Label>Size {{ size }}</Label>
          <DateFieldGroup :size="size">${input}</DateFieldGroup>
        </DateField>
      </div>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <DateField class="w-[256px]" name="primary-date">
          <Label>Primary variant</Label>
          <DateFieldGroup variant="primary">${input}</DateFieldGroup>
        </DateField>
        <DateField class="w-[256px]" name="secondary-date">
          <Label>Secondary variant</Label>
          <DateFieldGroup variant="secondary">${input}</DateFieldGroup>
        </DateField>
      </div>
    `,
  }),
};

export const FullWidth: Story = {
  render: () => ({
    components,
    template: `
      <div class="w-[400px] space-y-4">
        <DateField full-width name="date">
          <Label>Date</Label>
          <DateFieldGroup>${input}</DateFieldGroup>
        </DateField>
        <DateField full-width name="date-icons">
          <Label>Date</Label>
          <DateFieldGroup>
            <DateFieldPrefix>
              <IconCalendar class="size-4 text-muted" />
            </DateFieldPrefix>
            ${input}
            <DateFieldSuffix>
              <IconChevronDown class="size-4 text-muted" />
            </DateFieldSuffix>
          </DateFieldGroup>
        </DateField>
      </div>
    `,
  }),
};

export const WithDescription: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <DateField class="w-[256px]" name="date">
          <Label>Birth date</Label>
          <DateFieldGroup>${input}</DateFieldGroup>
          <Description>Enter your date of birth</Description>
        </DateField>
        <DateField class="w-[256px]" name="appointment-date">
          <Label>Appointment date</Label>
          <DateFieldGroup>${input}</DateFieldGroup>
          <Description>Enter a date for your appointment</Description>
        </DateField>
      </div>
    `,
  }),
};

export const Required: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <DateField is-required class="w-[256px]" name="date">
          <Label>Date</Label>
          <DateFieldGroup>${input}</DateFieldGroup>
        </DateField>
        <DateField is-required class="w-[256px]" name="start-date">
          <Label>Start date</Label>
          <DateFieldGroup>${input}</DateFieldGroup>
          <Description>Required field</Description>
        </DateField>
      </div>
    `,
  }),
};

export const Invalid: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-4">
        <DateField is-invalid is-required class="w-[256px]" name="date">
          <Label>Date</Label>
          <DateFieldGroup>${input}</DateFieldGroup>
          <FieldError>Please enter a valid date</FieldError>
        </DateField>
        <DateField is-invalid class="w-[256px]" name="invalid-date">
          <Label>Date</Label>
          <DateFieldGroup>${input}</DateFieldGroup>
          <FieldError>Date must be in the future</FieldError>
        </DateField>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components,
    setup: () => ({ todayDate: today(getLocalTimeZone()) }),
    template: `
      <div class="flex flex-col gap-4">
        <DateField is-disabled class="w-[256px]" name="date" :value="todayDate">
          <Label>Date</Label>
          <DateFieldGroup>${input}</DateFieldGroup>
          <Description>This date field is disabled</Description>
        </DateField>
        <DateField is-disabled class="w-[256px]" name="date-empty">
          <Label>Date</Label>
          <DateFieldGroup>${input}</DateFieldGroup>
          <Description>This date field is disabled</Description>
        </DateField>
      </div>
    `,
  }),
};

export const Controlled: Story = {
  render: () => ({
    components,
    setup: () => {
      const value = shallowRef<ReturnType<typeof today> | null>(null);

      return {
        clear: () => (value.value = null),
        setToday: () => (value.value = today(getLocalTimeZone())),
        value,
      };
    },
    template: `
      <div class="flex flex-col gap-4">
        <DateField class="w-[256px]" name="date" :value="value" @change="value = $event">
          <Label>Date</Label>
          <DateFieldGroup>${input}</DateFieldGroup>
          <Description>Current value: {{ value ? value.toString() : "(empty)" }}</Description>
        </DateField>
        <div class="flex gap-2">
          <Button variant="tertiary" @click="setToday">Set today</Button>
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
      const todayDate = today(getLocalTimeZone());
      const value = shallowRef<ReturnType<typeof today> | null>(null);
      const isInvalid = computed(() => value.value !== null && value.value.compare(todayDate) < 0);

      return { isInvalid, todayDate, value };
    },
    template: `
      <div class="flex flex-col gap-4">
        <DateField
          is-required
          class="w-[256px]"
          :is-invalid="isInvalid"
          :min-value="todayDate"
          name="date"
          :value="value"
          @change="value = $event"
        >
          <Label>Date</Label>
          <DateFieldGroup>${input}</DateFieldGroup>
          <FieldError v-if="isInvalid">Date must be today or in the future</FieldError>
          <Description v-else>Enter a date from today onwards</Description>
        </DateField>
      </div>
    `,
  }),
};

export const WithPrefixIcon: Story = {
  render: () => ({
    components,
    template: `
      <DateField class="w-[256px]" name="date">
        <Label>Date</Label>
        <DateFieldGroup>
          <DateFieldPrefix>
            <IconCalendar class="size-4 text-muted" />
          </DateFieldPrefix>
          ${input}
        </DateFieldGroup>
      </DateField>
    `,
  }),
};

export const WithSuffixIcon: Story = {
  render: () => ({
    components,
    template: `
      <DateField class="w-[256px]" name="date">
        <Label>Date</Label>
        <DateFieldGroup>
          ${input}
          <DateFieldSuffix>
            <IconCalendar class="size-4 text-muted" />
          </DateFieldSuffix>
        </DateFieldGroup>
      </DateField>
    `,
  }),
};

export const WithPrefixAndSuffix: Story = {
  render: () => ({
    components,
    template: `
      <DateField class="w-[256px]" name="date">
        <Label>Date</Label>
        <DateFieldGroup>
          <DateFieldPrefix>
            <IconCalendar class="size-4 text-muted" />
          </DateFieldPrefix>
          ${input}
          <DateFieldSuffix>
            <IconChevronDown class="size-4 text-muted" />
          </DateFieldSuffix>
        </DateFieldGroup>
        <Description>Enter a date</Description>
      </DateField>
    `,
  }),
};

export const FormExample: Story = {
  render: () => ({
    components,
    setup: () => {
      const todayDate = today(getLocalTimeZone());
      const value = shallowRef<ReturnType<typeof today> | null>(null);
      const isSubmitting = shallowRef(false);
      const isInvalid = computed(() => value.value !== null && value.value.compare(todayDate) < 0);

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

      return { isInvalid, isSubmitting, onSubmit, todayDate, value };
    },
    template: `
      <Form class="flex w-[280px] flex-col gap-4" @submit="onSubmit">
        <DateField
          is-required
          class="w-full"
          :is-invalid="isInvalid"
          :min-value="todayDate"
          name="date"
          :value="value"
          @change="value = $event"
        >
          <Label>Appointment date</Label>
          <DateFieldGroup>
            <DateFieldPrefix>
              <IconCalendar class="size-4 text-muted" />
            </DateFieldPrefix>
            ${input}
          </DateFieldGroup>
          <FieldError v-if="isInvalid">Date must be today or in the future</FieldError>
          <Description v-else>Enter a date from today onwards</Description>
        </DateField>
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

export const Granularity: Story = {
  render: () => ({
    components,
    setup: () => {
      const granularity = shallowRef<DateGranularity>("day");
      // A date-only value has no time to show, so the finer granularities need a zoned one.
      const defaultValue = computed(() =>
        granularity.value === "day"
          ? parseDate("2025-02-03")
          : parseZonedDateTime("2025-02-03T08:45:00[America/Los_Angeles]"),
      );

      const onGranularityChange = (value: SelectedValue) => {
        granularity.value = value as DateGranularity;
      };

      return {
        byLabel,
        defaultValue,
        granularity,
        onGranularityChange,
        options: GRANULARITY_OPTIONS,
      };
    },
    template: `
      <div class="flex gap-4">
        <DateField
          class="w-[256px]"
          :default-value="defaultValue"
          :granularity="granularity"
          :key="granularity"
          name="granularity-date"
        >
          <Label>Appointment Date</Label>
          <DateFieldGroup>${input}</DateFieldGroup>
        </DateField>
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2">
            <Label>Granularity</Label>
            <Tooltip :delay="0">
              <TooltipTrigger aria-label="Granularity information">
                <IconCircleQuestion class="size-4 text-muted" />
              </TooltipTrigger>
              <TooltipContent placement="bottom start">
                <p>
                  Determines the smallest unit displayed in the date picker. By default, this is
                  "day" for dates, and "minute" for times.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            class="w-[110px]"
            :item-text-value="byLabel"
            :items="options"
            placeholder="Select granularity"
            :value="granularity"
            variant="secondary"
            @change="onGranularityChange"
          >
            <SelectTrigger>
              <SelectValue />
              <SelectIndicator />
            </SelectTrigger>
            <SelectPopover>
              <ListBox>
                <ListBoxItem
                  v-for="option in options"
                  :id="option.id"
                  :key="option.id"
                  :text-value="option.label"
                >
                  {{ option.label }}
                  <ListBoxItemIndicator />
                </ListBoxItem>
              </ListBox>
            </SelectPopover>
          </Select>
        </div>
      </div>
    `,
  }),
};

export const AllVariations: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-4">
          <DateField is-required class="w-[256px]" name="date1">
            <Label>Date</Label>
            <DateFieldGroup>
              <DateFieldPrefix>
                <IconCalendar class="size-4 text-muted" />
              </DateFieldPrefix>
              ${input}
            </DateFieldGroup>
            <Description>Enter a date</Description>
          </DateField>

          <DateField is-required class="w-[256px]" name="date2">
            <Label>Date</Label>
            <DateFieldGroup>
              ${input}
              <DateFieldSuffix>
                <IconCalendar class="size-4 text-muted" />
              </DateFieldSuffix>
            </DateFieldGroup>
            <Description>Enter a date</Description>
          </DateField>

          <DateField is-required class="w-[256px]" name="date3">
            <Label>Date</Label>
            <DateFieldGroup>
              <DateFieldPrefix>
                <IconCalendar class="size-4 text-muted" />
              </DateFieldPrefix>
              ${input}
              <DateFieldSuffix>
                <IconChevronDown class="size-4 text-muted" />
              </DateFieldSuffix>
            </DateFieldGroup>
            <Description>Enter a date</Description>
          </DateField>
        </div>
      </div>
    `,
  }),
};
