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
