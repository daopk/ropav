import type { UseDateFieldReturn } from "../../composables/use-date-field";
import type { DateFieldState } from "../../composables/use-date-field-state";
import type { UsePressHandlers } from "../../composables/use-press";
import type { dateInputGroupVariants } from "@ropav/styles";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface DateInputGroupContext {
  /** Slot classes the parts pull their own class from. */
  slots: ComputedRef<ReturnType<typeof dateInputGroupVariants>>;
}

/**
 * Carries the group's styling down to its parts.
 *
 * Loose: `Prefix`, `Suffix` and `InputContainer` all render perfectly well on their own, and
 * standing outside a group is not an error — they just get no slot class, exactly as in React.
 */
export const [useDateInputGroupContext, provideDateInputGroupContext] =
  createContext<DateInputGroupContext | null>({
    defaultValue: null,
    name: "DateInputGroupContext",
    strict: false,
  });

/** One field, and the two elements it needs but does not render itself. */
export interface DateFieldControl {
  state: DateFieldState;
  field: UseDateFieldReturn;
  /**
   * The input part reports the two elements the field needs but does not render.
   *
   * The field's wiring is built by the root, which cannot reach either: focus moves around inside
   * the group of segments, and the value is mirrored onto a hidden input beside it, and both of
   * those belong to the input part.
   */
  setElement: (element: HTMLElement | null) => void;
  setInputElement: (element: HTMLInputElement | null) => void;
}

export interface DateFieldControlContext {
  /**
   * The field a part edits, picked by the part's own `slot`.
   *
   * A function rather than the field itself because a range picker owns two of them, and which one
   * a part edits is a question only the part can answer — mirroring how react-aria-components
   * resolves a slotted context. Throws when asked for a slot the owner does not have, so a
   * mistyped `slot` is an error rather than a field that silently edits the wrong end.
   */
  resolve: (slot?: string) => DateFieldControl;
}

/**
 * Carries the field down to the parts that edit it.
 *
 * Published by whichever root is above — `DateField`, `TimeField`, `DatePicker` or
 * `DateRangePicker`. The parts never own the state themselves, which is what lets a picker's
 * segments work with no field root of their own: the story composition puts `Input` and `Segment`
 * straight inside a `DatePicker`.
 *
 * Strict: an input with no value to edit is not a degraded input, it is a bug.
 */
export const [useDateFieldControlContext, provideDateFieldControlContext] =
  createContext<DateFieldControlContext>({ name: "DateFieldControlContext" });

export interface DateInputGroupOwnerContext {
  /** Attributes for the group element. Spread with `v-bind`. Never carries an `on*` key. */
  attrs: ComputedRef<Record<string, unknown>>;
  /** Listeners for the group. Attach each one statically, never through `v-bind`. */
  handlers: UsePressHandlers & {
    onKeydown: (event: KeyboardEvent) => void;
    onFocusin: (event: FocusEvent) => void;
    onFocusout: (event: FocusEvent) => void;
  };
  /** Whether the owner reads as disabled, so the group shows it without being told. */
  isDisabled: ComputedRef<boolean>;
  /** Whether the owner reads as invalid, so the group shows it without being told. */
  isInvalid: ComputedRef<boolean>;
  /**
   * The group reports its own element back.
   *
   * A picker needs it for two things it cannot do from above: positioning its popover, which is
   * anchored to the whole group rather than to the button inside it, and moving focus along the
   * row of segments, which for a range spans both fields.
   */
  setElement: (element: HTMLElement | null) => void;
}

/**
 * Carries a picker's own group wiring down to the group it renders.
 *
 * The group around the segments belongs to the picker, not to the field inside it: it is what
 * carries the picker's name and description, what its popover is positioned against, and what
 * answers a click on the empty space beside the segments. But the element itself is rendered by a
 * part further down, so the wiring has to travel to meet it.
 *
 * Loose: a plain `DateField` has nothing above it, and then the group is simply its own.
 */
export const [useDateInputGroupOwnerContext, provideDateInputGroupOwnerContext] =
  createContext<DateInputGroupOwnerContext | null>({
    defaultValue: null,
    name: "DateInputGroupOwnerContext",
    strict: false,
  });
