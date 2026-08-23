import type {TabListStateHostProps} from "../fixtures/tab-list-state.types";
import type {CollectionKey, UseTabListStateReturn} from "@/composables";

import {renderVapor} from "@ropav/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick, shallowRef} from "vue";

import TabListStateHost from "../fixtures/tab-list-state-host.vue";

const KEYS: CollectionKey[] = ["a", "b", "c"];

/**
 * Mount the host and hand back the state it built.
 *
 * The collection comes from real registrations, so nothing derived from it is settled until the
 * first post-flush has run — every assertion here waits a tick first.
 */
const setup = async (props: Partial<TabListStateHostProps> = {}) => {
  let state: UseTabListStateReturn | undefined;

  const rendered = renderVapor(TabListStateHost, {
    props: {
      keys: KEYS,
      ...props,
      onReady: (ready: UseTabListStateReturn) => {
        state = ready;
      },
    },
  });

  await nextTick();

  return {...rendered, state: state!};
};

describe("useTabListState", () => {
  describe("the selected tab", () => {
    it("selects the first tab once the tabs have registered", async () => {
      const onSelectionChange = vi.fn();
      const {state} = await setup({onSelectionChange});

      expect(state.selectedKey.value).toBe("a");
      // Resolving the fallback is a read, not a write, so nothing is reported as changed.
      expect(onSelectionChange).not.toHaveBeenCalled();
    });

    it("skips a first tab that is disabled by the group", async () => {
      const {state} = await setup({disabledKeys: ["a"]});

      expect(state.selectedKey.value).toBe("b");
    });

    it("skips a first tab that reports itself disabled", async () => {
      const {state} = await setup({disabled: ["a", "b"]});

      expect(state.selectedKey.value).toBe("c");
    });

    it("falls back to the first tab when every tab is disabled", async () => {
      const {state} = await setup({disabledKeys: KEYS});

      expect(state.selectedKey.value).toBe("a");
    });

    it("honours an explicit default", async () => {
      const {state} = await setup({defaultSelectedKey: "c"});

      expect(state.selectedKey.value).toBe("c");
    });

    it("honours a controlled key the list does not hold", async () => {
      const {state} = await setup({selectedKey: "zzz"});

      expect(state.selectedKey.value).toBe("zzz");
    });

    it("falls back when the selected tab leaves the list", async () => {
      const keys = shallowRef<CollectionKey[]>(["a", "b", "c"]);
      let state: UseTabListStateReturn | undefined;

      renderVapor(TabListStateHost, {
        props: {
          defaultSelectedKey: "b",
          get keys() {
            return keys.value;
          },
          onReady: (ready: UseTabListStateReturn) => {
            state = ready;
          },
        },
      });
      await nextTick();

      expect(state!.selectedKey.value).toBe("b");

      keys.value = ["a", "c"];
      await nextTick();
      await nextTick();

      expect(state!.selectedKey.value).toBe("a");
    });

    it("reports a selection made through the manager", async () => {
      const onSelectionChange = vi.fn();
      const {state} = await setup({onSelectionChange});

      state.selection.select("c");
      await nextTick();

      expect(state.selectedKey.value).toBe("c");
      expect(onSelectionChange).toHaveBeenCalledWith("c");
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
    });

    it("never lets go of the selection", async () => {
      const {state} = await setup();

      state.selection.select("c");
      await nextTick();
      state.selection.select("c");
      await nextTick();

      expect(state.selectedKey.value).toBe("c");
    });

    it("clears nothing on a clear", async () => {
      const {state} = await setup();

      state.selection.clearSelection();
      await nextTick();

      expect(state.selectedKey.value).toBe("a");
    });
  });

  describe("focus", () => {
    it("moves focus onto the selected tab once it exists", async () => {
      const {state} = await setup();

      expect(state.selection.focusedKey.value).toBe("a");
    });

    it("follows the selection while the list is not focused", async () => {
      const {state} = await setup();

      state.setSelectedKey("c");
      await nextTick();

      expect(state.selection.focusedKey.value).toBe("c");
    });

    it("leaves the focused key alone while the list is focused", async () => {
      const {state} = await setup();

      state.selection.setFocused(true);
      state.selection.setFocusedKey("b");
      state.setSelectedKey("c");
      await nextTick();

      expect(state.selection.focusedKey.value).toBe("b");
    });
  });

  describe("ids", () => {
    it("derives the tab and panel ids from one base", async () => {
      const {state} = await setup({id: "tabs-1"});

      expect(state.tabsId.value).toBe("tabs-1");
      expect(state.tabId("a")).toBe("tabs-1-tab-a");
      expect(state.tabPanelId("a")).toBe("tabs-1-tabpanel-a");
    });

    it("strips whitespace out of a key", async () => {
      const {state} = await setup({id: "tabs-1"});

      expect(state.tabId("two words")).toBe("tabs-1-tab-twowords");
    });

    it("names nothing for a key that does not exist", async () => {
      const {state} = await setup();

      expect(state.tabId(null)).toBeUndefined();
      expect(state.tabPanelId(undefined)).toBeUndefined();
    });
  });

  it("reports the list's own disabled state", async () => {
    const {state} = await setup({isDisabled: true});

    expect(state.isDisabled.value).toBe(true);
  });
});
