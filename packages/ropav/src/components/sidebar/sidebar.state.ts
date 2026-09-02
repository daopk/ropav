import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, shallowRef, toValue } from "vue";

import { useControllableState } from "../../composables/use-controllable-state";

/** How the panel gets out of the way. `none` pins it open, and the trigger has nothing to do. */
export type SidebarCollapsible = "icon" | "offcanvas" | "none";

export interface UseSidebarStateOptions {
  collapsible: MaybeRefOrGetter<SidebarCollapsible | undefined>;
  /** Whether the viewport is narrow enough that the panel has become a drawer. */
  isMobile: MaybeRefOrGetter<boolean | undefined>;
  /** Whether the panel is expanded on a wide viewport. Set, the sidebar never writes its own. */
  isExpanded: MaybeRefOrGetter<boolean | undefined>;
  defaultExpanded?: boolean;
  /** Whether the drawer is showing on a narrow one. */
  isMobileOpen: MaybeRefOrGetter<boolean | undefined>;
  defaultMobileOpen?: boolean;
  /** The width the expanded panel renders at, as a CSS length. */
  width: MaybeRefOrGetter<string | undefined>;
  defaultWidth?: string;
  onExpandedChange?: (isExpanded: boolean) => void;
  onMobileOpenChange?: (isOpen: boolean) => void;
  onWidthChange?: (width: string) => void;
}

export interface SidebarState {
  collapsible: ComputedRef<SidebarCollapsible>;
  isMobile: ComputedRef<boolean>;
  /** Whether the panel is expanded on a wide viewport. */
  isExpanded: ComputedRef<boolean>;
  /** Whether the drawer is showing on a narrow one. */
  isMobileOpen: ComputedRef<boolean>;
  /** Whether the panel is showing, whichever of the two is in charge at this width. */
  isOpen: ComputedRef<boolean>;
  /**
   * Whether the panel is narrowed rather than hidden — what the parts read to decide whether to
   * drop their labels. False at every width where the panel is a drawer, because a drawer is open
   * or it is gone; there is no half-open drawer to shorten a label for.
   */
  isCollapsed: ComputedRef<boolean>;
  setOpen: (isOpen: boolean) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Undefined until someone sets one, so an untouched sidebar is sized by the stylesheet. */
  width: ComputedRef<string | undefined>;
  setWidth: (width: string) => void;
  /** Put the width back to the declared default, which is what a double-click on the rail does. */
  resetWidth: () => void;
  /** Whether a drag on the rail is in flight, which is what suppresses the width transition. */
  isResizing: ComputedRef<boolean>;
  setResizing: (isResizing: boolean) => void;
}

/**
 * Open state for a sidebar.
 *
 * The two open states are held apart on purpose. A sidebar collapsed to its rail on a wide screen
 * that is then narrowed would, on one shared flag, open its drawer already collapsed — and
 * widening the window again would leave the sidebar expanded because the drawer had been opened.
 * Keeping them separate means each width remembers what the user did at that width, and `isOpen`
 * reads whichever one is in charge.
 *
 * @example
 * ```ts
 * const state = useSidebarState({
 *   collapsible: () => props.collapsible,
 *   isMobile,
 *   isExpanded: () => props.isExpanded,
 *   onExpandedChange: (value) => emit("update:isExpanded", value),
 * });
 * ```
 */
export const useSidebarState = (options: UseSidebarStateOptions): SidebarState => {
  const collapsible = computed(() => toValue(options.collapsible) ?? "icon");
  const isMobile = computed(() => Boolean(toValue(options.isMobile)));
  const isResizing = shallowRef(false);

  const expanded = useControllableState<boolean>({
    defaultValue: options.defaultExpanded ?? true,
    onValueChange: options.onExpandedChange,
    value: options.isExpanded,
  });

  const mobileOpen = useControllableState<boolean>({
    defaultValue: options.defaultMobileOpen ?? false,
    onValueChange: options.onMobileOpenChange,
    value: options.isMobileOpen,
  });

  const width = useControllableState<string | undefined>({
    defaultValue: options.defaultWidth,
    onValueChange: (next) => {
      if (next !== undefined) options.onWidthChange?.(next);
    },
    value: options.width,
  });

  // A sidebar that cannot collapse is expanded whatever the flag says — including a controlled
  // `isExpanded: false`, which under `collapsible: "none"` is a contradiction rather than a state.
  const isExpanded = computed(() => collapsible.value === "none" || expanded.state.value);

  const isOpen = computed(() => (isMobile.value ? mobileOpen.state.value : isExpanded.value));

  const isCollapsed = computed(
    () => !isMobile.value && collapsible.value !== "none" && !isExpanded.value,
  );

  const setOpen = (next: boolean) => {
    if (isMobile.value) {
      mobileOpen.setState(next);

      return;
    }

    if (collapsible.value === "none") return;

    expanded.setState(next);
  };

  return {
    close: () => setOpen(false),
    collapsible,
    isCollapsed,
    isExpanded,
    isMobile,
    isMobileOpen: computed(() => mobileOpen.state.value),
    isOpen,
    isResizing: computed(() => isResizing.value),
    open: () => setOpen(true),
    resetWidth: () => width.setState(options.defaultWidth),
    setOpen,
    setResizing: (next) => {
      isResizing.value = next;
    },
    setWidth: (next) => width.setState(next),
    toggle: () => setOpen(!isOpen.value),
    width: computed(() => width.state.value),
  };
};
