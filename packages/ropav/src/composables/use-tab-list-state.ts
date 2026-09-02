import type { CollectionKey } from "./use-collection";
import type {
  UseSingleSelectListStateOptions,
  UseSingleSelectListStateReturn,
} from "./use-single-select-list-state";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { shallowRef, toValue } from "vue";

import { useId } from "./use-id";
import { useSingleSelectListState } from "./use-single-select-list-state";

export interface UseTabListStateOptions extends UseSingleSelectListStateOptions {
  /** A base the tab and panel ids are derived from. Generated when absent. */
  id?: MaybeRefOrGetter<string | undefined>;
}

export interface UseTabListStateReturn extends UseSingleSelectListStateReturn {
  /** The tab list's own id, which the tab and panel ids hang off. */
  tabsId: ComputedRef<string>;
  /** `undefined` for a key that does not exist, so no attribute points at nothing. */
  tabId: (key: CollectionKey | null | undefined) => string | undefined;
  tabPanelId: (key: CollectionKey | null | undefined) => string | undefined;
  /**
   * Whether a panel for this key is in the document.
   *
   * Tabs are usable without panels - driving something rendered elsewhere on the page is a normal
   * arrangement - and a tab that points `aria-controls` at an element that was never rendered is
   * worse than one that points nowhere.
   */
  hasPanel: (key: CollectionKey | null | undefined) => boolean;
  /** Called by a panel while it is mounted. Returns the matching unregister. */
  registerPanel: (key: CollectionKey) => () => void;
}

/**
 * Which tab is selected, and the ids that tie each tab to its panel.
 *
 * Ported from React Stately's `useTabListState` (`react-stately/src/tabs/useTabListState.ts`,
 * react-stately 3.49.0), together with the id scheme from `react-aria/src/tabs/utils.ts`
 * (react-aria 3.51.0).
 *
 * The selection itself is {@link useSingleSelectListState}, the layer React Stately builds this
 * one on. What is left here is what makes a tab list a tab list rather than any other list with
 * one selection: the ids, and the panels they point at.
 */
export const useTabListState = (options: UseTabListStateOptions = {}): UseTabListStateReturn => {
  const list = useSingleSelectListState(options);

  const tabsId = useId(() => toValue(options.id));

  /** React Aria strips whitespace out of a string key so the id stays a single token. */
  const idFor = (key: CollectionKey | null | undefined, role: "tab" | "tabpanel") =>
    key == null ? undefined : `${tabsId.value}-${role}-${String(key).replace(/\s+/g, "")}`;

  const panelKeys = shallowRef<ReadonlySet<CollectionKey>>(new Set());

  return {
    ...list,
    hasPanel: (key) => key != null && panelKeys.value.has(key),
    registerPanel: (key) => {
      panelKeys.value = new Set(panelKeys.value).add(key);

      return () => {
        const next = new Set(panelKeys.value);

        next.delete(key);
        panelKeys.value = next;
      };
    },
    tabId: (key) => idFor(key, "tab"),
    tabPanelId: (key) => idFor(key, "tabpanel"),
    tabsId,
  };
};
