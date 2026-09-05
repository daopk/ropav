---
title: Calendar systems
description: Why dates are Gregorian by default, and what it costs to change that.
---

# Calendar systems

The calendars, fields and pickers build **Gregorian** dates whatever calendar the locale asks
for. That is a deliberate default, and it is about bundle weight rather than about correctness.

A factory that can answer for any calendar identifier has to carry the arithmetic for every system
behind it — Buddhist, Hebrew, Islamic in its several variants, Indian, Persian, Japanese, Coptic,
Ethiopic, Taiwanese. Because the default is a static import, nothing about it can be dropped by a
build. Every app shipping a date picker would carry all of them, including the apps that serve one
locale.

## Opting in

An app serving a locale that uses another system passes the full factory back:

```vue
<script setup lang="ts">
import { DatePicker, createCalendar } from "ropav";
</script>

<template>
  <DatePicker :create-calendar="createCalendar" />
</template>
```

`createCalendar` takes the prop on `Calendar`, `RangeCalendar`, `DateField`, `DatePicker` and
`DateRangePicker`.

## Paying for less

A narrower factory works too, if only some systems are worth the weight. The prop is a plain
function from a calendar identifier to a calendar, so you can answer for the ones you serve and
let the rest fall back:

```ts
import { BuddhistCalendar, GregorianCalendar } from "@internationalized/date";

const createCalendar = (identifier: string) =>
  identifier === "buddhist" ? new BuddhistCalendar() : new GregorianCalendar();
```

That ships two calendars instead of all of them, and the bundler drops the ones you never named.
