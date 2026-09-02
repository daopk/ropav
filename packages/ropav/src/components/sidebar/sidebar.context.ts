import type { SidebarState } from "./sidebar.state";
import type { SidebarSide } from "./sidebar.types";
import type { sidebarVariants } from "@ropav/styles";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface SidebarContext {
  /** The slot set the root resolved, so every part styles itself from one `tv()` call. */
  slots: ComputedRef<ReturnType<typeof sidebarVariants>>;
  state: SidebarState;
  side: ComputedRef<SidebarSide>;
  /** The panel's id, which the trigger's `aria-controls` and the rail both point at. */
  panelId: ComputedRef<string>;
  /**
   * The panel element, reported upward rather than reached for.
   *
   * The rail resizes by measuring what the panel is now and adding the drag to it, and it cannot
   * find that element from where it sits: the two are siblings, and a caller is free to put
   * anything between them.
   */
  panelEl: ComputedRef<HTMLElement | null>;
  setPanelEl: (element: HTMLElement | null) => void;
}

/**
 * Strict, and keyed to this component alone.
 *
 * A key shared with a layout family would resolve to the nearest ancestor that provided it, so a
 * settings nav rendered inside a sidebar's inset would read the outer sidebar's state and collapse
 * with it.
 */
export const [useSidebarContext, provideSidebarContext] = createContext<SidebarContext>({
  name: "SidebarContext",
});

/**
 * What a group offers the label inside it.
 *
 * The label registers rather than the group reaching for it, because the group cannot see whether
 * its slot rendered one — and `aria-labelledby` pointing at an id that never appears leaves the
 * group with no name at all, which is worse than the plain unnamed group it would otherwise be.
 */
export interface SidebarGroupContext {
  labelId: ComputedRef<string>;
  /** Called by the label on mount; the returned function undoes it. */
  registerLabel: () => () => void;
}

/** Loose: a group label outside a group is a heading with no group to name, not an error. */
export const [useSidebarGroupContext, provideSidebarGroupContext] =
  createContext<SidebarGroupContext | null>({
    defaultValue: null,
    name: "SidebarGroupContext",
    strict: false,
  });

/**
 * What a collapsible nav item offers the trigger and the submenu inside it.
 *
 * Strict: a trigger or an indicator outside a collapsible has nothing to open and nothing to point
 * at, so the absence of one is a mistake rather than a state to render around.
 */
export interface SidebarCollapsibleContext {
  /** Whether the children are showing. Always false while the sidebar is a rail — see the note on
   * `toggle` for why the rail is the one place this does not follow the item's own state. */
  isExpanded: ComputedRef<boolean>;
  isDisabled: ComputedRef<boolean>;
  /**
   * Opens and shuts the children.
   *
   * On the rail it opens the sidebar first. The children are not rendered at that width, so a
   * trigger that only flipped its own flag would be a control that visibly does nothing; opening
   * the panel is what the press was asking for either way.
   */
  toggle: () => void;
  /** The trigger's id, which names the submenu. */
  triggerId: ComputedRef<string>;
  /** The submenu's id, which the trigger's `aria-controls` points at. */
  subMenuId: ComputedRef<string>;
}

export const [useSidebarCollapsibleContext, provideSidebarCollapsibleContext] =
  createContext<SidebarCollapsibleContext>({ name: "SidebarCollapsibleContext" });

/**
 * Whether a row is inside a submenu, which is all an item needs to know to style itself as a child.
 *
 * Loose and a bare boolean: an item outside a submenu is the ordinary case, not an error, and
 * carrying the answer down beats a prop every child row would have to remember.
 */
export const [useSidebarSubMenuContext, provideSidebarSubMenuContext] = createContext<boolean>({
  defaultValue: false,
  name: "SidebarSubMenuContext",
  strict: false,
});
