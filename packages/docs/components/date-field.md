---
title: DateField
description: A date typed in segments, with no calendar attached.
outline: [2, 3]
---

# DateField

A date field is the typing half of a [DatePicker](/components/date-picker) on its own. Reach for
it where a calendar would be in the way — a date of birth is faster typed than paged back to, and
nobody wants to walk a grid through forty years.

```ts
import { DateField, DateFieldGroup, DateFieldInput, DateFieldSegment, Label } from "ropav";
```

`DateFieldInput` renders one `DateFieldSegment` per part of the date, in the order the reader's
locale writes them — so the same markup produces `MM/DD/YYYY` for one reader and `DD.MM.YYYY` for
another, without the app choosing.

<Demo title="date-field-basic.vue">
<DemoDateFieldBasic />

<template #code>

<<< @/.vitepress/theme/demos/date-field-basic.vue

</template>
</Demo>

`granularity` decides how far down the segments go — day, hour, minute or second — and
`hide-time-zone` drops the zone segment for a value that carries one.

The parts are shared with the [DateRangePicker](/components/date-range-picker) and the date
picker: they are the same components re-exported under each field's own name, so what you learn
about segments here holds in all three.

## Accessibility

- Each segment is its own spin button. Arrow keys change the segment under the cursor, typing
  fills it and moves on, and <kbd>Backspace</kbd> clears it — so a date can be entered without
  ever touching a calendar.
- The field is announced as one thing with the segments inside it, not as three unrelated inputs.
  The `Label` names the whole field.
- An incomplete date is not reported as invalid while it is being typed. That matters here more
  than in a plain text field, because the segments are filled one at a time and there is always a
  moment where the value is half-written.
- Segments are read in locale order, so a reader hears the date in the shape their locale uses
  rather than the order the markup happens to be in.

## API

<Api family="date-field" />
