---
title: Scheduling
description: A date and a time held separately, joined into one instant only where it is needed.
outline: [2, 3]
---

# Scheduling

A booking is two values, not one. [DatePicker](/components/date-picker) holds the day and
[TimeField](/components/time-field) holds the clock time, each with its own segments and its own
keyboard; joining them into a single instant is the screen's job, and it happens once, at the
point something actually needs an instant.

```ts
import { DatePicker, FieldGroup, TimeField } from "ropav";
```

<Demo full open title="scheduling.vue">
<PatternScheduling />

<template #code>

<<< @/.vitepress/theme/patterns/scheduling.vue

</template>
</Demo>

## The values come from the date package

A date field does not hold a `Date`. It holds a calendar value — a year, a month and a day with no
timezone attached — which is what lets the same field work in a calendar that is not Gregorian.
`today`, `Time` and `toCalendarDateTime` come from the same package the library reads them with,
and [calendar systems](/guide/calendar-systems) is where the rest of it is set out.

## Refusing a day, twice

`min-value` and `is-date-unavailable` do two different jobs. `min-value` bounds the range the
segments will even count to; `is-date-unavailable` answers per day, which is how a weekend is
refused without refusing the days around it. Both mark the field invalid rather than silently
correcting it, so a value typed into the segments is judged the same way as one picked from the
calendar.

## Which days are the weekend is a locale question

`isWeekend` takes a locale because the answer changes with it — Saturday and Sunday in much of the
world, Friday and Saturday in much of the Middle East. `useLocale` returns the one in force below
the nearest provider, falling back to the browser's, so the rule follows the reader rather than the
author.

## Accessibility

- A date field is a group of segments, each its own stop with the arrow keys stepping its value.
  It is not a text input, and nothing has to be parsed to be understood.
- The calendar in the popover takes an `aria-label`. The field's own label names the field, not
  the grid that opened over it.
- An unavailable day is marked as such rather than removed, so a reader arrowing across the grid
  is told why it cannot be chosen instead of finding a gap.
