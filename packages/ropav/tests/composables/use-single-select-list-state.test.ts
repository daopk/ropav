import type { SingleSelectListStateHostProps } from "../fixtures/single-select-list-state.types";
import type { CollectionKey } from "@/composables/use-collection";
import type { UseSingleSelectListStateReturn } from "@/composables/use-single-select-list-state";

import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick, shallowRef } from "vue";

import SingleSelectListStateHost from "../fixtures/single-select-list-state-host.vue";

const KEYS: CollectionKey[] = ["a", "b", "c"];

/**
 * Mount the host and hand back the state it built.
 *
 * The collection comes from real registrations, so nothing derived from it is settled until the
 * first post-flush has run — every assertion here waits a tick first.
 */
const setup = async (props: Partial<SingleSelectListStateHostProps> = {}) => {
  let state: UseSingleSelectListStateReturn | undefined;

  const rendered = renderVapor(SingleSelectListStateHost, {
    props: {
      keys: KEYS,
      ...props,
      onReady: (ready: UseSingleSelectListStateReturn) => {
        state = ready;
      },
    },
  });

  await nextTick();

  return { ...rendered, state: state! };
};

describe("useSingleSelectListState", () => {
  describe("the selected item", () => {
    it("selects the first item once the items have registered", async () => {
      const onSelectionChange = vi.fn();
      const { state } = await setup({ onSelectionChange });

      expect(state.selectedKey.value).toBe("a");
      // Resolving the fallback is a read, not a write, so nothing is reported as changed.
      expect(onSelectionChange).not.toHaveBeenCalled();
    });

    it("skips a first item that is disabled by the group", async () => {
      const { state } = await setup({ disabledKeys: ["a"] });

      expect(state.selectedKey.value).toBe("b");
    });

    it("skips a first item that reports itself disabled", async () => {
      const { state } = await setup({ disabled: ["a", "b"] });

      expect(state.selectedKey.value).toBe("c");
    });

    it("falls back to the first item when every item is disabled", async () => {
      const { state } = await setup({ disabledKeys: KEYS });

      expect(state.selectedKey.value).toBe("a");
    });

    it("honours an explicit default", async () => {
      const { state } = await setup({ defaultSelectedKey: "c" });

      expect(state.selectedKey.value).toBe("c");
    });

    it("honours a controlled key the list does not hold", async () => {
      const { state } = await setup({ selectedKey: "zzz" });

      expect(state.selectedKey.value).toBe("zzz");
    });

    it("falls back when the selected item leaves the list", async () => {
      const keys = shallowRef<CollectionKey[]>(["a", "b", "c"]);
      let state: UseSingleSelectListStateReturn | undefined;

      renderVapor(SingleSelectListStateHost, {
        props: {
          defaultSelectedKey: "b",
          get keys() {
            return keys.value;
          },
          onReady: (ready: UseSingleSelectListStateReturn) => {
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
      const { state } = await setup({ onSelectionChange });

      state.selection.select("c");
      await nextTick();

      expect(state.selectedKey.value).toBe("c");
      expect(onSelectionChange).toHaveBeenCalledWith("c");
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
    });

    it("never lets go of the selection", async () => {
      const { state } = await setup();

      state.selection.select("c");
      await nextTick();
      state.selection.select("c");
      await nextTick();

      expect(state.selectedKey.value).toBe("c");
    });

    it("clears nothing on a clear", async () => {
      const { state } = await setup();

      state.selection.clearSelection();
      await nextTick();

      expect(state.selectedKey.value).toBe("a");
    });
  });

  describe("focus", () => {
    it("moves focus onto the selected item once it exists", async () => {
      const { state } = await setup();

      expect(state.selection.focusedKey.value).toBe("a");
    });

    it("follows the selection while the list is not focused", async () => {
      const { state } = await setup();

      state.setSelectedKey("c");
      await nextTick();

      expect(state.selection.focusedKey.value).toBe("c");
    });

    it("leaves the focused key alone while the list is focused", async () => {
      const { state } = await setup();

      state.selection.setFocused(true);
      state.selection.setFocusedKey("b");
      state.setSelectedKey("c");
      await nextTick();

      expect(state.selection.focusedKey.value).toBe("b");
    });
  });

  it("reports the list's own disabled state", async () => {
    const { state } = await setup({ isDisabled: true });

    expect(state.isDisabled.value).toBe(true);
  });
});
