import type { Color } from "../utils/color-types";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, toValue } from "vue";

import { parseColor } from "../utils/color";

import { parseColorValue } from "./use-color-field-state";
import { useControllableState } from "./use-controllable-state";

/** Where a picker starts when nothing says otherwise. */
const DEFAULT_COLOR = parseColor("#000000");

export interface UseColorPickerStateOptions {
  /** Current colour. A string is parsed. */
  value?: MaybeRefOrGetter<Color | string | undefined>;
  /** Colour used while the picker is uncontrolled. @default "#000000" */
  defaultValue?: MaybeRefOrGetter<Color | string | undefined>;
  /** Called whenever the colour changes. */
  onChange?: (value: Color) => void;
}

export interface ColorPickerState {
  /** The colour the picker holds. */
  color: ComputedRef<Color>;
  /** Replace the colour. `null` is ignored, as upstream has it. */
  setColor: (color: Color | null) => void;
}

/**
 * One colour, shared by everything that edits or shows it.
 *
 * Ported from React Stately's `packages/react-stately/src/color/useColorPickerState.ts`
 * (react-stately 3.49.0). Small enough to be almost nothing but a controllable value, and that is
 * the point: a swatch picker, a colour area and a set of sliders can all be pointed at the same
 * state and stay in step without any of them knowing about the others.
 *
 * `setColor` swallowing `null` is upstream's behaviour, not a guard added here. It matters for a
 * swatch picker: the selection layer can report "nothing matched" while a colour that is not in
 * the palette is held, and dropping that back to black would silently discard it.
 */
export const useColorPickerState = (options: UseColorPickerStateOptions = {}): ColorPickerState => {
  const controlledValue = computed(() => parseColorValue(toValue(options.value)) ?? undefined);

  const defaultValue = computed(
    () => parseColorValue(toValue(options.defaultValue) || "#000000") ?? DEFAULT_COLOR,
  );

  const { setState, state } = useControllableState<Color>({
    defaultValue: defaultValue.value,
    onValueChange: (value) => options.onChange?.(value),
    value: () => controlledValue.value,
  });

  return {
    color: computed(() => state.value),
    setColor: (color) => {
      if (color != null) setState(color);
    },
  };
};
