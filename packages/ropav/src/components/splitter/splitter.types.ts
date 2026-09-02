import type { CollectionKey } from "../../composables/use-collection";
import type { SplitterOrientation, SplitterSize } from "./splitter.state";

export interface SplitterRootProps {
  class?: string;
  /**
   * Axis the panels are laid out along. A horizontal group puts its panels side by side, which
   * makes each handle a vertical line. @default "horizontal"
   */
  orientation?: SplitterOrientation;
  /** Every panel's size, in order. Set, a drag reports what it would do rather than doing it. */
  sizes?: SplitterSize[];
  /** Sizes the splitter starts at, when the caller is not controlling them. */
  defaultSizes?: SplitterSize[];
  /**
   * Where the layout is remembered between visits, under `ropav:splitter:<id>` in `localStorage`.
   * Read once after mount, and discarded unless it still matches the panels on screen.
   */
  autoSaveId?: string;
  /** Suppresses every handle. */
  isDisabled?: boolean;
  /** How far one arrow press moves a handle, in pixels. @default 10 */
  keyboardStep?: number;
  /** How far a shift-arrow press moves a handle, in pixels. @default 50 */
  keyboardLargeStep?: number;
  /** Accessible name, for a splitter with no visible label. */
  ariaLabel?: string;
  /** Ids of the elements that name the splitter. */
  ariaLabelledby?: string;
}

export interface SplitterPanelProps {
  class?: string;
  /**
   * Identity of the panel. Falls back to a generated key — but an explicit id is what lets a
   * stored layout survive a panel being added, removed or reordered.
   */
  id?: CollectionKey;
  /** A size the caller controls. A drag never writes to it. */
  size?: SplitterSize;
  /** The size the panel starts at, and what a double-click on its handle restores. @default "1fr" */
  defaultSize?: SplitterSize;
  /** Smallest size a drag may reach. Cannot be given in `fr`. @default 0 */
  minSize?: SplitterSize;
  /** Largest size a drag may reach. Cannot be given in `fr`. */
  maxSize?: SplitterSize;
  /** Whether dragging past the minimum snaps the panel shut instead of stopping there. */
  isCollapsible?: boolean;
  /**
   * The size a collapsed panel keeps. `0` takes it out of the layout; `48` leaves an icon rail.
   * Cannot be given in `fr`. @default 0
   */
  collapsedSize?: SplitterSize;
}

export interface SplitterHandleProps {
  class?: string;
  /** Identity of the handle. Falls back to a generated key. */
  id?: CollectionKey;
  /** Disables this handle alone; the splitter being disabled also counts. */
  isDisabled?: boolean;
  /** Whether a double-click puts both neighbours back to their default size. @default true */
  resetOnDoubleClick?: boolean;
  /**
   * Draws a grip across the middle of the divider, purely decorative — the grab area reaches well
   * past it either way. @default false
   */
  showGrip?: boolean;
  /**
   * Accessible name. Declared as `ariaLabel`, not `aria-label`: Vue normalises prop names, so a
   * hyphenated declaration would never be matched. @default "Resize panel"
   */
  ariaLabel?: string;
  /** Ids of the elements that name the handle. */
  ariaLabelledby?: string;
}

/** State the root hands to its slot. */
export interface SplitterSlotProps {
  orientation: SplitterOrientation;
  /** Every panel's resolved size, in pixels and in order. Empty until the container is measured. */
  layout: number[];
  isDragging: boolean;
  isDisabled: boolean;
}

/** State a panel hands to its slot. */
export interface SplitterPanelSlotProps {
  /** The panel's resolved size in pixels, or `0` before the container has been measured. */
  size: number;
  isCollapsed: boolean;
  isCollapsible: boolean;
  orientation: SplitterOrientation;
}

/** State a handle hands to its slot. */
export interface SplitterHandleSlotProps {
  isDragging: boolean;
  isHovered: boolean;
  isFocused: boolean;
  isFocusVisible: boolean;
  isDisabled: boolean;
  orientation: SplitterOrientation;
}
