import type { UseCollectionReturn } from "../../composables/use-collection";
import type { UseListKeyboardReturn } from "../../composables/use-list-keyboard";
import type { UseSelectionManagerReturn } from "../../composables/use-selection-manager";
import type { Color } from "../../utils/color-types";
import type { colorSwatchPickerVariants } from "@ropav/styles";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface ColorSwatchPickerContext {
  collection: UseCollectionReturn;
  selection: UseSelectionManagerReturn;
  keyboard: UseListKeyboardReturn;
  /** The picker's own id, which item ids are derived from. */
  listId: ComputedRef<string>;
  /** Shared marker so an item can tell which collection it belongs to. */
  collectionId: ComputedRef<string>;
  /** Slot classes the parts pull their own class from. */
  slots: ComputedRef<ReturnType<typeof colorSwatchPickerVariants>>;
  /** Hands a colour back to whoever owns the value, keyed by the item that was chosen. */
  registerColor: (key: string, color: Color) => () => void;
}

/**
 * Strict: an item outside a picker has no collection to join and no selection to read, so it
 * would render something that looks selectable but is not.
 */
export const [useColorSwatchPickerContext, provideColorSwatchPickerContext] =
  createContext<ColorSwatchPickerContext>({ name: "ColorSwatchPickerContext" });

export interface ColorSwatchPickerItemContext {
  /** The colour this item stands for, which its swatch shows and its indicator measures. */
  color: ComputedRef<Color>;
  isSelected: ComputedRef<boolean>;
  isDisabled: ComputedRef<boolean>;
  isFocused: ComputedRef<boolean>;
  isFocusVisible: ComputedRef<boolean>;
  isHovered: ComputedRef<boolean>;
  isPressed: ComputedRef<boolean>;
}

/**
 * Strict: a swatch or an indicator exists to show one item's colour, and there is no sensible
 * colour to fall back on — a transparent default would render an invisible swatch that looks
 * like a bug in the palette rather than a missing parent.
 */
export const [useColorSwatchPickerItemContext, provideColorSwatchPickerItemContext] =
  createContext<ColorSwatchPickerItemContext>({ name: "ColorSwatchPickerItemContext" });
