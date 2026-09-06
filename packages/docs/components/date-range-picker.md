---
title: DateRangePicker
description: Two dates, typed or picked from one calendar.
outline: [2, 3]
---

# DateRangePicker

A date range picker is a [DatePicker](/components/date-picker) with two ends: two segmented fields
side by side, and a [RangeCalendar](/components/range-calendar) in the popover behind them. It is
the shape for a stay, a reporting period, a leave request — anything where the two dates are one
answer.

```ts
import {
  DateRangePicker,
  DateRangePickerGroup,
  DateRangePickerInput,
  DateRangePickerPopover,
  DateRangePickerRangeSeparator,
  DateRangePickerSegment,
  DateRangePickerTrigger,
} from "ropav";
```

Two `DateRangePickerInput`s, marked `slot="start"` and `slot="end"`, with a
`DateRangePickerRangeSeparator` between them. Everything else matches the date picker.

<Demo title="date-range-picker-basic.vue">
<DemoDateRangePickerBasic />

<template #code>

<<< @/.vitepress/theme/demos/date-range-picker-basic.vue

</template>
</Demo>

## Submitting two values

`start-name` and `end-name` are what the two ends submit under — two form fields, because that is
what a server expects, even though the reader answered one question.

`min-value`, `max-value` and `is-date-unavailable` apply to the whole range, and the calendar
enforces them on both ends at once.

## Accessibility

- The two fields are separate controls with their own segments, so a reader tabs from the start to
  the end the way they would through any pair of fields.
- The separator between them is decoration. What tells a reader which end they are in is the
  field's own name, so label them — `aria-label` on each input where one shared `Label` above the
  group is not enough.
- The picker announces the range as a whole once both ends are set, which is what confirms the
  answer rather than leaving the reader to hold two dates in their head.
- Everything the range calendar offers is reachable from the fields alone: the popover is a
  convenience, never the only route.

## API

<Api family="date-range-picker" />
