import type {ComputedRef} from "vue";

import {createContext} from "../utils/create-context";

export interface PressResponder {
  /**
   * Attributes and listeners the pressable renders, bound with `v-bind`. Vue merges these with
   * the element's own handlers rather than replacing them.
   */
  bind: ComputedRef<Record<string, unknown>>;
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
