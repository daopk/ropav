import type {StoryMeta} from "../../utils/story-meta";
import type {DateValue} from "@internationalized/date";
import type {StoryObj} from "@storybook/vue3";

import {
  getLocalTimeZone,
  isToday,
  isWeekend,
  parseDate,
  startOfMonth,
  startOfWeek,
  today,
} from "@internationalized/date";
import {computed, shallowRef} from "vue";

import {useLocale} from "../../composables/use-locale";
import {Button} from "../button";
import {ButtonGroup} from "../button-group";
import {
  CalendarYearPickerCell,
  CalendarYearPickerGrid,
  CalendarYearPickerGridBody,
  CalendarYearPickerTrigger,
  CalendarYearPickerTriggerHeading,
  CalendarYearPickerTriggerIndicator,
} from "../calendar-year-picker";
import {Description} from "../description";
import {I18nProvider} from "../i18n-provider";
import {Label} from "../label";
import {ListBoxRoot} from "../list-box";
import {ListBoxItemIndicator, ListBoxItemRoot} from "../list-box-item";
import {SelectIndicator, SelectPopover, SelectRoot, SelectTrigger, SelectValue} from "../select";

import {
  CalendarCell,
  CalendarCellIndicator,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeader,
  CalendarHeaderCell,
  CalendarHeading,
  CalendarNavButton,
  CalendarRoot,
} from "./index";

// Registered part by part: a story template is compiled at runtime, with no binding metadata to
// resolve `Calendar.Grid` through, so dot notation cannot be used here.
const components = {
  Button,
  ButtonGroup,
  CalendarCell,
  CalendarCellIndicator,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeader,
  CalendarHeaderCell,
  CalendarHeading,
  CalendarNavButton,
  CalendarRoot,
  CalendarYearPickerCell,
  CalendarYearPickerGrid,
  CalendarYearPickerGridBody,
  CalendarYearPickerTrigger,
  CalendarYearPickerTriggerHeading,
  CalendarYearPickerTriggerIndicator,
  Description,
  I18nProvider,
  Label,
  ListBox: ListBoxRoot,
  ListBoxItem: ListBoxItemRoot,
  ListBoxItemIndicator,
  Select: SelectRoot,
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
const PREVIOUS = {slot: "previous"} as const;
const NEXT = {slot: "next"} as const;

/** The grid and its cells, which nearly every story below repeats. */
const grid = `
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
`;

/** The header the shared template uses: the heading first, then both nav buttons. */
const header = `
  <CalendarHeader>
    <CalendarHeading />
    <CalendarNavButton v-bind="PREVIOUS" />
    <CalendarNavButton v-bind="NEXT" />
  </CalendarHeader>
`;

/** The header with the heading between the two nav buttons, as some stories arrange it. */
const headerNavFirst = `
  <CalendarHeader>
    <CalendarNavButton v-bind="PREVIOUS" />
    <CalendarHeading />
    <CalendarNavButton v-bind="NEXT" />
  </CalendarHeader>
`;

/** The header with the year-picker trigger in place of the heading. */
const yearPickerHeader = `
  <CalendarHeader>
    <CalendarYearPickerTrigger>
      <CalendarYearPickerTriggerHeading />
      <CalendarYearPickerTriggerIndicator />
    </CalendarYearPickerTrigger>
    <CalendarNavButton v-bind="PREVIOUS" />
    <CalendarNavButton v-bind="NEXT" />
  </CalendarHeader>
`;

/** The year grid, with one plain cell per year. */
const yearPickerGrid = `
  <CalendarYearPickerGrid>
    <CalendarYearPickerGridBody>
      <template #default="{year}">
        <CalendarYearPickerCell :year="year" />
      </template>
    </CalendarYearPickerGridBody>
  </CalendarYearPickerGrid>
`;

const meta: StoryMeta = {
  argTypes: {
    isDisabled: {control: "boolean"},
    isReadOnly: {control: "boolean"},
    selectionMode: {control: "select", options: ["single", "multiple"]},
    weeksInMonth: {control: {max: 6, min: 4, step: 1, type: "number"}},
  },
  component: CalendarRoot,
  parameters: {
    layout: "centered",
  },
  title: "Components/Date and Time/Calendar",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({NEXT, PREVIOUS, args}),
    template: `
      <CalendarRoot v-bind="args" aria-label="Event date">
        ${header}
        ${grid}
      </CalendarRoot>
    `,
  }),
};

export const WithYearPicker: Story = {
  render: (args) => ({
    components,
    setup: () => ({NEXT, PREVIOUS, args}),
    template: `
      <CalendarRoot v-bind="args" aria-label="Event date">
        ${yearPickerHeader}
        ${grid}
        ${yearPickerGrid}
      </CalendarRoot>
    `,
  }),
};

export const DefaultValue: Story = {
  render: (args) => ({
    components,
    setup: () => ({NEXT, PREVIOUS, args, defaultValue: parseDate("2025-02-14")}),
    template: `
      <CalendarRoot v-bind="args" aria-label="Event date" :default-value="defaultValue">
        ${header}
        ${grid}
      </CalendarRoot>
    `,
  }),
};

export const Controlled: Story = {
  render: (args) => ({
    components,
    setup: () => {
      const value = shallowRef<DateValue | null>(null);
      const focusedValue = shallowRef<DateValue>(parseDate("2025-12-25"));
      const locale = useLocale();

      const goTo = (date: DateValue) => {
        value.value = date;
        focusedValue.value = date;
      };

      return {
        NEXT,
        PREVIOUS,
        args,
        focusedValue,
        goTo,
        goToChristmas: () => goTo(parseDate("2025-12-25")),
        goToNextMonth: () => goTo(startOfMonth(today(getLocalTimeZone()).add({months: 1}))),
        goToNextWeek: () =>
          goTo(startOfWeek(today(getLocalTimeZone()).add({weeks: 1}), locale.value.locale)),
        goToToday: () => goTo(today(getLocalTimeZone())),
        selected: computed(() => value.value?.toString() ?? "(none)"),
        value,
      };
    },
    template: `
      <div class="flex flex-col items-center gap-4">
        <ButtonGroup variant="tertiary">
          <Button @click="goToToday">Today</Button>
          <Button @click="goToNextWeek">Next week</Button>
          <Button @click="goToNextMonth">Next month</Button>
        </ButtonGroup>
        <CalendarRoot
          v-bind="args"
          aria-label="Event date"
          :focused-value="focusedValue"
          :value="value"
          @update:focused-value="focusedValue = $event"
          @update:value="value = $event"
        >
          ${header}
          ${grid}
        </CalendarRoot>
        <Description class="text-center">Selected date: {{ selected }}</Description>
        <div class="flex gap-2">
          <Button size="sm" variant="secondary" @click="goToToday">Set Today</Button>
          <Button size="sm" variant="secondary" @click="goToChristmas">Set Christmas</Button>
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

      return {NEXT, PREVIOUS, args, maxValue: now.add({months: 3}), minValue: now};
    },
    template: `
      <div class="flex flex-col items-center gap-4">
        <CalendarRoot
          v-bind="args"
          aria-label="Appointment date"
          :max-value="maxValue"
          :min-value="minValue"
        >
          <CalendarHeader>
            <CalendarNavButton v-bind="PREVIOUS" />
            <CalendarYearPickerTrigger>
              <CalendarYearPickerTriggerHeading />
              <CalendarYearPickerTriggerIndicator />
            </CalendarYearPickerTrigger>
            <CalendarNavButton v-bind="NEXT" />
          </CalendarHeader>
          ${grid}
          ${yearPickerGrid}
        </CalendarRoot>
        <Description class="text-center">
          Select a date between today and {{ maxValue.toString() }}
        </Description>
      </div>
    `,
  }),
};

export const UnavailableDates: Story = {
  render: (args) => ({
    components,
    setup: () => {
      const locale = useLocale();

      return {
        NEXT,
        PREVIOUS,
        args,
        isDateUnavailable: (date: DateValue) => isWeekend(date, locale.value.locale),
      };
    },
    template: `
      <div class="flex flex-col items-center gap-4">
        <CalendarRoot
          v-bind="args"
          aria-label="Appointment date"
          :is-date-unavailable="isDateUnavailable"
        >
          ${header}
          ${grid}
        </CalendarRoot>
        <Description class="text-center">Weekends are unavailable</Description>
      </div>
    `,
  }),
};

export const WeeksInMonth: Story = {
  render: (args) => ({
    components,
    setup: () => ({NEXT, PREVIOUS, args}),
    template: `
      <div class="flex flex-col items-center gap-4">
        <CalendarRoot v-bind="args" aria-label="Event date" :weeks-in-month="6">
          ${header}
          ${grid}
        </CalendarRoot>
        <Description class="text-center">
          Fixed to 6 weeks per month to avoid layout shift
        </Description>
      </div>
    `,
  }),
};

export const MultipleSelection: Story = {
  render: (args) => ({
    components,
    setup: () => {
      const value = shallowRef<DateValue[]>([]);

      return {
        NEXT,
        PREVIOUS,
        args,
        summary: computed(() =>
          value.value.length ? `${value.value.length} date(s) selected` : "Select multiple dates",
        ),
        value,
      };
    },
    template: `
      <div class="flex flex-col items-center gap-4">
        <CalendarRoot
          v-bind="args"
          aria-label="Event dates"
          selection-mode="multiple"
          :value="value"
          @update:value="value = $event"
        >
          ${header}
          ${grid}
        </CalendarRoot>
        <Description class="text-center">{{ summary }}</Description>
      </div>
    `,
  }),
};

export const CustomUnavailableDates: Story = {
  render: (args) => ({
    components,
    setup: () => {
      // Blocked dates: holidays, already-booked days, and so on.
      const blockedDates = [
        parseDate("2025-02-14"),
        parseDate("2025-02-17"),
        parseDate("2025-03-17"),
      ];

      return {
        NEXT,
        PREVIOUS,
        args,
        isDateUnavailable: (date: DateValue) =>
          blockedDates.some(
            (blocked) =>
              blocked.year === date.year &&
              blocked.month === date.month &&
              blocked.day === date.day,
          ),
      };
    },
    template: `
      <div class="flex flex-col items-center gap-4">
        <CalendarRoot v-bind="args" aria-label="Event date" :is-date-unavailable="isDateUnavailable">
          ${header}
          ${grid}
        </CalendarRoot>
        <Description class="text-center">
          Feb 14, Feb 17, and Mar 17 are unavailable
        </Description>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: (args) => ({
    components,
    setup: () => ({NEXT, PREVIOUS, args, defaultValue: today(getLocalTimeZone())}),
    template: `
      <div class="flex flex-col items-center gap-4">
        <CalendarRoot
          v-bind="args"
          aria-label="Event date"
          :default-value="defaultValue"
          is-disabled
        >
          ${header}
          ${grid}
        </CalendarRoot>
        <Description class="text-center">Calendar is disabled</Description>
      </div>
    `,
  }),
};

export const ReadOnly: Story = {
  render: (args) => ({
    components,
    setup: () => ({NEXT, PREVIOUS, args, defaultValue: today(getLocalTimeZone())}),
    template: `
      <div class="flex flex-col items-center gap-4">
        <CalendarRoot
          v-bind="args"
          aria-label="Event date"
          :default-value="defaultValue"
          is-read-only
        >
          ${header}
          ${grid}
        </CalendarRoot>
        <Description class="text-center">Calendar is read-only</Description>
      </div>
    `,
  }),
};

export const Invalid: Story = {
  render: (args) => ({
    components,
    setup: () => {
      const value = shallowRef<DateValue | null>(parseDate("2025-01-15"));
      const minDate = today(getLocalTimeZone());

      return {
        NEXT,
        PREVIOUS,
        args,
        isInvalid: computed(() => value.value !== null && value.value.compare(minDate) < 0),
        value,
      };
    },
    template: `
      <div class="flex flex-col items-center gap-4">
        <CalendarRoot
          v-bind="args"
          aria-label="Event date"
          :is-invalid="isInvalid"
          :value="value"
          @update:value="value = $event"
        >
          ${header}
          ${grid}
        </CalendarRoot>
        <p v-if="isInvalid" class="text-sm text-danger">Date must be today or in the future</p>
        <Description v-else class="text-center">Select a future date</Description>
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
        goTo: (iso: string) => (focusedValue.value = parseDate(iso)),
      };
    },
    template: `
      <div class="flex flex-col items-center gap-4">
        <CalendarRoot
          v-bind="args"
          aria-label="Event date"
          :focused-value="focusedValue"
          @update:focused-value="focusedValue = $event"
        >
          ${header}
          ${grid}
        </CalendarRoot>
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

export const WithIndicators: Story = {
  render: (args) => ({
    components,
    setup: () => ({
      NEXT,

      PREVIOUS,

      args,
      // Sample dates that have events, for the demo.
      hasEvent: (date: DateValue) =>
        isToday(date, getLocalTimeZone()) || [3, 7, 12, 15, 21, 28].includes(date.day),
    }),
    template: `
      <CalendarRoot v-bind="args" aria-label="Event date">
        ${headerNavFirst}
        <CalendarGrid>
          <CalendarGridHeader>
            <template #default="{day}">
              <CalendarHeaderCell>{{ day }}</CalendarHeaderCell>
            </template>
          </CalendarGridHeader>
          <CalendarGridBody>
            <template #default="{date}">
              <CalendarCell :date="date">
                <template #default="{formattedDate}">
                  {{ formattedDate }}
                  <CalendarCellIndicator v-if="hasEvent(date)" />
                </template>
              </CalendarCell>
            </template>
          </CalendarGridBody>
        </CalendarGrid>
      </CalendarRoot>
    `,
  }),
};

export const TodayIndicator: Story = {
  render: (args) => ({
    components,
    setup: () => ({
      NEXT,
      PREVIOUS,
      args,
      defaultValue: today(getLocalTimeZone()),
      isCurrentDay: (date: DateValue) => isToday(date, getLocalTimeZone()),
    }),
    template: `
      <CalendarRoot v-bind="args" aria-label="Event date" :default-value="defaultValue">
        ${headerNavFirst}
        <CalendarGrid>
          <CalendarGridHeader>
            <template #default="{day}">
              <CalendarHeaderCell>{{ day }}</CalendarHeaderCell>
            </template>
          </CalendarGridHeader>
          <CalendarGridBody>
            <template #default="{date}">
              <CalendarCell :date="date">
                <template #default="{formattedDate}">
                  {{ formattedDate }}
                  <CalendarCellIndicator v-if="isCurrentDay(date)" />
                </template>
              </CalendarCell>
            </template>
          </CalendarGridBody>
        </CalendarGrid>
      </CalendarRoot>
    `,
  }),
};

export const MultipleMonths: Story = {
  render: (args) => ({
    components,
    setup: () => ({NEXT, PREVIOUS, args, secondMonth: {months: 1}, twoMonths: {months: 2}}),
    template: `
      <CalendarRoot
        v-bind="args"
        aria-label="Trip dates"
        class="@container-normal w-full max-w-none overflow-x-auto"
        :visible-duration="twoMonths"
      >
        <div class="mx-auto flex w-max gap-8">
          <div class="w-64">
            <CalendarHeader>
              <CalendarNavButton v-bind="PREVIOUS" />
              <CalendarHeading class="flex-none" />
              <div class="size-6" />
            </CalendarHeader>
            ${grid}
          </div>
          <div class="w-64">
            <CalendarHeader>
              <div class="size-6" />
              <CalendarHeading class="flex-none" :offset="secondMonth" />
              <CalendarNavButton v-bind="NEXT" />
            </CalendarHeader>
            <CalendarGrid :offset="secondMonth">
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
          </div>
        </div>
      </CalendarRoot>
    `,
  }),
};

/** A picker reads an option's label off the item rather than the key. */
const byName = (option: {name: string}) => option.name;

const DAY_VIEW_OPTIONS = [
  {id: "1", name: "1 day"},
  {id: "5", name: "5 days"},
  {id: "7", name: "7 days"},
  {id: "8", name: "8 days"},
  {id: "10", name: "10 days"},
  {id: "14", name: "14 days"},
  {id: "21", name: "21 days"},
];

const WEEK_VIEW_OPTIONS = [
  {id: "1", name: "1 week"},
  {id: "2", name: "2 weeks"},
  {id: "3", name: "3 weeks"},
  {id: "4", name: "4 weeks"},
  {id: "5", name: "5 weeks"},
  {id: "6", name: "6 weeks"},
  {id: "8", name: "8 weeks"},
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
        visibleDuration: computed(() => ({days: Number(days.value)})),
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
        <CalendarRoot v-bind="args" aria-label="Day view" :visible-duration="visibleDuration">
          <CalendarHeader>
            <CalendarHeading />
            <CalendarNavButton v-bind="PREVIOUS" />
            <CalendarNavButton v-bind="NEXT" />
          </CalendarHeader>
          ${grid}
        </CalendarRoot>
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
        visibleDuration: computed(() => ({weeks: Number(weeks.value)})),
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
        <CalendarRoot v-bind="args" aria-label="Week view" :visible-duration="visibleDuration">
          <CalendarHeader>
            <CalendarHeading />
            <CalendarNavButton v-bind="PREVIOUS" />
            <CalendarNavButton v-bind="NEXT" />
          </CalendarHeader>
          ${grid}
        </CalendarRoot>
      </div>
    `,
  }),
};

export const InternationalCalendar: Story = {
  render: (args) => ({
    components,
    setup: () => ({NEXT, PREVIOUS, args, defaultValue: today(getLocalTimeZone())}),
    template: `
      <I18nProvider locale="hi-IN-u-ca-indian">
        <CalendarRoot v-bind="args" aria-label="Event date" :default-value="defaultValue">
          ${yearPickerHeader}
          ${grid}
          ${yearPickerGrid}
        </CalendarRoot>
      </I18nProvider>
    `,
  }),
};

export const ThreeMonths: Story = {
  render: (args) => ({
    components,
    setup: () => ({
      NEXT,
      PREVIOUS,
      args,
      secondMonth: {months: 1},
      thirdMonth: {months: 2},
      threeMonths: {months: 3},
    }),
    template: `
      <CalendarRoot
        v-bind="args"
        aria-label="Vacation planning"
        class="@container-normal w-auto overflow-x-auto"
        :visible-duration="threeMonths"
      >
        <div class="flex w-max gap-7">
          <div class="w-64">
            <CalendarHeader>
              <CalendarNavButton v-bind="PREVIOUS" />
              <CalendarHeading />
              <div class="size-6" />
            </CalendarHeader>
            ${grid}
          </div>
          <div class="w-64">
            <CalendarHeader>
              <div class="size-6" />
              <CalendarHeading :offset="secondMonth" />
              <div class="size-6" />
            </CalendarHeader>
            <CalendarGrid :offset="secondMonth">
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
          </div>
          <div class="w-64">
            <CalendarHeader>
              <div class="size-6" />
              <CalendarHeading :offset="thirdMonth" />
              <CalendarNavButton v-bind="NEXT" />
            </CalendarHeader>
            <CalendarGrid :offset="thirdMonth">
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
          </div>
        </div>
      </CalendarRoot>
    `,
  }),
};

export const BookingCalendar: Story = {
  render: (args) => ({
    components,
    setup: () => {
      const value = shallowRef<DateValue | null>(null);
      const locale = useLocale();
      // Simulated booked dates.
      const bookedDates = [5, 6, 12, 13, 14, 20];

      return {
        NEXT,
        PREVIOUS,
        args,
        hasBooking: (date: DateValue) => bookedDates.includes(date.day),
        isDateUnavailable: (date: DateValue) =>
          isWeekend(date, locale.value.locale) || bookedDates.includes(date.day),
        isWeekendDay: (date: DateValue) => isWeekend(date, locale.value.locale),
        minValue: today(getLocalTimeZone()),
        value,
      };
    },
    template: `
      <div class="flex flex-col items-center gap-4">
        <CalendarRoot
          v-bind="args"
          aria-label="Booking date"
          :is-date-unavailable="isDateUnavailable"
          :min-value="minValue"
          :value="value"
          @update:value="value = $event"
        >
          ${headerNavFirst}
          <CalendarGrid>
            <CalendarGridHeader>
              <template #default="{day}">
                <CalendarHeaderCell>{{ day }}</CalendarHeaderCell>
              </template>
            </CalendarGridHeader>
            <CalendarGridBody>
              <template #default="{date}">
                <CalendarCell :date="date">
                  <template #default="{formattedDate, isUnavailable}">
                    {{ formattedDate }}
                    <CalendarCellIndicator
                      v-if="!isUnavailable && !isWeekendDay(date) && hasBooking(date)"
                    />
                  </template>
                </CalendarCell>
              </template>
            </CalendarGridBody>
          </CalendarGrid>
        </CalendarRoot>
        <div class="flex flex-col gap-2 text-center">
          <div class="flex items-center justify-center gap-4 text-xs text-muted">
            <span class="flex items-center gap-1">
              <span class="size-2 rounded-full bg-muted" /> Has bookings
            </span>
            <span class="flex items-center gap-1">
              <span class="size-2 rounded-full bg-default" /> Weekend/Unavailable
            </span>
          </div>
          <Button v-if="value" size="sm" variant="primary">Book {{ value.toString() }}</Button>
        </div>
      </div>
    `,
  }),
};

export const YearPicker: Story = {
  render: (args) => ({
    components,
    setup: () => ({NEXT, PREVIOUS, args}),
    template: `
      <CalendarRoot v-bind="args" aria-label="Event date">
        ${yearPickerHeader}
        ${grid}
        ${yearPickerGrid}
      </CalendarRoot>
    `,
  }),
};

export const YearPickerStyledCells: Story = {
  render: (args) => ({
    components,
    setup: () => ({NEXT, PREVIOUS, args}),
    template: `
      <CalendarRoot v-bind="args" aria-label="Event date with styled year cells">
        ${yearPickerHeader}
        ${grid}
        <CalendarYearPickerGrid>
          <CalendarYearPickerGridBody>
            <template #default="{isCurrentYear, isSelected, year}">
              <CalendarYearPickerCell
                :class="
                  isCurrentYear && !isSelected
                    ? 'text-accent ring-1 ring-accent/60 ring-inset'
                    : undefined
                "
                :year="year"
              />
            </template>
          </CalendarYearPickerGridBody>
        </CalendarYearPickerGrid>
      </CalendarRoot>
    `,
  }),
};

export const YearPickerCustomCells: Story = {
  render: (args) => ({
    components,
    setup: () => ({NEXT, PREVIOUS, args}),
    template: `
      <CalendarRoot v-bind="args" aria-label="Event date with custom year cells">
        ${yearPickerHeader}
        ${grid}
        <CalendarYearPickerGrid>
          <CalendarYearPickerGridBody>
            <template #default="{isCurrentYear, isSelected, year}">
              <CalendarYearPickerCell :year="year">
                <span class="inline-flex items-center gap-1">
                  <span>{{ year }}</span>
                  <span
                    v-if="isCurrentYear"
                    :class="isSelected ? 'text-accent-foreground' : 'text-accent'"
                  >
                    Now
                  </span>
                </span>
              </CalendarYearPickerCell>
            </template>
          </CalendarYearPickerGridBody>
        </CalendarYearPickerGrid>
      </CalendarRoot>
    `,
  }),
};

export const CustomNavIcons: Story = {
  render: (args) => ({
    components,
    setup: () => ({NEXT, PREVIOUS, args}),
    template: `
      <CalendarRoot v-bind="args" aria-label="Event date">
        <CalendarHeader>
          <CalendarNavButton v-bind="PREVIOUS">
            <svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6l6 6z" fill="currentColor" />
            </svg>
          </CalendarNavButton>
          <CalendarHeading />
          <CalendarNavButton v-bind="NEXT">
            <svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6l6 6l-6 6z" fill="currentColor" />
            </svg>
          </CalendarNavButton>
        </CalendarHeader>
        ${grid}
      </CalendarRoot>
    `,
  }),
};

export const EventCalendar: Story = {
  render: (args) => ({
    components,
    setup: () => {
      // Sample events data.
      const events: Record<number, {title: string; color: string}[]> = {
        12: [
          {color: "bg-green-500", title: "Lunch"},
          {color: "bg-purple-500", title: "Review"},
        ],
        15: [{color: "bg-orange-500", title: "Conference"}],
        21: [{color: "bg-pink-500", title: "Workshop"}],
        28: [{color: "bg-cyan-500", title: "Demo Day"}],
        3: [{color: "bg-blue-500", title: "Team Meeting"}],
        7: [{color: "bg-red-500", title: "Project Deadline"}],
      };

      return {NEXT, PREVIOUS, args, hasEvent: (date: DateValue) => Boolean(events[date.day])};
    },
    template: `
      <div class="flex flex-col items-center gap-4">
        <CalendarRoot v-bind="args" aria-label="Event calendar">
          <CalendarHeader>
            <CalendarHeading />
            <CalendarNavButton v-bind="PREVIOUS" />
            <CalendarNavButton v-bind="NEXT" />
          </CalendarHeader>
          <CalendarGrid>
            <CalendarGridHeader>
              <template #default="{day}">
                <CalendarHeaderCell>{{ day }}</CalendarHeaderCell>
              </template>
            </CalendarGridHeader>
            <CalendarGridBody>
              <template #default="{date}">
                <CalendarCell :date="date">
                  <template #default="{formattedDate}">
                    {{ formattedDate }}
                    <CalendarCellIndicator v-if="hasEvent(date)" />
                  </template>
                </CalendarCell>
              </template>
            </CalendarGridBody>
          </CalendarGrid>
        </CalendarRoot>
        <div class="flex flex-col gap-1 text-xs text-muted">
          <p>Dates with indicators have scheduled events</p>
        </div>
      </div>
    `,
  }),
};
