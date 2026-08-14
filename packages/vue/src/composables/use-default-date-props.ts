import type {Granularity} from "../utils/date-format";
import type {DateValue} from "@internationalized/date";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, shallowRef, toValue, watch} from "vue";

export interface DefaultDateProps {
  /** How precise the field is: down to the day, the hour, the minute or the second. */
  granularity: ComputedRef<Granularity>;
  /** The zone the value carries, or `undefined` for a value that has none. */
  defaultTimeZone: ComputedRef<string | undefined>;
}

/**
 * How precise a date control is, and which time zone it works in.
 *
 * Ported from react-stately's `useDefaultProps`
 * (`packages/react-stately/src/datepicker/utils.ts`, react-stately 3.49.0). Shared by the field
 * and by both pickers, because all three have to agree: a picker that thought it was date-only
 * while its field showed time segments would drop the time on every selection.
 *
 * Both answers are **remembered** rather than recomputed from scratch. Clearing a date-and-time
 * value would otherwise collapse the control back to the date-only default, taking its time
 * segments away while the user is still editing it.
 */
export const useDefaultDateProps = (
  value: MaybeRefOrGetter<DateValue | null | undefined>,
  granularity: MaybeRefOrGetter<Granularity | undefined>,
): DefaultDateProps => {
  const shape = computed(() => toValue(value) ?? null);
  const remembered = shallowRef<[Granularity, string | undefined]>(["day", undefined]);

  watch(
    shape,
    (current) => {
      if (!current) return;

      remembered.value = [
        "minute" in current ? "minute" : "day",
        "timeZone" in current ? current.timeZone : undefined,
      ];
    },
    {immediate: true},
  );

  return {
    defaultTimeZone: computed(() =>
      shape.value
        ? "timeZone" in shape.value
          ? shape.value.timeZone
          : undefined
        : remembered.value[1],
    ),

    granularity: computed<Granularity>(() => {
      const current = shape.value;
      const requested = toValue(granularity);

      /*
       * Thrown on read rather than at setup, as upstream throws it during render: a caller asking
       * for minutes from a plain date has made a mistake that would otherwise show up much later
       * as a segment that cannot be edited.
       */
      if (current && requested && !(requested in current)) {
        throw new Error(`Invalid granularity ${requested} for value ${current.toString()}`);
      }

      if (requested) return requested;

      return current
        ? (("minute" in current ? "minute" : "day") as Granularity)
        : remembered.value[0];
    }),
  };
};
