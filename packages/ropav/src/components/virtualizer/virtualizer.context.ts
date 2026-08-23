import type { ItemDropTarget } from "../../utils/dnd-types";
import type { Size } from "../../utils/virtualizer-geometry";
import type { Layout } from "../../utils/virtualizer-layout";
import type { LayoutInfo, VirtualizerKey } from "../../utils/virtualizer-layout-info";
import type { ComputedRef, ShallowRef } from "vue";

import { createContext } from "../../utils/create-context";

/**
 * What `Virtualizer` hands the collection inside it: the layout and how to configure it.
 *
 * Deliberately only configuration. The collection is what owns the element that scrolls and the
 * data that gets laid out, so it runs the virtualizer itself and provides the state below.
 */
export interface VirtualizerConfigContext {
  layout: ShallowRef<Layout<object>>;
  layoutOptions: ComputedRef<object | undefined>;
  shouldObserveItemSize: ComputedRef<boolean>;
}

/**
 * Loose: a collection renders the same way with or without a virtualizer above it, and asking
 * for one would make `Virtualizer` mandatory for every listbox in the library.
 */
export const [useVirtualizerConfigContext, provideVirtualizerConfigContext] =
  createContext<VirtualizerConfigContext | null>({
    defaultValue: null,
    name: "VirtualizerConfigContext",
    strict: false,
  });

/** What a virtualized collection hands its own parts, so they can describe themselves. */
export interface VirtualizerStateContext {
  /** How many items the collection holds, which is not how many are rendered. */
  itemCount: ComputedRef<number>;
  /** An item's position among all of them, zero-based. */
  getIndex: (key: VirtualizerKey) => number;
  getLayoutInfo: (key: VirtualizerKey) => LayoutInfo | null;
  /**
   * Where a drop indicator for the given gap belongs, when the layout can say.
   *
   * A gap is not in the collection, so nothing has laid it out — only the layout knows how wide
   * the line is and which boundary it straddles. Absent when the layout has no drag and drop
   * support, which is what makes an indicator fall back to ordinary flow.
   */
  getDropTargetLayoutInfo?: (target: ItemDropTarget) => LayoutInfo;
  /** Records an element's measured size, for a layout working from estimates. */
  updateItemSize: (key: VirtualizerKey, size: Size) => void;
  shouldObserveItemSize: ComputedRef<boolean>;
}

/**
 * Loose: an item that is not virtualized must not describe itself as one of a windowed set —
 * `aria-posinset` and `aria-setsize` only mean something when most of the set is absent.
 */
export const [useVirtualizerStateContext, provideVirtualizerStateContext] =
  createContext<VirtualizerStateContext | null>({
    defaultValue: null,
    name: "VirtualizerStateContext",
    strict: false,
  });
