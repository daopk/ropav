import type {CollectionKey} from "../../composables/use-collection";
import type {TabsVariants} from "@ropav/styles";

export type TabsOrientation = "horizontal" | "vertical";

/**
 * `"automatic"` — moving between tabs with the arrow keys selects as it goes.
 * `"manual"` — the arrows only move focus, and Enter or Space selects.
 */
export type TabsKeyboardActivation = "automatic" | "manual";

export interface TabsRootProps {
  class?: string;
  /** The selected tab, when the caller drives it. */
  selectedKey?: CollectionKey;
  /** The initially selected tab. Falls back to the first tab that is not disabled. */
  defaultSelectedKey?: CollectionKey;
  disabledKeys?: CollectionKey[];
  /** @default "automatic" */
  keyboardActivation?: TabsKeyboardActivation;
  isDisabled?: boolean;
  /** @default "horizontal" */
  orientation?: TabsOrientation;
  variant?: TabsVariants["variant"];
  /**
   * A base the tab and panel ids are derived from.
   *
   * Deliberately does not reach the DOM, so it cannot collide with an element the caller ids
   * for itself.
   */
  id?: string;
  onSelectionChange?: (key: CollectionKey) => void;
}

export interface TabsRootSlotProps {
  orientation: TabsOrientation;
  isFocusWithin: boolean;
  isFocusVisible: boolean;
}

export interface TabsListContainerProps {
  class?: string;
}

export interface TabsListProps {
  class?: string;
  /**
   * Names the tab list.
   *
   * Declared under this name because Vue normalises prop names, so a hyphenated one never
   * resolves — it is mapped back to `aria-label` at the binding.
   */
  ariaLabel?: string;
}

export interface TabsTabProps {
  class?: string;
  /** Identifies the tab, and the panel that goes with it. */
  id: CollectionKey;
  isDisabled?: boolean;
  /** What typeahead and assistive technology read, when the rendered text will not do. */
  textValue?: string;
}

export interface TabsTabSlotProps {
  isSelected: boolean;
  isDisabled: boolean;
  isFocused: boolean;
  isFocusVisible: boolean;
  isHovered: boolean;
  isPressed: boolean;
}

export interface TabsIndicatorProps {
  class?: string;
}

export interface TabsPanelProps {
  class?: string;
  /** Matches the `id` of the tab this panel belongs to. */
  id: CollectionKey;
  /** Keeps the panel mounted while another tab is selected. */
  shouldForceMount?: boolean;
}

export interface TabsPanelSlotProps {
  isFocused: boolean;
  isFocusVisible: boolean;
  isEntering: boolean;
  isExiting: boolean;
}

export interface TabsSeparatorProps {
  class?: string;
}
