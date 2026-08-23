<script setup lang="ts" vapor>
import {
  parseDate,
  parseDateTime,
  toCalendarDate,
  toCalendarDateTime,
  toLocalTimeZone,
} from "@internationalized/date";
import { computed } from "vue";

import { visuallyHiddenStyle } from "../../utils/visually-hidden";

import { useDateFieldControlContext } from "./date-input-group.context";

/**
 * A native date input, out of sight, so the browser can autofill the field.
 *
 * Ported from `react-aria-components`' `HiddenDateInput`. Nothing else here is a control the
 * browser recognises as a date, so without this a password manager or an autofill suggestion has
 * nothing to fill in. Its `form` is deliberately empty, so what it holds is never submitted — the
 * field's own hidden input is what a form reads.
 */
const { state } = useDateFieldControlContext().resolve();

const props = defineProps<{
  /** What kind of value the browser may offer to fill in. */
  autocomplete?: string;
  name?: string;
}>();

/** Fixed rather than absolute, so the input cannot add scroll to the page. */
const style = { ...visuallyHiddenStyle, left: 0, position: "fixed", top: 0 } as const;

const step = computed(() => {
  if (state.granularity.value === "second") return 1;
  if (state.granularity.value === "hour") return 3600;

  return 60;
});

const type = computed(() => (state.granularity.value === "day" ? "date" : "datetime-local"));

const value = computed(() => {
  const current = state.value.value;

  if (!current) return "";
  if (state.granularity.value === "day") return toCalendarDate(current).toString();

  return toCalendarDateTime("timeZone" in current ? toLocalTimeZone(current) : current).toString();
});

/** Which time segments the value carries, so only those are written back. */
const TIME_SEGMENTS = ["hour", "minute", "second"] as const;
const DATE_SEGMENTS = ["day", "month", "year"] as const;
const GRANULARITY_DEPTH = { hour: 1, minute: 2, second: 3 } as const;

const onChange = (event: Event) => {
  const text = (event.target as HTMLInputElement).value;

  if (!text) return;

  const granularity = state.granularity.value;
  const depth = granularity === "day" ? 0 : GRANULARITY_DEPTH[granularity];
  const times: readonly string[] = TIME_SEGMENTS.slice(0, depth);

  try {
    const parsed = granularity === "day" ? parseDate(text) : parseDateTime(text);

    /*
     * Each segment is set before the value is committed. The field refuses an incomplete value, so
     * filling the segments first is what makes the whole date land in one go.
     */
    for (const segment of DATE_SEGMENTS) {
      if (segment in parsed) state.setSegment(segment, parsed[segment]);
    }

    for (const segment of times) {
      if (segment in parsed) {
        state.setSegment(
          segment as "hour" | "minute" | "second",
          (parsed as unknown as Record<string, number>)[segment]!,
        );
      }
    }

    state.setValue(parsed);
  } catch {
    // A half-typed value from the browser is no value at all.
  }
};
</script>

<template>
  <div aria-hidden="true" data-a11y-ignore="aria-hidden-focus" :style="style">
    <input
      :autocomplete="props.autocomplete"
      :disabled="state.isDisabled.value || undefined"
      form=""
      :name="props.name"
      :step="step"
      tabindex="-1"
      :type="type"
      :value="value"
      @change="onChange"
    />
  </div>
</template>
