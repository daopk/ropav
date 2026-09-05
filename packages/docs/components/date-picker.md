---
title: DatePicker
description: A date, typed in segments or picked from a calendar.
outline: [2, 3]
---

# DatePicker

A date picker is two inputs in one: a segmented field that can be typed into, and a calendar for
picking. Neither is a fallback for the other — typing is faster for a date you know, and the
calendar is faster for one you are choosing.

```ts
import { DatePicker, DatePickerGroup, DatePickerInput } from "ropav";
```

## The field and the calendar

`DatePickerInput` renders one `DatePickerSegment` per part of the date, in the order the reader's
locale writes them. `DatePickerPopover` holds a `Calendar`, which is a component in its own right.

<Demo title="date-picker-basic.vue">
<DemoDatePickerBasic />

<template #code>

<<< @/.vitepress/theme/demos/date-picker-basic.vue

</template>
</Demo>

There is a lot of markup here, and that is the trade: every part is yours to place, so a picker
with a year jump, a two-month calendar or a footer is composition rather than a prop.

## Calendars other than Gregorian

A date picker builds a Gregorian calendar until it is told otherwise, which keeps the other
systems out of the bundle for the projects that never need them. Passing a calendar system is
what pulls it in — see [Calendar systems](/guide/calendar-systems).

## Accessibility

- The segments are one control: arrow keys change the segment under the cursor, left and right
  move between them, and typing digits fills them in.
- The value is announced as a whole date, not as three numbers.
- The popover traps focus while it is open and returns it to the field on close.

## API

<Api family="date-picker" />
