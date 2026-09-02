import { describe, expect, it, vi } from "vitest";
import { shallowRef } from "vue";

import {
  useMenuTriggerState,
  useOverlayTriggerState,
  useSubmenuTriggerState,
} from "@/composables/use-overlay-trigger-state";

import { withScope } from "../harness/scope";

describe("useOverlayTriggerState", () => {
  describe("uncontrolled", () => {
    it("starts closed", () => {
      const [state, dispose] = withScope(() => useOverlayTriggerState());

      expect(state.isOpen.value).toBe(false);

      dispose();
    });

    it("starts at the default", () => {
      const [state, dispose] = withScope(() => useOverlayTriggerState({ defaultOpen: true }));

      expect(state.isOpen.value).toBe(true);

      dispose();
    });

    it("opens, closes and toggles", () => {
      const onOpenChange = vi.fn();
      const [state, dispose] = withScope(() => useOverlayTriggerState({ onOpenChange }));

      state.open();
      expect(state.isOpen.value).toBe(true);

      state.close();
      expect(state.isOpen.value).toBe(false);

      state.toggle();
      expect(state.isOpen.value).toBe(true);

      expect(onOpenChange).toHaveBeenNthCalledWith(1, true);
      expect(onOpenChange).toHaveBeenNthCalledWith(2, false);
      expect(onOpenChange).toHaveBeenNthCalledWith(3, true);

      dispose();
    });
  });

  describe("controlled", () => {
    it("follows the flag it is given and does not move itself", () => {
      const isOpen = shallowRef(false);
      const onOpenChange = vi.fn();
      const [state, dispose] = withScope(() => useOverlayTriggerState({ isOpen, onOpenChange }));

      state.open();

      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(state.isOpen.value).toBe(false);

      isOpen.value = true;

      expect(state.isOpen.value).toBe(true);

      dispose();
    });
  });
});

describe("useMenuTriggerState", () => {
  describe("focus strategy", () => {
    /* How the menu was opened decides where focus lands: ArrowUp opens on the last item. */
    it("remembers the strategy the trigger opened with", () => {
      const [state, dispose] = withScope(() => useMenuTriggerState());

      expect(state.focusStrategy.value).toBe(null);

      state.open("last");

      expect(state.isOpen.value).toBe(true);
      expect(state.focusStrategy.value).toBe("last");

      dispose();
    });

    it("defaults to no strategy, which focuses the menu itself", () => {
      const [state, dispose] = withScope(() => useMenuTriggerState());

      state.open();

      expect(state.focusStrategy.value).toBe(null);

      dispose();
    });

    it("carries a strategy through toggle", () => {
      const [state, dispose] = withScope(() => useMenuTriggerState());

      state.toggle("first");

      expect(state.isOpen.value).toBe(true);
      expect(state.focusStrategy.value).toBe("first");

      dispose();
    });
  });

  describe("submenu stack", () => {
    it("starts empty", () => {
      const [state, dispose] = withScope(() => useMenuTriggerState());

      expect(state.expandedKeysStack.value).toEqual([]);

      dispose();
    });

    it("pushes one key per level", () => {
      const [state, dispose] = withScope(() => useMenuTriggerState({ defaultOpen: true }));

      state.openSubmenu("a", 0);
      state.openSubmenu("b", 1);

      expect(state.expandedKeysStack.value).toEqual(["a", "b"]);

      dispose();
    });

    /* What makes "only one path through the tree is open" true by construction. */
    it("truncates the stack when a sibling opens at the same level", () => {
      const [state, dispose] = withScope(() => useMenuTriggerState({ defaultOpen: true }));

      state.openSubmenu("a", 0);
      state.openSubmenu("b", 1);
      state.openSubmenu("c", 0);

      expect(state.expandedKeysStack.value).toEqual(["c"]);

      dispose();
    });

    it("ignores a level deeper than the stack, which has no parent open", () => {
      const [state, dispose] = withScope(() => useMenuTriggerState({ defaultOpen: true }));

      state.openSubmenu("a", 2);

      expect(state.expandedKeysStack.value).toEqual([]);

      dispose();
    });

    /* A stale trigger asking would otherwise truncate under a sibling that has since opened. */
    it("lets only the trigger actually open at a level close it", () => {
      const [state, dispose] = withScope(() => useMenuTriggerState({ defaultOpen: true }));

      state.openSubmenu("a", 0);
      state.closeSubmenu("stale", 0);

      expect(state.expandedKeysStack.value).toEqual(["a"]);

      state.closeSubmenu("a", 0);

      expect(state.expandedKeysStack.value).toEqual([]);

      dispose();
    });

    it("closes the whole tree when the menu closes", () => {
      const [state, dispose] = withScope(() => useMenuTriggerState({ defaultOpen: true }));

      state.openSubmenu("a", 0);
      state.openSubmenu("b", 1);
      state.close();

      expect(state.isOpen.value).toBe(false);
      expect(state.expandedKeysStack.value).toEqual([]);

      dispose();
    });
  });
});

describe("useSubmenuTriggerState", () => {
  it("is closed until it has been told which item it belongs to", () => {
    const [{ submenu }, dispose] = withScope(() => {
      const root = useMenuTriggerState({ defaultOpen: true });

      return { submenu: useSubmenuTriggerState({ triggerKey: null }, root) };
    });

    submenu.open();

    expect(submenu.isOpen.value).toBe(false);

    dispose();
  });

  it("derives its open state from the root's stack", () => {
    const [{ root, submenu }, dispose] = withScope(() => {
      const menu = useMenuTriggerState({ defaultOpen: true });

      return { root: menu, submenu: useSubmenuTriggerState({ triggerKey: "a" }, menu) };
    });

    expect(submenu.submenuLevel).toBe(0);
    expect(submenu.isOpen.value).toBe(false);

    submenu.open("first");

    expect(submenu.isOpen.value).toBe(true);
    expect(submenu.focusStrategy.value).toBe("first");
    expect(root.expandedKeysStack.value).toEqual(["a"]);

    dispose();
  });

  /* No coordination between siblings: the root's stack is the only thing either one reads. */
  it("closes when a sibling at the same level opens", () => {
    const [{ first, second }, dispose] = withScope(() => {
      const menu = useMenuTriggerState({ defaultOpen: true });

      return {
        first: useSubmenuTriggerState({ triggerKey: "a" }, menu),
        second: useSubmenuTriggerState({ triggerKey: "b" }, menu),
      };
    });

    first.open();

    expect(first.isOpen.value).toBe(true);
    expect(second.isOpen.value).toBe(false);

    second.open();

    expect(first.isOpen.value).toBe(false);
    expect(second.isOpen.value).toBe(true);

    dispose();
  });

  /* The level describes where the trigger sits, which does not change; the stack does. */
  it("captures its level once, when it is created", () => {
    const [{ nested }, dispose] = withScope(() => {
      const menu = useMenuTriggerState({ defaultOpen: true });

      menu.openSubmenu("a", 0);

      return { nested: useSubmenuTriggerState({ triggerKey: "b" }, menu) };
    });

    expect(nested.submenuLevel).toBe(1);

    nested.open();

    expect(nested.isOpen.value).toBe(true);

    dispose();
  });

  it("follows its trigger key being assigned late", () => {
    const triggerKey = shallowRef<string | null>(null);
    const [{ root, submenu }, dispose] = withScope(() => {
      const menu = useMenuTriggerState({ defaultOpen: true });

      return { root: menu, submenu: useSubmenuTriggerState({ triggerKey }, menu) };
    });

    triggerKey.value = "a";
    submenu.open();

    expect(submenu.isOpen.value).toBe(true);
    expect(root.expandedKeysStack.value).toEqual(["a"]);

    dispose();
  });

  it("toggles between open and closed", () => {
    const [{ submenu }, dispose] = withScope(() => {
      const menu = useMenuTriggerState({ defaultOpen: true });

      return { submenu: useSubmenuTriggerState({ triggerKey: "a" }, menu) };
    });

    submenu.toggle("last");

    expect(submenu.isOpen.value).toBe(true);
    expect(submenu.focusStrategy.value).toBe("last");

    submenu.toggle();

    expect(submenu.isOpen.value).toBe(false);

    dispose();
  });

  it("closes every menu in the tree, which is what selecting an item does", () => {
    const [{ root, submenu }, dispose] = withScope(() => {
      const menu = useMenuTriggerState({ defaultOpen: true });

      return { root: menu, submenu: useSubmenuTriggerState({ triggerKey: "a" }, menu) };
    });

    submenu.open();
    submenu.closeAll();

    expect(root.isOpen.value).toBe(false);
    expect(root.expandedKeysStack.value).toEqual([]);
    expect(submenu.isOpen.value).toBe(false);

    dispose();
  });
});
