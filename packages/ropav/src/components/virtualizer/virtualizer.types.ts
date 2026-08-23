import type { Layout } from "../../utils/virtualizer-layout";
import type { LayoutInfo } from "../../utils/virtualizer-layout-info";

/** A layout class the caller hands over, or an instance they built themselves. */
export type VirtualizerLayoutProp<Options extends object = object> =
  | Layout<Options>
  | (new () => Layout<Options>);

export interface VirtualizerRootProps<Options extends object = object> {
  /** The layout that decides where each element goes. */
  layout: VirtualizerLayoutProp<Options>;
  /** Options for the layout. */
  layoutOptions?: Options;
  /**
   * Whether each element is watched with a `ResizeObserver` and re-measured when it changes.
   *
   * Off by default: the layout already re-measures anything it placed at an estimate, and
   * observing every element is only worth it when their content changes size on its own.
   */
  shouldObserveItemSize?: boolean;
}

export interface VirtualizerItemProps {
  /**
   * Where this element goes, as the layout worked it out.
   *
   * `null` while the layout cannot say yet. A table's columns are registered from the DOM, so the
   * first render is the one that tells the layout they exist — until it has, a column has a
   * wrapper but no geometry. The wrapper has to be there for that render anyway: making its very
   * existence depend on the geometry would tear down the element whose registration produced it.
   */
  layoutInfo?: LayoutInfo | null;
  /** The enclosing element's layout info, when this one is nested. */
  parentLayoutInfo?: LayoutInfo | null;
}
