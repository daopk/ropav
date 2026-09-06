---
title: RangeCalendar
description: A month grid for choosing a start and an end together.
outline: [2, 3]
---

# RangeCalendar

A range calendar picks two dates that belong to each other — a stay, a reporting period. Every
part mirrors the [Calendar](/components/calendar)'s under its own name, because the grid is the
same grid; what differs is that the selection has two ends and the days between them are shown as
part of it.

```ts
import {
  RangeCalendar,
  RangeCalendarCell,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHeader,
  RangeCalendarHeader,
  RangeCalendarHeading,
  RangeCalendarNavButton,
} from "ropav";
```

<Demo title="range-calendar-basic.vue">
<DemoRangeCalendarBasic />

<template #code>

<<< @/.vitepress/theme/demos/range-calendar-basic.vue

</template>
</Demo>

The first press sets the start, the second the end, and hovering between the two previews the
range. Pressing again starts over rather than extending, which is what stops a reader who
mis-clicked from having to undo in a particular order.

## Bounds and gaps

`min-value` and `max-value` bound the whole range, and `is-date-unavailable` rules out days inside
it. A range cannot span an unavailable day: the end is capped before it, so the reader cannot
select over a blackout period and only find out on submit.

`visible-duration` showing two months at once is the usual choice here — a range that crosses a
month boundary is hard to judge one month at a time.

## Accessibility

- The two ends are announced as a range rather than as two separate dates, so a reader is told
  what they have selected and not merely where the cursor is.
- Name the calendar. "Stay" or "Reporting period" tells a reader what the two ends mean; "Range"
  tells them what they already know.
- The days between the ends are shown as part of the selection and announced that way, which is
  what makes a range readable without seeing the highlight across the grid.

## API

<Api family="range-calendar" />
