---
title: SegmentedControl
description: A few mutually exclusive choices, laid out as one track.
outline: [2, 3]
---

# SegmentedControl

A segmented control shows every option at once and keeps exactly one of them chosen. It suits a
small, stable set — a date range, a view mode — where seeing the alternatives is worth the room
they take. More than about five, or a set that changes, wants a [Select](/components/select).

```ts
import { SegmentedControl, SegmentedControlIndicator, SegmentedControlItem } from "ropav";
```

Each `SegmentedControlItem` takes an `id`, which is what the selection reports.
`SegmentedControlIndicator` is the sliding highlight behind the chosen segment.

::: playground segmented-control
:::

The `id` deliberately does not reach the DOM as an `id` attribute — it surfaces as `data-key`
instead, so two controls that both have a `weekly` segment cannot collide.

## Choosing and disabling

`default-selected-key` starts the control somewhere; without one it falls back to the first
segment that is not disabled, so a segmented control is never in a state with nothing chosen.
`selected-key` with `selection-change` hands the choice to the caller.

`disabled-keys` takes individual segments out, and `is-disabled` freezes the whole control — the
selection stays visible but cannot be moved, which is the right shape for a read-only view.

The track lands on 32, 36 and 40 pixels for the three sizes, the same heights a button and a field
stand at, so a segmented control lines up with either beside it.

## Accessibility

- The control has no visible label, so `aria-label` is not optional — "Reporting range" is what
  turns three unexplained words into a question.
- The indicator is a picture of the selection. What is announced is the segment's own
  `aria-checked`, so the control reads correctly while the highlight is still sliding.
- To a screen reader this *is* a radio group — `role="radiogroup"` on the track and `role="radio"`
  on each segment. What differs is the form story: a [RadioGroup](/components/radio-group) submits
  under a `name` and carries a validation state, and this does not. Reach for that one where the
  choice is a field rather than a view switch.

## API

<Api family="segmented-control" />
