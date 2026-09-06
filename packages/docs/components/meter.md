---
title: Meter
description: A quantity inside a known range, like storage used or budget spent.
outline: [2, 3]
---

# Meter

A meter is a measurement that happens to be somewhere in its range: disk used, budget spent, seats
filled. It is not going anywhere — that is what separates it from a
[ProgressBar](/components/progress-bar), which is a task on its way to finishing. The tell is that
a meter has no indeterminate state; a quantity you cannot measure is not a quantity yet.

```ts
import { Label, Meter, MeterFill, MeterOutput, MeterTrack } from "ropav";
```

The parts mirror the bar's: `MeterTrack` is the groove, `MeterFill` shows how much of it is taken,
`MeterOutput` prints the value, and a `Label` says what is being measured.

::: playground meter
:::

## Colour as a threshold

A meter is usually read at a glance, so the colour is doing the work: green while there is room,
amber when it is getting tight, red when it is not. Derive it from the value rather than writing
it per row, so the thresholds live in one place.

<Demo title="meter-thresholds.vue">
<DemoMeterThresholds />

<template #code>

<<< @/.vitepress/theme/demos/meter-thresholds.vue

</template>
</Demo>

## Accessibility

- The role is written as a fallback list, `meter progressbar`, because `meter` is not supported
  everywhere. Software that knows the role reads out a level; software that does not lands on a
  progress bar rather than on nothing at all.
- Colour is a threshold and never the message. The output beside the label is what says 94%; the
  red says it faster to a reader who can see it, and nothing at all to one who cannot.
- `format-options` sets how the value reads. A percentage suits a proportion; bytes or a count
  suit a quantity the reader thinks about in those terms, and `value-label` replaces the text
  where neither fits.

## API

<Api family="meter" />
