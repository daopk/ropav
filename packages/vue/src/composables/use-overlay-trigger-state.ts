import type {CollectionKey} from "./use-collection";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, shallowRef, toValue} from "vue";

import {useControllableState} from "./use-controllable-state";

/** Which end of a collection receives focus when an overlay opens. */
export type FocusStrategy = "first" | "last";

export interface UseOverlayTriggerStateProps {
  isOpen?: MaybeRefOrGetter<boolean | undefined>;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export interface OverlayTriggerState {
  isOpen: ComputedRef<boolean>;
  setOpen: (isOpen: boolean) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Open state for an overlay trigger, ported from React Stately's `useOverlayTriggerState`.
 *
 * @example
 * ```ts
 * const state = useOverlayTriggerState({
 *   isOpen: () => props.isOpen,
 *   onOpenChange: (isOpen) => emit("openChange", isOpen),
 * });
 * ```
 */
export const useOverlayTriggerState = (
  props: UseOverlayTriggerStateProps = {},
): OverlayTriggerState => {
  const {setState, state} = useControllableState<boolean>({
    defaultValue: props.defaultOpen ?? false,
    onValueChange: props.onOpenChange,
    value: props.isOpen,
  });

  return {
    close: () => setState(false),
    isOpen: computed(() => state.value),
    open: () => setState(true),
    setOpen: setState,
    toggle: () => setState(!state.value),
  };
};

export interface MenuTriggerState extends OverlayTriggerState {
  /** Which item the menu focuses when it opens, or `null` to focus the menu itself. */
  focusStrategy: ComputedRef<FocusStrategy | null>;
  open: (focusStrategy?: FocusStrategy | null) => void;
  toggle: (focusStrategy?: FocusStrategy | null) => void;
}

export interface RootMenuTriggerState extends MenuTriggerState {
  /**
   * The open submenu trigger keys, one per level: index 0 is the submenu opened from the root
   * menu, index 1 the submenu opened from that one, and so on.
   */
  expandedKeysStack: ComputedRef<CollectionKey[]>;
  openSubmenu: (triggerKey: CollectionKey, level: number) => void;
  closeSubmenu: (triggerKey: CollectionKey, level: number) => void;
}

/**
 * Open state for a menu trigger, ported from React Stately's `useMenuTriggerState`.
 *
 * Adds two things to a plain overlay trigger. A focus strategy, because how a menu was opened
 * decides where focus lands: ArrowUp opens it focused on the last item, a mouse click opens it
 * focused on the menu itself. And the stack of open submenus, held here on the root rather
 * than in each submenu, which is what makes "only one path through the menu tree is open at a
 * time" true by construction — opening a submenu at level N truncates the stack to N.
 *
 * @example
 * ```ts
 * const state = useMenuTriggerState({isOpen: () => props.isOpen});
 * state.open("last"); // ArrowUp on the trigger
 * ```
 */
export const useMenuTriggerState = (
  props: UseOverlayTriggerStateProps = {},
): RootMenuTriggerState => {
  const overlay = useOverlayTriggerState(props);
  const focusStrategy = shallowRef<FocusStrategy | null>(null);
  const expandedKeys = shallowRef<CollectionKey[]>([]);

  return {
    close: () => {
      // Closing the menu closes the whole tree under it.
      expandedKeys.value = [];
      overlay.close();
    },
    closeSubmenu: (triggerKey, level) => {
      // Only the submenu that is actually open at that level may close it; a stale trigger
      // asking would otherwise truncate the stack under a sibling that has since opened.
      if (expandedKeys.value[level] === triggerKey) {
        expandedKeys.value = expandedKeys.value.slice(0, level);
      }
    },
    expandedKeysStack: computed(() => expandedKeys.value),
    focusStrategy: computed(() => focusStrategy.value),
    isOpen: overlay.isOpen,
    open: (strategy: FocusStrategy | null = null) => {
      focusStrategy.value = strategy;
      overlay.open();
    },
    openSubmenu: (triggerKey, level) => {
      // A level deeper than the stack has no parent open, so there is nothing to attach to.
      if (level > expandedKeys.value.length) return;

      expandedKeys.value = [...expandedKeys.value.slice(0, level), triggerKey];
    },
    setOpen: overlay.setOpen,
    toggle: (strategy: FocusStrategy | null = null) => {
      focusStrategy.value = strategy;
      overlay.toggle();
    },
  };
};

export interface SubmenuTriggerState extends OverlayTriggerState {
  focusStrategy: ComputedRef<FocusStrategy | null>;
  open: (focusStrategy?: FocusStrategy | null) => void;
  toggle: (focusStrategy?: FocusStrategy | null) => void;
  /** Closes every menu in the tree, which is what selecting an item does. */
  closeAll: () => void;
  /** How deep this submenu sits, counting the root menu as level 0. */
  submenuLevel: number;
}

export interface UseSubmenuTriggerStateProps {
  /**
   * The key of the item that opens this submenu.
   *
   * Read reactively, because the item is declared beside the submenu rather than around it: the
   * submenu exists before it has been told which item it belongs to, and is closed until it has.
   */
  triggerKey: MaybeRefOrGetter<CollectionKey | null>;
}

/**
 * Open state for one submenu, ported from React Stately's `useSubmenuTriggerState`.
 *
 * Holds no open flag of its own — it derives one by asking the root whether its own trigger
 * key is the one expanded at its level. That is what makes opening a sibling submenu close
 * this one with no coordination between the two.
 *
 * The level is captured once, when the submenu trigger is created, and deliberately not
 * recomputed: it describes where this trigger sits in the tree, which does not change, whereas
 * the stack it was read from changes constantly.
 */
export const useSubmenuTriggerState = (
  props: UseSubmenuTriggerStateProps,
  root: RootMenuTriggerState,
): SubmenuTriggerState => {
  const submenuLevel = root.expandedKeysStack.value.length;
  const focusStrategy = shallowRef<FocusStrategy | null>(null);

  const triggerKey = computed(() => toValue(props.triggerKey));

  const isOpen = computed(
    () =>
      triggerKey.value !== null && root.expandedKeysStack.value[submenuLevel] === triggerKey.value,
  );

  const close = () => {
    focusStrategy.value = null;

    if (triggerKey.value === null) return;

    root.closeSubmenu(triggerKey.value, submenuLevel);
  };

  const open = (strategy: FocusStrategy | null = null) => {
    focusStrategy.value = strategy;

    if (triggerKey.value === null) return;

    root.openSubmenu(triggerKey.value, submenuLevel);
  };

  return {
    close,
    closeAll: root.close,
    focusStrategy: computed(() => focusStrategy.value),
    isOpen,
    open,
    setOpen: (next) => (next ? open() : close()),
    submenuLevel,
    toggle: (strategy: FocusStrategy | null = null) => {
      if (isOpen.value) close();
      else open(strategy);
    },
  };
};
