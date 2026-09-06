---
title: Calendar
description: A month grid for choosing a date.
outline: [2, 3]
---

# Calendar

A calendar is the month grid on its own. Most of the time you want it inside a
[DatePicker](/components/date-picker), which pairs it with a field that can be typed into; use it
directly where the calendar *is* the page — a booking screen, a schedule.

```ts
import {
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeader,
  CalendarHeading,
  CalendarNavButton,
} from "ropav";
```

The parts split the grid from its chrome: `CalendarHeader` holds the heading and the two
`CalendarNavButton`s (which take `slot="previous"` and `slot="next"`), and `CalendarGrid` holds
the weekday row and the days. `CalendarGridBody` hands each date to its slot, so a cell can be
rendered however the app needs.

<Demo title="calendar-basic.vue">
<DemoCalendarBasic />

<template #code>

<<< @/.vitepress/theme/demos/calendar-basic.vue

</template>
</Demo>

## What can be chosen

`min-value` and `max-value` bound the range. `is-date-unavailable` rules out individual dates
inside it — weekends, days already booked — which is a different thing from disabling the
calendar: the grid still works, those days just cannot be taken.

`selection-mode` takes one date or several. For a start and an end that belong together, use a
[RangeCalendar](/components/range-calendar) rather than multiple selection.

## How much is on screen

`visible-duration` decides how many months show at once and is also what paging moves by, so a
two-month calendar steps two months. `page-behavior` chooses between moving a whole page and
moving one unit. `weeks-in-month` fixes the number of rows, which stops the grid changing height
as the reader pages through months of different shapes.

`first-day-of-week` overrides the locale, and `create-calendar` swaps the calendar system —
injectable so a build can ship fewer of them than the full set.

## Accessibility

- The grid is a real table with a `role="grid"`, so the arrow keys move by day and week the way a
  reader expects, and each cell announces its date and its state.
- Give it an `aria-label`. "Event date" tells a reader what the grid is for; without one they get
  a grid of numbers and have to work it out.
- An unavailable date is announced as such rather than simply not responding, which is the
  difference between "you cannot pick that" and a control that seems broken.
- The heading is what tells a reader which month they have paged into. Keep it, even when the
  months are obvious on screen.

## API

<Api family="calendar" />
