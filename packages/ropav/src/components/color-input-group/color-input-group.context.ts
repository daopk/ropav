import type {colorInputGroupVariants} from "@ropav/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface ColorInputGroupContext {
  /** Slot classes the parts pull their own class from. */
  slots: ComputedRef<ReturnType<typeof colorInputGroupVariants>>;
}

/**
 * Carries the resolved slot functions from the group down to its parts, so each part gets the
 * variant the group settled on without having to resolve it a second time.
 *
 * Strict: a prefix or a control with the group's class on it but no group around it would be
 * styled for a shell that is not there.
 */
export const [useColorInputGroupContext, provideColorInputGroupContext] =
  createContext<ColorInputGroupContext>({name: "ColorInputGroupContext"});

/**
 * Listeners the control wires one by one with `@event`.
 *
 * Kept apart from the attributes on purpose. Vapor re-applies every `on*` key arriving through
 * `v-bind` on each render and drops the previous listener as the render effect cleans up — which
 * loses a handler mid-dispatch on exactly the element that re-renders in response to the events
 * it is listening for.
 */
export interface ColorInputGroupControlHandlers {
  onInput: (event: Event) => void;
  onFocus: (event: FocusEvent) => void;
  onBlur: (event: FocusEvent) => void;
  onKeydown: (event: KeyboardEvent) => void;
  onKeyup: (event: KeyboardEvent) => void;
  /** Only the channel branch has one: a hex field has no formatting for a paste to fight with. */
  onPaste?: (event: ClipboardEvent) => void;
}

/**
 * What a colour field hands down to the control inside it.
 *
 * Lives here rather than with either field composable because both branches of `ColorField`
 * provide it and only these parts consume it — which is the layering React has too, where
 * `ColorField` provides the `InputContext` that `Input` owns.
 *
 * Loose: a bare colour input group outside any field is legal, exactly as it is in React.
 */
export interface ColorInputGroupControl {
  /** Spread with `v-bind`. Never carries an `on*` key. */
  attrs: ComputedRef<Record<string, unknown>>;
  handlers: ColorInputGroupControlHandlers;
  /** The control reports its element, which the browser wiring hangs off. */
  registerElement: (element: HTMLInputElement | null) => void;
  isDisabled: ComputedRef<boolean>;
  isInvalid: ComputedRef<boolean>;
}

export const [useColorInputGroupControlContext, provideColorInputGroupControlContext] =
  createContext<ColorInputGroupControl | null>({
    defaultValue: null,
    name: "ColorInputGroupControlContext",
    strict: false,
  });
