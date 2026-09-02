import type { DateFieldState, DateSegment } from "../../composables/use-date-field-state";
import type { FocusManager } from "../../utils/focus";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { CalendarDate, toCalendar } from "@internationalized/date";
import { NumberParser } from "@internationalized/number";
import { computed, onScopeDispose, toValue } from "vue";

import { useDateFormatter } from "../../composables/use-date-formatter";
import { useDisplayNames } from "../../composables/use-display-names";
import { useFilter } from "../../composables/use-filter";
import { useId } from "../../composables/use-id";
import { useLabels } from "../../composables/use-labels";
import { useLocale } from "../../composables/use-locale";
import { useSpinButton } from "../../composables/use-spin-button";
import { isIOS } from "../../utils/platform";

export interface UseDateSegmentOptions {
  /** The segment this is behaviour for. A getter, because the field rebuilds them on every edit. */
  segment: MaybeRefOrGetter<DateSegment>;
  state: DateFieldState;
  /** Moves focus to the next or previous segment. The field owns it; the segment only uses it. */
  focusManager: FocusManager;
  /** The segment's element. A getter, because it does not exist yet at setup. */
  element: MaybeRefOrGetter<HTMLElement | null | undefined>;
  /** The field's own label, repeated on each segment because VoiceOver skips groups on iOS. */
  ariaLabel?: MaybeRefOrGetter<string | undefined>;
  ariaLabelledBy?: MaybeRefOrGetter<string | undefined>;
  ariaDescribedBy?: MaybeRefOrGetter<string | undefined>;
}

export interface UseDateSegmentReturn {
  /** Attributes for the segment. Spread with `v-bind`; never carries an `on*` key. */
  attrs: ComputedRef<Record<string, unknown>>;
  /** Inline styles for the segment, which carry the bidi handling. */
  style: ComputedRef<Record<string, string>>;
  onKeydown: (event: KeyboardEvent) => void;
  onFocus: () => void;
  onBlur: () => void;
  onBeforeinput: (event: InputEvent) => void;
  onInput: (event: Event) => void;
  /** Keeps a press on a segment from reaching the field, which would move focus elsewhere. */
  onPointerdown: (event: PointerEvent) => void;
  onMousedown: (event: MouseEvent) => void;
}

/** How many leading characters every string in the list shares. */
const commonPrefixLength = (strings: string[]): number => {
  const sorted = [...strings].sort();
  const first = sorted[0] ?? "";
  const last = sorted[sorted.length - 1] ?? "";

  for (let index = 0; index < first.length; index += 1) {
    if (first[index] !== last[index]) return index;
  }

  return 0;
};

/** The day-period name a 12-hour clock uses for the given hour. */
const dayPeriodName = (formatter: Intl.DateTimeFormat, hour: number): string => {
  const date = new Date();

  date.setHours(hour);

  return formatter.formatToParts(date).find((part) => part.type === "dayPeriod")?.value ?? "";
};

/**
 * Behaviour and accessibility for one segment of a date field.
 *
 * Ported from React Aria's `packages/react-aria/src/datepicker/useDateSegment.ts`
 * (react-aria 3.51.0).
 *
 * A segment is a `contenteditable` span that behaves like a spin button: arrows step it, digits
 * type into it, and it hands focus on to the next segment as soon as no further digit could fit.
 * Everything the browser would normally do with the typed text is cancelled — `beforeinput` is
 * always prevented and the state decides what the segment shows — so the DOM never disagrees with
 * the value.
 */
export const useDateSegment = (options: UseDateSegmentOptions): UseDateSegmentReturn => {
  const { focusManager, state } = options;
  const locale = useLocale();
  const displayNames = useDisplayNames();
  const segment = computed(() => toValue(options.segment));

  const getElement = () => toValue(options.element) ?? null;
  /** The digits typed into this segment so far, which is how "23" follows "2". */
  let enteredKeys = "";
  /** The segment's text as it stood when a composition began, to put back afterwards. */
  let composed: string | null = "";

  const resolvedOptions = computed(() => state.dateFormatter.value.resolvedOptions());

  const monthFormatter = useDateFormatter(() => ({
    month: "long" as const,
    timeZone: resolvedOptions.value.timeZone,
  }));
  const hourFormatter = useDateFormatter(() => ({
    hour: "numeric" as const,
    hour12: resolvedOptions.value.hour12,
    timeZone: resolvedOptions.value.timeZone,
  }));

  /**
   * How the segment should be read out.
   *
   * A month reads as its name as well as its number, and an hour as the clock reads it, because
   * "3" alone says nothing about which three.
   */
  const textValue = computed(() => {
    const current = segment.value;

    if (current.isPlaceholder) return "";

    if (current.type === "month") {
      const name = monthFormatter.value.format(state.dateValue.value);

      return name === current.text ? name : `${current.text} – ${name}`;
    }

    if (current.type === "hour") return hourFormatter.value.format(state.dateValue.value);

    return current.text;
  });

  const spin = useSpinButton({
    isDisabled: state.isDisabled,
    isReadOnly: () => state.isReadOnly.value || !segment.value.isEditable,
    isRequired: state.isRequired,
    // The spec makes `aria-valuenow` optional without a value, but axe asks for it regardless.
    maxValue: () => segment.value.maxValue,
    minValue: () => segment.value.minValue,
    onDecrement: () => {
      enteredKeys = "";
      state.decrement(segment.value.type);
    },
    onDecrementPage: () => {
      enteredKeys = "";
      state.decrementPage(segment.value.type);
    },
    onDecrementToMin: () => {
      enteredKeys = "";
      state.decrementToMin(segment.value.type);
    },
    onIncrement: () => {
      enteredKeys = "";
      state.increment(segment.value.type);
    },
    onIncrementPage: () => {
      enteredKeys = "";
      state.incrementPage(segment.value.type);
    },
    onIncrementToMax: () => {
      enteredKeys = "";
      state.incrementToMax(segment.value.type);
    },
    textValue,
    value: () => segment.value.value ?? undefined,
  });

  const parser = computed(
    () => new NumberParser(locale.value.locale, { maximumFractionDigits: 0 }),
  );

  // Safari's `dayPeriod` format option does not work, so the names are read off a formatter.
  const filter = useFilter({ sensitivity: "base" });
  const dayPeriodFormatter = useDateFormatter({ hour: "numeric", hour12: true });
  const am = computed(() => dayPeriodName(dayPeriodFormatter.value, 0));
  const pm = computed(() => dayPeriodName(dayPeriodFormatter.value, 12));

  const eraFormatter = useDateFormatter({ era: "narrow", timeZone: "UTC", year: "numeric" });

  /**
   * The era names, so typing their first character picks one.
   *
   * Their common prefix is dropped first: a calendar whose eras are named ERA0 and ERA1 would
   * otherwise offer nothing to tell them apart by, and Ethiopic is exactly that case.
   */
  const eras = computed(() => {
    if (segment.value.type !== "era") return [];

    const base = toCalendar(new CalendarDate(1, 1, 1), state.calendar.value);
    const named = state.calendar.value.getEras().map((era) => ({
      era,
      formatted:
        eraFormatter.value
          .formatToParts(base.set({ day: 1, era, month: 1, year: 1 }).toDate("UTC"))
          .find((part) => part.type === "era")?.value ?? "",
    }));
    const prefix = commonPrefixLength(named.map((entry) => entry.formatted));

    return prefix
      ? named.map((entry) => ({ ...entry, formatted: entry.formatted.slice(prefix) }))
      : named;
  });

  const type = () => segment.value.type;

  const backspace = () => {
    const current = segment.value;

    if (current.text === current.placeholder) focusManager.focusPrevious();

    if (
      parser.value.isValidPartialNumber(current.text) &&
      !state.isReadOnly.value &&
      !current.isPlaceholder
    ) {
      const trimmed = current.text.slice(0, -1);
      const parsed = parser.value.parse(trimmed);

      if (trimmed.length === 0 || parsed === 0) state.clearSegment(current.type);
      else state.setSegment(current.type, parsed);

      enteredKeys = parsed === 0 ? "" : trimmed;
    } else if (current.type === "dayPeriod" || current.type === "era") {
      state.clearSegment(current.type);
    }
  };

  /** Take one typed character, which is not the same as taking one digit. */
  const typeCharacter = (key: string) => {
    if (state.isDisabled.value || state.isReadOnly.value) return;

    const current = segment.value;
    const candidate = enteredKeys + key;

    switch (current.type) {
      case "dayPeriod": {
        const { startsWith } = filter.value;

        if (startsWith(am.value, key)) state.setSegment("dayPeriod", 0);
        else if (startsWith(pm.value, key)) state.setSegment("dayPeriod", 1);
        else return;

        focusManager.focusNext();

        return;
      }
      case "era": {
        const matched = eras.value.find((entry) => filter.value.startsWith(entry.formatted, key));

        if (!matched) return;

        state.setSegment("era", matched.era);
        focusManager.focusNext();

        return;
      }
      case "day":
      case "hour":
      case "minute":
      case "month":
      case "second":
      case "year": {
        if (!parser.value.isValidPartialNumber(candidate)) return;

        const typed = parser.value.parse(candidate);

        if (Number.isNaN(typed)) return;

        const { maxValue } = current;
        // A number already past the maximum means the user has started a new one: typing 3 then 5
        // into a month is 3, then 5, not 35.
        const next = maxValue !== undefined && typed > maxValue ? parser.value.parse(key) : typed;

        state.setSegment(current.type, next);

        // Move on as soon as no further digit could fit, so a whole date can be typed straight
        // through without ever pressing an arrow.
        if (
          maxValue !== undefined &&
          (Number(`${typed}0`) > maxValue || candidate.length >= String(maxValue).length)
        ) {
          enteredKeys = "";
          focusManager.focusNext();
        } else {
          enteredKeys = candidate;
        }

        return;
      }
      default:
        return;
    }
  };

  const onFocus = () => {
    const element = getElement();

    enteredKeys = "";
    element?.scrollIntoView?.({ block: "nearest" });
    // Chrome fires no input events at all unless the selection inside the segment is collapsed.
    if (element) window.getSelection()?.collapse(element);
    spin.onFocus();
  };

  /*
   * Keep the selection collapsed for as long as the segment holds focus. Tapping a segment in
   * Chrome on Android and then typing otherwise produces composition events that rewrite the
   * segment's DOM and take the page down with them.
   */
  const onSelectionChange = () => {
    const element = getElement();

    if (!element) return;

    const selection = window.getSelection();
    const anchor = selection?.anchorNode;

    // Only while focused: a stale anchor left behind in the segment would otherwise pull focus
    // back into it on every selection change elsewhere on the page.
    if (anchor && element.contains(anchor) && element.ownerDocument.activeElement === element) {
      selection.collapse(element);
    }
  };

  if (typeof document !== "undefined") {
    document.addEventListener("selectionchange", onSelectionChange);
    onScopeDispose(() => document.removeEventListener("selectionchange", onSelectionChange), true);
  }

  /*
   * A segment being removed while it has focus would drop focus to the document, so it is handed
   * back along the row first. This happens when the granularity changes under a focused field.
   */
  onScopeDispose(() => {
    const element = getElement();

    if (!element || element.ownerDocument.activeElement !== element) return;
    if (!focusManager.focusPrevious()) focusManager.focusNext();
  }, true);

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      event.stopPropagation();
      backspace();

      return;
    }

    // Select-all is claimed and then ignored: Firefox fires no `selectstart` for it, which would
    // leave the segment with an uncollapsed selection and no way to notice.
    if (event.key === "a" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.stopPropagation();

      return;
    }

    spin.onKeydown(event);
  };

  const onBeforeinput = (event: InputEvent) => {
    const element = getElement();

    // Always: the segment's text is the state's to write, never the browser's.
    event.preventDefault();

    if (!element) return;

    switch (event.inputType) {
      case "deleteContentBackward":
      case "deleteContentForward":
        if (parser.value.isValidPartialNumber(segment.value.text) && !state.isReadOnly.value) {
          backspace();
        }

        return;
      case "insertCompositionText":
        // A composition cannot be cancelled, so the text is recorded here and put back on `input`.
        composed = element.textContent;
        // Safari stays stuck in the composition unless the text is also assigned to here.
        // eslint-disable-next-line no-self-assign
        element.textContent = element.textContent;

        return;
      default:
        if (event.data != null) typeCharacter(event.data);

        return;
    }
  };

  const onInput = (event: Event) => {
    const { data, inputType } = event as InputEvent;

    if (inputType !== "insertCompositionText") return;

    const element = getElement();

    if (element) element.textContent = composed;

    /*
     * Android, and a Pinyin keyboard on iOS, sometimes deliver an ordinary letter as a
     * composition, so the day-period keys have to be recognised here as well.
     */
    if (
      data != null &&
      (filter.value.startsWith(am.value, data) || filter.value.startsWith(pm.value, data))
    ) {
      typeCharacter(data);
    }
  };

  const id = useId();

  const isEditable = computed(
    () => !state.isDisabled.value && !state.isReadOnly.value && segment.value.isEditable,
  );

  /** The name of this part of a date, which precedes the field's own label. */
  const name = computed(() => (type() === "literal" ? "" : displayNames.value.of(type())));

  const labels = useLabels(() => {
    const label = toValue(options.ariaLabel);
    const labelledBy = toValue(options.ariaLabelledBy);

    return {
      // The trailing separator is deliberate: the referenced label reads on after this one.
      "aria-label": `${name.value ?? ""}${label ? `, ${label}` : ""}${labelledBy ? ", " : ""}`,
      "aria-labelledby": labelledBy,
      /*
       * The segment's own id, not one of its own: with both a label and a list of labelling ids,
       * `useLabels` prepends the element's id so its `aria-label` counts as the first part of the
       * name — and an id belonging to nothing would point the name at nothing. React arrives at the
       * same place through `mergeIds`, which aliases the two ids together after the fact.
       */
      id: id.value,
    };
  });

  /**
   * Only the first editable segment carries the field's description, unless the field is invalid.
   * Otherwise it would be read again on every segment the user moves to.
   */
  const describedBy = computed(() => {
    const first = state.segments.value.find((candidate) => candidate.isEditable);

    if (segment.value !== first && !state.isInvalid.value) return undefined;

    return toValue(options.ariaDescribedBy);
  });

  const attrs = computed<Record<string, unknown>>(() => {
    const current = segment.value;

    // A literal is punctuation. It is not a control and has nothing to announce.
    if (current.type === "literal") return { "aria-hidden": "true" };

    const editable = isEditable.value;
    const all: Record<string, unknown> = {
      ...spin.attrs.value,
      ...labels.value,
      "aria-describedby": describedBy.value,
      "aria-invalid": state.isInvalid.value ? "true" : undefined,
      "aria-readonly": state.isReadOnly.value || !current.isEditable ? "true" : undefined,
      autocorrect: editable ? "off" : undefined,
      contenteditable: editable ? "true" : undefined,
      "data-placeholder": current.isPlaceholder ? "true" : undefined,
      enterkeyhint: editable ? "next" : undefined,
      id: id.value,
      inputmode:
        state.isDisabled.value ||
        current.type === "dayPeriod" ||
        current.type === "era" ||
        !editable
          ? undefined
          : "numeric",
      spellcheck: editable ? "false" : undefined,
      tabindex: state.isDisabled.value ? undefined : 0,
    };

    // A spin button cannot be focused with VoiceOver on iOS, and a time zone name is not one
    // anyway, so both are announced as plain text instead.
    if (isIOS() || current.type === "timeZoneName") {
      all["role"] = "textbox";
      delete all["aria-valuemax"];
      delete all["aria-valuemin"];
      delete all["aria-valuenow"];
      delete all["aria-valuetext"];
    }

    for (const key of Object.keys(all)) {
      if (all[key] === undefined) delete all[key];
    }

    return all;
  });

  const style = computed<Record<string, string>>(() => {
    // A literal is punctuation, not a control: it has no caret to hide and no direction to pin.
    if (segment.value.type === "literal") return {};

    const all: Record<string, string> = { caretColor: "transparent" };

    if (locale.value.direction !== "rtl") return all;

    /*
     * The bidi algorithm lays a placeholder out differently from a real value, so a segment would
     * shift around as it is filled in and emptied again. Embedding pins every segment the same way
     * round, and a numeric one is forced left to right so its digits do not reverse.
     */
    all["unicodeBidi"] = "embed";

    const format =
      resolvedOptions.value[segment.value.type as keyof Intl.ResolvedDateTimeFormatOptions];

    if (format === "numeric" || format === "2-digit") all["direction"] = "ltr";

    return all;
  });

  return {
    attrs,
    onBeforeinput,
    onBlur: spin.onBlur,
    onFocus,
    onInput,
    onKeydown,
    onMousedown: (event) => event.stopPropagation(),
    // The field focuses a segment of its own choosing on a press; a press that landed on a
    // segment already says which one, so it must not travel any further.
    onPointerdown: (event) => event.stopPropagation(),
    style,
  };
};
