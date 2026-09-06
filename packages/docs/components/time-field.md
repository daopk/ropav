---
title: TimeField
description: A time typed in segments, hours through to seconds.
outline: [2, 3]
---

# TimeField

A time field is a [DateField](/components/date-field) for the clock half: the same segmented
typing, the same parts under different names, applied to hours, minutes and seconds.

```ts
import { Label, TimeField, TimeFieldGroup, TimeFieldInput, TimeFieldSegment } from "ropav";
```

<Demo title="time-field-basic.vue">
<DemoTimeFieldBasic />

<template #code>

<<< @/.vitepress/theme/demos/time-field-basic.vue

</template>
</Demo>

Whether there is an AM/PM segment is the locale's decision, not yours: a 12-hour locale gets one
and a 24-hour locale does not, from the same markup. `granularity` chooses how far down the
segments go, so a field that only wants hours and minutes need not show seconds.

`min-value` and `max-value` bound the time, which is how an opening-hours field stops somebody
booking at three in the morning.

## Accessibility

- Each segment is a spin button. Arrows change the value under the cursor, and typing `9` in an
  hour segment moves on by itself rather than waiting for a second digit.
- The AM/PM segment is a segment like any other — arrows toggle it — so a reader never has to
  reach for a separate control to switch it.
- Name the field. "Start time" says what the clock is for; a bare time field beside another one
  leaves a reader guessing which end of the range they are in.

## API

<Api family="time-field" />
