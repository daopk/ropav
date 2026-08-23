import type {Color} from "../../utils/color-types";
import type {colorPickerVariants} from "@heroui/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface ColorPickerContext {
  /** Slot classes the parts pull their own class from. */
  slots: ComputedRef<ReturnType<typeof colorPickerVariants>>;
}

/**
 * Strict: a trigger or a popover with the picker's classes on it but no picker around it would
 * open nothing.
 */
export const [useColorPickerContext, provideColorPickerContext] = createContext<ColorPickerContext>(
  {name: "ColorPickerContext"},
);

export interface ColorValueContext {
  /** The colour the picker holds. */
  value: ComputedRef<Color>;
  /** Hand a colour back to the picker. */
  setValue: (value: Color) => void;
}

/**
 * One colour, shared with every colour component under a picker.
 *
 * React fans the same state out into **six** separate RAC contexts — one per colour component —
 * because `useContextProps` is the only mechanism it has for reaching them. Here one context does,
 * and the precedence it has to reproduce was read out of `mergeProps` rather than guessed:
 *
 * - **a value** (`value`, `color`): the component's own prop wins whenever it is *present*, and
 *   present includes `null`. Only `undefined` falls through to this context. Written as an
 *   explicit `!== undefined` test for that reason — `??` would let a deliberate `null` on a colour
 *   field be replaced by the picker's colour.
 * - **a handler** (`onChange`): **chained**, not replaced. Both run, context first. This is the
 *   easiest half to get wrong: treating the context as a fallback would make a `ColorSlider` that
 *   carries its own `@change` silently cut the picker's update path.
 *
 * Loose, and absent is the ordinary case: every colour component works on its own.
 */
export const [useColorValueContext, provideColorValueContext] =
  createContext<ColorValueContext | null>({
    defaultValue: null,
    name: "ColorValueContext",
    strict: false,
  });
