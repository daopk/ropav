import type {UsePressHandlers} from "./use-press";
import type {ComputedRef} from "vue";

import {createContext} from "../utils/create-context";

export interface PressResponder {
  /**
   * Attributes the pressable renders with `v-bind` — the ARIA wiring and the id the overlay
   * is labelled by. Attributes only: see {@link composePressResponder} for why the handlers
   * are kept out of this.
   */
  attrs: ComputedRef<Record<string, unknown>>;
  /** Listeners the pressable chains ahead of its own, through {@link composePressResponder}. */
  handlers: ComputedRef<UsePressHandlers>;
  /** Whether the pressable should look pressed regardless of its own state. */
  isPressed: ComputedRef<boolean>;
  /** Reports the pressable's element, which is what the responder acts on and positions against. */
  registerElement: (element: HTMLElement | null) => void;
}

/**
 * A press supplied from above, ported from React Aria's `PressResponder`.
 *
 * This is how `<Dropdown><Button/></Dropdown>` works: the trigger is an ordinary button, and
 * everything that makes it a menu trigger — the ARIA wiring, opening on the way down for a mouse
 * but on release for touch, the long-press variant — is handed down rather than built into the
 * button. Any pressable can consume it, so the same trigger markup works for whatever opens next.
 *
 * Optional: most pressables have nobody above them supplying a press.
 */
export const [usePressResponder, providePressResponder] = createContext<PressResponder | null>({
  defaultValue: null,
  name: "PressResponder",
  strict: false,
});

/**
 * Chain a responder's listeners ahead of the element's own, as functions stable enough to
 * attach with `@event`.
 *
 * **A listener must never reach a vapor element through `v-bind`.** `setDynamicProps` re-applies
 * every `on*` key on each render — unconditionally, since a handler cannot be compared for
 * equality — and the previous listener is removed as the render effect cleans up. Two things
 * follow, and both broke the dropdown: after the first re-render the responder's listeners sit
 * *behind* the ones the template attached, so the element's own press runs first; and a re-render
 * landing mid-dispatch removes a listener that has not been called yet, which the DOM then never
 * calls for the event in flight. A real mouse press hits both — the pointer has to enter the
 * element first, and hovering is itself a re-render — while a synthetic `dispatchEvent` in a test
 * hits neither, so the bug only ever showed up under a real pointer.
 *
 * Attached once with `@event` and reading the responder at event time, the wrappers below have
 * neither problem.
 *
 * @example
 * ```ts
 * const press = composePressResponder(usePressResponder(), {onClick, onPointerdown});
 * // <button @click="press.onClick" @pointerdown="press.onPointerdown" ...>
 * ```
 */
export const composePressResponder = (
  responder: PressResponder | null,
  own: Partial<UsePressHandlers> = {},
): UsePressHandlers => ({
  onClick: (event) => {
    responder?.handlers.value.onClick(event);
    own.onClick?.(event);
  },
  onDragstart: (event) => {
    responder?.handlers.value.onDragstart(event);
    own.onDragstart?.(event);
  },
  onKeydown: (event) => {
    responder?.handlers.value.onKeydown(event);
    own.onKeydown?.(event);
  },
  onMousedown: (event) => {
    responder?.handlers.value.onMousedown(event);
    own.onMousedown?.(event);
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
  onPointerup: (event) => {
    responder?.handlers.value.onPointerup(event);
    own.onPointerup?.(event);
  },
});
