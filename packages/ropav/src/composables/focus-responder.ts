import type {ComputedRef} from "vue";

import {createContext} from "../utils/create-context";

/** The listeners a focusable takes from above, in the shape a template attaches them in. */
export interface FocusResponderHandlers {
  onBlur: (event: FocusEvent) => void;
  onFocus: (event: FocusEvent) => void;
  onKeydown: (event: KeyboardEvent) => void;
  onPointerdown: (event: PointerEvent) => void;
  onPointerenter: (event: PointerEvent) => void;
  onPointerleave: (event: PointerEvent) => void;
}

export interface FocusResponder {
  /**
   * Attributes the focusable renders with `v-bind` — the description it is given while whatever
   * is watching it is showing something. Attributes only: see {@link composeFocusResponder} for
   * why the handlers are kept out of this.
   */
  attrs: ComputedRef<Record<string, unknown>>;
  /** Listeners the focusable chains ahead of its own, through {@link composeFocusResponder}. */
  handlers: ComputedRef<FocusResponderHandlers>;
  /** Reports the focusable's element, which is what the responder watches and positions against. */
  registerElement: (element: HTMLElement | null) => void;
}

/**
 * Hover and focus supplied from above, ported from React Aria's `FocusableContext`.
 *
 * This is how `<Tooltip><Button/></Tooltip>` works: the trigger is an ordinary button, and
 * everything that makes it a tooltip trigger — opening after a delay on hover, opening at once on
 * keyboard focus, closing when pressed — is handed down rather than built into the button.
 *
 * Deliberately not the same context as the press responder, which React also keeps separate. A
 * button inside a dropdown already takes its press from above; if the two shared one channel, a
 * tooltip wrapped around that button would replace the press that makes it a menu trigger.
 *
 * Optional: most focusables have nobody above them supplying anything.
 */
export const [useFocusResponder, provideFocusResponder] = createContext<FocusResponder | null>({
  defaultValue: null,
  name: "FocusResponder",
  strict: false,
});

/**
 * Chain a responder's listeners ahead of the element's own, as functions stable enough to
 * attach with `@event`.
 *
 * **A listener must never reach a vapor element through `v-bind`** — the reasoning is the same as
 * for {@link composePressResponder}, and a tooltip trigger is exactly the kind of element it bites:
 * hovering it is itself a re-render, so a listener carried by `v-bind` would be removed in the
 * middle of the very event that was meant to open the tooltip.
 *
 * @example
 * ```ts
 * const focus = composeFocusResponder(useFocusResponder(), {onFocus, onBlur});
 * // <button @focus="focus.onFocus" @blur="focus.onBlur" ...>
 * ```
 */
export const composeFocusResponder = (
  responder: FocusResponder | null,
  own: Partial<FocusResponderHandlers> = {},
): FocusResponderHandlers => ({
  onBlur: (event) => {
    responder?.handlers.value.onBlur(event);
    own.onBlur?.(event);
  },
  onFocus: (event) => {
    responder?.handlers.value.onFocus(event);
    own.onFocus?.(event);
  },
  onKeydown: (event) => {
    responder?.handlers.value.onKeydown(event);
    own.onKeydown?.(event);
  },
  onPointerdown: (event) => {
    responder?.handlers.value.onPointerdown(event);
    own.onPointerdown?.(event);
  },
  onPointerenter: (event) => {
    responder?.handlers.value.onPointerenter(event);
    own.onPointerenter?.(event);
  },
  onPointerleave: (event) => {
    responder?.handlers.value.onPointerleave(event);
    own.onPointerleave?.(event);
  },
});
