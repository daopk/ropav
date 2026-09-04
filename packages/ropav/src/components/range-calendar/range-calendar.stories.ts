import type { DateRange } from "../../composables/use-calendar";
import type { StoryMeta } from "../../utils/story-meta";
import type { CalendarDate, DateValue } from "@internationalized/date";
import type { StoryObj } from "@storybook/vue3-vite";

import {
  getLocalTimeZone,
  isToday,
  isWeekend,
  parseDate,
  startOfMonth,
  startOfWeek,
  today,
} from "@internationalized/date";
import { computed, shallowRef } from "vue";

import { useLocale } from "../../composables/use-locale";
import { createCalendar } from "../../utils/calendar-systems";
import { Button } from "../button";
import { ButtonGroup } from "../button-group";
import {
  CalendarYearPickerCell,
  CalendarYearPickerGrid,
  CalendarYearPickerGridBody,
  CalendarYearPickerTrigger,
  CalendarYearPickerTriggerHeading,
  CalendarYearPickerTriggerIndicator,
} from "../calendar-year-picker";
import { Description } from "../description";
import { I18nProvider } from "../i18n-provider";
import { Label } from "../label";
import { ListBox } from "../list-box";
import { ListBoxItemIndicator, ListBoxItem } from "../list-box-item";
import { SelectIndicator, SelectPopover, Select, SelectTrigger, SelectValue } from "../select";

import {
  RangeCalendarCell,
  RangeCalendarCellIndicator,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHeader,
  RangeCalendarHeader,
  RangeCalendarHeaderCell,
  RangeCalendarHeading,
  RangeCalendarNavButton,
  RangeCalendar,
} from "./index";

// Registered part by part: a story template is compiled at runtime, with no binding metadata to
// resolve `RangeCalendarGrid` through, so dot notation cannot be used here.
const components = {
  Button,
  ButtonGroup,
  CalendarYearPickerCell,
  CalendarYearPickerGrid,
  CalendarYearPickerGridBody,
  CalendarYearPickerTrigger,
  CalendarYearPickerTriggerHeading,
  CalendarYearPickerTriggerIndicator,
  Description,
  I18nProvider,
  Label,
  ListBox: ListBox,
  ListBoxItem: ListBoxItem,
  ListBoxItemIndicator,
  RangeCalendar,
  RangeCalendarCell,
  RangeCalendarCellIndicator,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHeader,
  RangeCalendarHeader,
  RangeCalendarHeaderCell,
  RangeCalendarHeading,
  RangeCalendarNavButton,
  Select: Select,
  SelectIndicator,
  SelectPopover,
  SelectTrigger,
  SelectValue,
};

/*
 * Which way a nav button pages is bound through an object rather than written as `slot="previous"`,
 * because the linter reads a literal `slot` attribute as Vue 2 slot syntax. It is an ordinary prop
 * here, and the same shape the component itself uses to put it back in the DOM.
 */
const PREVIOUS = { slot: "previous" } as const;
const NEXT = { slot: "next" } as const;

/** The grid and its cells, which nearly every story below repeats. */
const grid = `
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
`;

/** The header the shared template uses: the heading first, then both nav buttons. */
const header = `
  <RangeCalendarHeader>
    <RangeCalendarHeading />
    <RangeCalendarNavButton v-bind="PREVIOUS" />
    <RangeCalendarNavButton v-bind="NEXT" />
  </RangeCalendarHeader>
`;

/** The header with the heading between the two nav buttons, as some stories arrange it. */
const headerNavFirst = `
  <RangeCalendarHeader>
    <RangeCalendarNavButton v-bind="PREVIOUS" />
    <RangeCalendarHeading />
    <RangeCalendarNavButton v-bind="NEXT" />
  </RangeCalendarHeader>
`;

/** The header with the year-picker trigger in place of the heading. */
const yearPickerHeader = `
  <RangeCalendarHeader>
    <CalendarYearPickerTrigger>
      <CalendarYearPickerTriggerHeading />
      <CalendarYearPickerTriggerIndicator />
    </CalendarYearPickerTrigger>
    <RangeCalendarNavButton v-bind="PREVIOUS" />
    <RangeCalendarNavButton v-bind="NEXT" />
  </RangeCalendarHeader>
`;

/** The year grid, with one plain cell per year. */
const yearPickerGrid = `
  <CalendarYearPickerGrid>
    <CalendarYearPickerGridBody>
      <template #default="{id}">
        <CalendarYearPickerCell :id="id" />
      </template>
    </CalendarYearPickerGridBody>
  </CalendarYearPickerGrid>
`;

const meta: StoryMeta = {
  argTypes: {
    allowsNonContiguousRanges: { control: "boolean" },
    isDisabled: { control: "boolean" },
    isReadOnly: { control: "boolean" },
    weeksInMonth: { control: { max: 6, min: 4, step: 1, type: "number" } },
  },
  component: RangeCalendar,
  parameters: {
    layout: "centered",
  },
  title: "Components/Date and Time/RangeCalendar",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({ NEXT, PREVIOUS, args }),
    template: `
      <RangeCalendar v-bind="args" aria-label="Trip dates">
        ${header}
        ${grid}
      </RangeCalendar>
    `,
  }),
};

export const WithYearPicker: Story = {
  render: (args) => ({
    components,
    setup: () => ({ NEXT, PREVIOUS, args }),
    template: `
      <RangeCalendar v-bind="args" aria-label="Trip dates">
        ${yearPickerHeader}
        ${grid}
        ${yearPickerGrid}
      </RangeCalendar>
    `,
  }),
};

export const DefaultValue: Story = {
  render: (args) => ({
    components,
    setup: () => ({
      NEXT,
      PREVIOUS,
      args,
      defaultValue: { end: parseDate("2025-02-12"), start: parseDate("2025-02-03") },
    }),
    template: `
      <RangeCalendar v-bind="args" aria-label="Trip dates" :default-value="defaultValue">
        ${header}
        ${grid}
      </RangeCalendar>
    `,
  }),
};

export const Controlled: Story = {
  render: (args) => ({
    components,
    setup: () => {
      const value = shallowRef<DateRange | null>(null);
      const focusedValue = shallowRef<DateValue>(parseDate("2025-12-25"));
      const locale = useLocale();

      const goTo = (start: DateValue, end: DateValue) => {
        value.value = { end, start };
        focusedValue.value = start;
      };

      return {
        NEXT,
        PREVIOUS,
        args,
        focusedValue,
        selected: computed(() =>
          value.value ? `${value.value.start} -> ${value.value.end}` : "(none)",
        ),
        setHolidays: () => goTo(parseDate("2025-12-20"), parseDate("2025-12-31")),
        setNextMonth: () => {
          const start = startOfMonth(today(getLocalTimeZone()).add({ months: 1 }));

          goTo(start, start.add({ days: 9 }));
        },
        setNextWeek: () => {
          const start = startOfWeek(
            today(getLocalTimeZone()).add({ weeks: 1 }),
            locale.value.locale,
          );

          goTo(start, start.add({ days: 6 }));
        },
        setThisWeek: () => {
          const start = today(getLocalTimeZone());

          goTo(start, start.add({ days: 6 }));
        },
        value,
      };
    },
    template: `
      <div class="flex flex-col items-center gap-4">
        <ButtonGroup variant="tertiary">
          <Button @click="setThisWeek">This week</Button>
          <Button @click="setNextWeek">Next week</Button>
          <Button @click="setNextMonth">Next month</Button>
        </ButtonGroup>
        <RangeCalendar
          v-bind="args"
          aria-label="Trip dates"
          :focused-value="focusedValue"
          :value="value"
          @update:focused-value="focusedValue = $event"
          @update:value="value = $event"
        >
          ${header}
          ${grid}
        </RangeCalendar>
        <Description class="text-center">Selected range: {{ selected }}</Description>
        <div class="flex gap-2">
          <Button size="sm" variant="secondary" @click="setThisWeek">Set 1 week</Button>
          <Button size="sm" variant="secondary" @click="setHolidays">Set Holidays</Button>
          <Button size="sm" variant="tertiary" @click="value = null">Clear</Button>
        </div>
      </div>
    `,
  }),
};

export const MinMaxDates: Story = {
  render: (args) => ({
    components,
    setup: () => {
      const now = today(getLocalTimeZone());

      return {
        NEXT,
        PREVIOUS,
        args,
        defaultValue: { end: now.add({ days: 5 }), start: now.add({ days: 2 }) },
        maxValue: now.add({ months: 3 }),
        minValue: now,
      };
    },
    template: `
      <div class="flex flex-col items-center gap-4">
        <RangeCalendar
          v-bind="args"
          aria-label="Trip dates"
          :default-value="defaultValue"
          :max-value="maxValue"
          :min-value="minValue"
        >
          <RangeCalendarHeader>
            <RangeCalendarNavButton v-bind="PREVIOUS" />
            <CalendarYearPickerTrigger>
              <CalendarYearPickerTriggerHeading />
              <CalendarYearPickerTriggerIndicator />
            </CalendarYearPickerTrigger>
            <RangeCalendarNavButton v-bind="NEXT" />
          </RangeCalendarHeader>
          ${grid}
          ${yearPickerGrid}
        </RangeCalendar>
        <Description class="text-center">
          Select dates between today and {{ maxValue.toString() }}
        </Description>
      </div>
    `,
  }),
};

/** Two stretches of days nothing can be booked on, used by the two contiguity stories. */
const blockedRanges = () => {
  const now = today(getLocalTimeZone());

  return [
    [now.add({ days: 2 }), now.add({ days: 5 })],
    [now.add({ days: 12 }), now.add({ days: 13 })],
  ] as const;
};

const isBlocked = (date: DateValue) =>
  blockedRanges().some(([start, end]) => date.compare(start) >= 0 && date.compare(end) <= 0);

export const UnavailableDates: Story = {
  render: (args) => ({
    components,
    setup: () => {
      const now = today(getLocalTimeZone());

      return {
        NEXT,
        PREVIOUS,
        args,
        defaultValue: { end: now.add({ days: 9 }), start: now.add({ days: 6 }) },
        isDateUnavailable: isBlocked,
      };
    },
    template: `
      <div class="flex flex-col items-center gap-4">
        <RangeCalendar
          v-bind="args"
          aria-label="Trip dates"
          :default-value="defaultValue"
          :is-date-unavailable="isDateUnavailable"
        >
          ${header}
          ${grid}
        </RangeCalendar>
        <Description class="text-center">Some days are unavailable</Description>
      </div>
    `,
  }),
};

export const WeeksInMonth: Story = {
  render: (args) => ({
    components,
    setup: () => ({ NEXT, PREVIOUS, args }),
    template: `
      <div class="flex flex-col items-center gap-4">
        <RangeCalendar v-bind="args" aria-label="Trip dates" :weeks-in-month="6">
          ${header}
          ${grid}
        </RangeCalendar>
        <Description class="text-center">
          Fixed to 6 weeks per month to avoid layout shift
        </Description>
      </div>
    `,
  }),
};

export const AnchorUnavailableDates: Story = {
  render: (args) => ({
    components,
    setup: () => ({
      NEXT,
      PREVIOUS,
      args,
      // The predicate is handed the end the user pinned first, so what is available can narrow
      // once a range has started.
      isDateUnavailable: (date: DateValue, anchorDate: CalendarDate | null) =>
        anchorDate != null && Math.abs(date.compare(anchorDate)) > 7,
      minValue: today(getLocalTimeZone()),
    }),
    template: `
      <div class="flex flex-col items-center gap-4">
        <RangeCalendar
          v-bind="args"
          aria-label="Trip dates"
          :is-date-unavailable="isDateUnavailable"
          :min-value="minValue"
        >
          ${header}
          ${grid}
        </RangeCalendar>
        <Description class="text-center">
          After selecting a start date, only dates within 7 days are available
        </Description>
      </div>
    `,
  }),
};

export const AllowsNonContiguousRanges: Story = {
  render: (args) => ({
    components,
    setup: () => {
      const now = today(getLocalTimeZone());

      return {
        NEXT,
        PREVIOUS,
        args,
        defaultValue: { end: now.add({ days: 9 }), start: now.add({ days: 1 }) },
        isDateUnavailable: isBlocked,
      };
    },
    template: `
      <div class="flex flex-col items-center gap-4">
        <RangeCalendar
          v-bind="args"
          allows-non-contiguous-ranges
          aria-label="Trip dates"
          :default-value="defaultValue"
          :is-date-unavailable="isDateUnavailable"
        >
          ${header}
          ${grid}
        </RangeCalendar>
        <Description class="text-center">
          Non-contiguous ranges are allowed across unavailable dates
        </Description>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: (args) => ({
    components,
    setup: () => {
      const now = today(getLocalTimeZone());

      return { NEXT, PREVIOUS, args, defaultValue: { end: now.add({ days: 4 }), start: now } };
    },
    template: `
      <div class="flex flex-col items-center gap-4">
        <RangeCalendar
          v-bind="args"
          is-disabled
          aria-label="Trip dates"
          :default-value="defaultValue"
        >
          ${header}
          ${grid}
        </RangeCalendar>
        <Description class="text-center">Range calendar is disabled</Description>
      </div>
    `,
  }),
};

export const ReadOnly: Story = {
  render: (args) => ({
    components,
    setup: () => {
      const now = today(getLocalTimeZone());

      return { NEXT, PREVIOUS, args, defaultValue: { end: now.add({ days: 4 }), start: now } };
    },
    template: `
      <div class="flex flex-col items-center gap-4">
        <RangeCalendar
          v-bind="args"
          is-read-only
          aria-label="Trip dates"
          :default-value="defaultValue"
        >
          ${header}
          ${grid}
        </RangeCalendar>
        <Description class="text-center">Range calendar is read-only</Description>
      </div>
    `,
  }),
};

export const Invalid: Story = {
  render: (args) => ({
    components,
    setup: () => {
      const now = today(getLocalTimeZone());
      const value = shallowRef<DateRange>({
        end: now.add({ days: 14 }),
        start: now.add({ days: 6 }),
      });

      return {
        NEXT,
        PREVIOUS,
        args,
        isInvalid: computed(() => value.value.end.compare(value.value.start) > 7),
        value,
      };
    },
    template: `
      <div class="flex flex-col items-center gap-4">
        <RangeCalendar
          v-bind="args"
          aria-label="Trip dates"
          :is-invalid="isInvalid"
          :value="value"
          @update:value="value = $event"
        >
          ${header}
          ${grid}
        </RangeCalendar>
        <p v-if="isInvalid" class="text-sm text-danger">Maximum stay duration is 1 week</p>
        <Description v-else class="text-center">Select a stay of up to 7 days</Description>
      </div>
    `,
  }),
};

export const FocusedValue: Story = {
  render: (args) => ({
    components,
    setup: () => {
      const focusedValue = shallowRef<DateValue>(parseDate("2025-06-15"));

      return {
        NEXT,
        PREVIOUS,
        args,
        focusedValue,
        goTo: (date: string) => (focusedValue.value = parseDate(date)),
      };
    },
    template: `
      <div class="flex flex-col items-center gap-4">
        <RangeCalendar
          v-bind="args"
          aria-label="Trip dates"
          :focused-value="focusedValue"
          @update:focused-value="focusedValue = $event"
        >
          ${header}
          ${grid}
        </RangeCalendar>
        <Description class="text-center">Focused: {{ focusedValue.toString() }}</Description>
        <div class="flex flex-wrap justify-center gap-2">
          <Button size="sm" variant="secondary" @click="goTo('2025-01-01')">Go to Jan</Button>
          <Button size="sm" variant="secondary" @click="goTo('2025-06-15')">Go to Jun</Button>
          <Button size="sm" variant="secondary" @click="goTo('2025-12-25')">
            Go to Christmas
          </Button>
        </div>
      </div>
    `,
  }),
};

/** Days a demo event falls on, so the indicator has something to mark. */
const datesWithEvents = [3, 7, 12, 15, 21, 28];

export const WithIndicators: Story = {
  render: (args) => ({
    components,
    setup: () => ({
      NEXT,
      PREVIOUS,
      args,
      hasEvent: (date: DateValue) =>
        isToday(date, getLocalTimeZone()) || datesWithEvents.includes(date.day),
    }),
    template: `
      <RangeCalendar v-bind="args" aria-label="Trip dates">
        ${headerNavFirst}
        <RangeCalendarGrid>
          <RangeCalendarGridHeader>
            <template #default="{day}">
              <RangeCalendarHeaderCell>{{ day }}</RangeCalendarHeaderCell>
            </template>
          </RangeCalendarGridHeader>
          <RangeCalendarGridBody>
            <template #default="{date}">
              <RangeCalendarCell :date="date">
                <template #default="{formattedDate}">
                  {{ formattedDate }}
                  <RangeCalendarCellIndicator v-if="hasEvent(date)" />
                </template>
              </RangeCalendarCell>
            </template>
          </RangeCalendarGridBody>
        </RangeCalendarGrid>
      </RangeCalendar>
    `,
  }),
};

export const MultipleMonths: Story = {
  render: (args) => ({
    components,
    setup: () => ({ NEXT, PREVIOUS, args, secondMonth: { months: 1 } }),
    template: `
      <RangeCalendar
        v-bind="args"
        aria-label="Trip dates"
        class="@container-normal w-full max-w-none overflow-x-auto"
        :visible-duration="{months: 2}"
      >
        <div class="mx-auto flex w-max gap-8">
          <div class="w-64">
            <RangeCalendarHeader>
              <RangeCalendarNavButton v-bind="PREVIOUS" />
              <RangeCalendarHeading class="flex-none" />
              <div class="size-6" />
            </RangeCalendarHeader>
            ${grid}
          </div>
          <div class="w-64">
            <RangeCalendarHeader>
              <div class="size-6" />
              <RangeCalendarHeading class="flex-none" :offset="secondMonth" />
              <RangeCalendarNavButton v-bind="NEXT" />
            </RangeCalendarHeader>
            <RangeCalendarGrid :offset="secondMonth">
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
          </div>
        </div>
      </RangeCalendar>
    `,
  }),
};

export const ThreeMonths: Story = {
  render: (args) => ({
    components,
    setup: () => ({ NEXT, PREVIOUS, args, secondMonth: { months: 1 }, thirdMonth: { months: 2 } }),
    template: `
      <RangeCalendar
        v-bind="args"
        aria-label="Vacation planning"
        class="@container-normal w-auto overflow-x-auto"
        :visible-duration="{months: 3}"
      >
        <div class="flex w-max gap-7">
          <div class="w-64">
            <RangeCalendarHeader>
              <RangeCalendarNavButton v-bind="PREVIOUS" />
              <RangeCalendarHeading />
              <div class="size-6" />
            </RangeCalendarHeader>
            ${grid}
          </div>
          <div class="w-64">
            <RangeCalendarHeader>
              <div class="size-6" />
              <RangeCalendarHeading :offset="secondMonth" />
              <div class="size-6" />
            </RangeCalendarHeader>
            <RangeCalendarGrid :offset="secondMonth">
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
          </div>
          <div class="w-64">
            <RangeCalendarHeader>
              <div class="size-6" />
              <RangeCalendarHeading :offset="thirdMonth" />
              <RangeCalendarNavButton v-bind="NEXT" />
            </RangeCalendarHeader>
            <RangeCalendarGrid :offset="thirdMonth">
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
          </div>
        </div>
      </RangeCalendar>
    `,
  }),
};

/** A picker reads an option's label off the item rather than the key. */
const byName = (option: { name: string }) => option.name;

const DAY_VIEW_OPTIONS = [
  { id: "1", name: "1 day" },
  { id: "5", name: "5 days" },
  { id: "7", name: "7 days" },
  { id: "8", name: "8 days" },
  { id: "10", name: "10 days" },
  { id: "14", name: "14 days" },
  { id: "21", name: "21 days" },
];

const WEEK_VIEW_OPTIONS = [
  { id: "1", name: "1 week" },
  { id: "2", name: "2 weeks" },
  { id: "3", name: "3 weeks" },
  { id: "4", name: "4 weeks" },
  { id: "5", name: "5 weeks" },
  { id: "6", name: "6 weeks" },
  { id: "8", name: "8 weeks" },
];

export const DayView: Story = {
  render: (args) => ({
    components,
    setup: () => {
      const days = shallowRef("5");

      return {
        NEXT,
        PREVIOUS,
        args,
        byName,
        days,
        options: DAY_VIEW_OPTIONS,
        visibleDuration: computed(() => ({ days: Number(days.value) })),
      };
    },
    template: `
      <div class="flex flex-col items-center gap-6">
        <Select v-model:value="days" class="w-40" :item-text-value="byName" :items="options">
          <Label>Visible days</Label>
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
                :text-value="option.name"
              >
                {{ option.name }}
                <ListBoxItemIndicator />
              </ListBoxItem>
            </ListBox>
          </SelectPopover>
        </Select>
        <RangeCalendar v-bind="args" aria-label="Trip dates" :visible-duration="visibleDuration">
          ${header}
          ${grid}
        </RangeCalendar>
      </div>
    `,
  }),
};

export const WeekView: Story = {
  render: (args) => ({
    components,
    setup: () => {
      const weeks = shallowRef("1");

      return {
        NEXT,
        PREVIOUS,
        args,
        byName,
        options: WEEK_VIEW_OPTIONS,
        visibleDuration: computed(() => ({ weeks: Number(weeks.value) })),
        weeks,
      };
    },
    template: `
      <div class="flex flex-col items-center gap-6">
        <Select v-model:value="weeks" class="w-40" :item-text-value="byName" :items="options">
          <Label>Visible weeks</Label>
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
                :text-value="option.name"
              >
                {{ option.name }}
                <ListBoxItemIndicator />
              </ListBoxItem>
            </ListBox>
          </SelectPopover>
        </Select>
        <RangeCalendar v-bind="args" aria-label="Trip dates" :visible-duration="visibleDuration">
          ${header}
          ${grid}
        </RangeCalendar>
      </div>
    `,
  }),
};

export const InternationalCalendar: Story = {
  render: (args) => ({
    components,
    setup: () => {
      const now = today(getLocalTimeZone());

      return {
        NEXT,
        PREVIOUS,
        args,
        createCalendar,
        defaultValue: { end: now.add({ days: 7 }), start: now },
      };
    },
    template: `
      <I18nProvider locale="hi-IN-u-ca-indian">
        <RangeCalendar
          v-bind="args"
          aria-label="Trip dates"
          :create-calendar="createCalendar"
          :default-value="defaultValue"
        >
          ${yearPickerHeader}
          ${grid}
          ${yearPickerGrid}
        </RangeCalendar>
      </I18nProvider>
    `,
  }),
};

export const BookingCalendar: Story = {
  render: (args) => ({
    components,
    setup: () => {
      const value = shallowRef<DateRange | null>(null);
      const locale = useLocale();
      const blockedDates = [5, 6, 12, 13, 14, 20];

      return {
        NEXT,
        PREVIOUS,
        args,
        // A blocked date that is not already a weekend gets a dot, so the two reasons a day is
        // unavailable can be told apart.
        hasBlockedDot: (date: DateValue, isUnavailable: boolean) =>
          !isUnavailable &&
          !isWeekend(date, locale.value.locale) &&
          blockedDates.includes(date.day),
        isDateUnavailable: (date: DateValue) =>
          isWeekend(date, locale.value.locale) || blockedDates.includes(date.day),
        minValue: today(getLocalTimeZone()),
        summary: computed(() =>
          value.value ? `${value.value.start} -> ${value.value.end}` : null,
        ),
        value,
      };
    },
    template: `
      <div class="flex flex-col items-center gap-4">
        <RangeCalendar
          v-bind="args"
          aria-label="Booking range"
          :is-date-unavailable="isDateUnavailable"
          :min-value="minValue"
          :value="value"
          @update:value="value = $event"
        >
          ${headerNavFirst}
          <RangeCalendarGrid>
            <RangeCalendarGridHeader>
              <template #default="{day}">
                <RangeCalendarHeaderCell>{{ day }}</RangeCalendarHeaderCell>
              </template>
            </RangeCalendarGridHeader>
            <RangeCalendarGridBody>
              <template #default="{date}">
                <RangeCalendarCell :date="date">
                  <template #default="{formattedDate, isUnavailable}">
                    {{ formattedDate }}
                    <RangeCalendarCellIndicator v-if="hasBlockedDot(date, isUnavailable)" />
                  </template>
                </RangeCalendarCell>
              </template>
            </RangeCalendarGridBody>
          </RangeCalendarGrid>
        </RangeCalendar>
        <div class="flex flex-col gap-2 text-center">
          <div class="flex items-center justify-center gap-4 text-xs text-muted">
            <span class="flex items-center gap-1">
              <span class="size-2 rounded-full bg-muted" /> Blocked dates
            </span>
            <span class="flex items-center gap-1">
              <span class="size-2 rounded-full bg-default" /> Weekend/Unavailable
            </span>
          </div>
          <Button v-if="summary" size="sm" variant="primary">Book {{ summary }}</Button>
        </div>
      </div>
    `,
  }),
};
