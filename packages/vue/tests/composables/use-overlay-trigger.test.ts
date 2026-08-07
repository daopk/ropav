import {describe, expect, it, vi} from "vitest";
import {effectScope, shallowRef} from "vue";

import {useOverlayTrigger} from "@/composables/use-overlay-trigger";
import {
  useMenuTriggerState,
  useOverlayTriggerState,
  useSubmenuTriggerState,
} from "@/composables/use-overlay-trigger-state";

/** Run a composable in a disposable scope, mirroring a component lifetime. */
const withScope = <T>(setup: () => T): [T, () => void] => {
  const scope = effectScope();
  const result = scope.run(setup) as T;

  return [result, () => scope.stop()];
};

describe("useOverlayTriggerState", () => {
  it("starts closed", () => {
    const [state, dispose] = withScope(() => useOverlayTriggerState());

    expect(state.isOpen.value).toBe(false);

    dispose();
  });

  it("honours an uncontrolled default", () => {
    const [state, dispose] = withScope(() => useOverlayTriggerState({defaultOpen: true}));

    expect(state.isOpen.value).toBe(true);

    dispose();
  });

  it("opens, closes and toggles", () => {
    const [state, dispose] = withScope(() => useOverlayTriggerState());

    state.open();
    expect(state.isOpen.value).toBe(true);

    state.toggle();
    expect(state.isOpen.value).toBe(false);

    state.toggle();
    expect(state.isOpen.value).toBe(true);

    state.close();
    expect(state.isOpen.value).toBe(false);

    dispose();
  });

  it("reports changes without holding its own state while controlled", () => {
    const isOpen = shallowRef(false);
    const onOpenChange = vi.fn();
    const [state, dispose] = withScope(() => useOverlayTriggerState({isOpen, onOpenChange}));

    state.open();

    // The owner of `isOpen` decides; the state must not have moved on its own.
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(state.isOpen.value).toBe(false);

    isOpen.value = true;

    expect(state.isOpen.value).toBe(true);

    dispose();
  });
});

describe("useMenuTriggerState", () => {
  it("records where focus should land when it opens", () => {
    const [state, dispose] = withScope(() => useMenuTriggerState());

    state.open("last");

    // ArrowUp opens a menu with the last item focused; a mouse click focuses the menu itself.
    expect(state.focusStrategy.value).toBe("last");

    state.close();
    state.open();

    expect(state.focusStrategy.value).toBeNull();

    dispose();
  });

  it("keeps one open path through the menu tree", () => {
    const [state, dispose] = withScope(() => useMenuTriggerState());

    state.open();
    state.openSubmenu("share", 0);
    state.openSubmenu("email", 1);

    expect(state.expandedKeysStack.value).toEqual(["share", "email"]);

    // Opening a sibling at level 0 discards everything that was open beneath the old one.
    state.openSubmenu("other", 0);

    expect(state.expandedKeysStack.value).toEqual(["other"]);

    dispose();
  });

  it("refuses to open a submenu deeper than the open path", () => {
    const [state, dispose] = withScope(() => useMenuTriggerState());

    state.open();
    state.openSubmenu("email", 2);

    // Nothing is open at level 1, so there is no submenu for this one to hang off.
    expect(state.expandedKeysStack.value).toEqual([]);

    dispose();
  });

  it("ignores a close from a trigger that is no longer the open one", () => {
    const [state, dispose] = withScope(() => useMenuTriggerState());

    state.open();
    state.openSubmenu("share", 0);
    state.closeSubmenu("other", 0);

    expect(state.expandedKeysStack.value).toEqual(["share"]);

    state.closeSubmenu("share", 0);

    expect(state.expandedKeysStack.value).toEqual([]);

    dispose();
  });

  it("closes the whole tree when the menu closes", () => {
    const [state, dispose] = withScope(() => useMenuTriggerState());

    state.open();
    state.openSubmenu("share", 0);
    state.openSubmenu("email", 1);
    state.close();

    expect(state.isOpen.value).toBe(false);
    expect(state.expandedKeysStack.value).toEqual([]);

    dispose();
  });
});

describe("useSubmenuTriggerState", () => {
  it("derives its open state from the root", () => {
    const [{root, submenu}, dispose] = withScope(() => {
      const root = useMenuTriggerState();

      root.open();

      return {root, submenu: useSubmenuTriggerState({triggerKey: "share"}, root)};
    });

    expect(submenu.submenuLevel).toBe(0);
    expect(submenu.isOpen.value).toBe(false);

    submenu.open("first");

    expect(submenu.isOpen.value).toBe(true);
    expect(submenu.focusStrategy.value).toBe("first");
    expect(root.expandedKeysStack.value).toEqual(["share"]);

    submenu.close();

    expect(submenu.isOpen.value).toBe(false);

    dispose();
  });

  it("closes when a sibling submenu opens", () => {
    const [{other, share}, dispose] = withScope(() => {
      const root = useMenuTriggerState();

      root.open();

      return {
        other: useSubmenuTriggerState({triggerKey: "other"}, root),
        share: useSubmenuTriggerState({triggerKey: "share"}, root),
      };
    });

    share.open();

    expect(share.isOpen.value).toBe(true);

    other.open();

    // No coordination between the two: the root holds a single key per level.
    expect(share.isOpen.value).toBe(false);
    expect(other.isOpen.value).toBe(true);

    dispose();
  });

  it("closes every menu in the tree when asked to close all", () => {
    const [{root, submenu}, dispose] = withScope(() => {
      const root = useMenuTriggerState();

      root.open();

      return {root, submenu: useSubmenuTriggerState({triggerKey: "share"}, root)};
    });

    submenu.open();
    submenu.closeAll();

    // Selecting an item in a submenu dismisses the menu it was reached through.
    expect(root.isOpen.value).toBe(false);
    expect(submenu.isOpen.value).toBe(false);

    dispose();
  });
});

describe("useOverlayTrigger", () => {
  it("announces a menu trigger as having a popup", () => {
    const [{state, trigger}, dispose] = withScope(() => {
      const state = useOverlayTriggerState();

      return {state, trigger: useOverlayTrigger({type: "menu"}, state)};
    });

    expect(trigger.triggerAttributes.value["aria-haspopup"]).toBe(true);
    expect(trigger.triggerAttributes.value["aria-expanded"]).toBe(false);
    expect(trigger.triggerAttributes.value["aria-controls"]).toBeUndefined();

    state.open();

    expect(trigger.triggerAttributes.value["aria-expanded"]).toBe(true);
    // Only present while the overlay exists: an idref naming nothing is worse than none.
    expect(trigger.triggerAttributes.value["aria-controls"]).toBe(trigger.overlayId.value);

    dispose();
  });

  it("names the popup type for a listbox", () => {
    const [trigger, dispose] = withScope(() =>
      useOverlayTrigger({type: "listbox"}, useOverlayTriggerState()),
    );

    expect(trigger.triggerAttributes.value["aria-haspopup"]).toBe("listbox");

    dispose();
  });

  it("says nothing about a popup for a dialog", () => {
    const [trigger, dispose] = withScope(() =>
      useOverlayTrigger({type: "dialog"}, useOverlayTriggerState()),
    );

    // Screen readers announce most other `aria-haspopup` values as "menu", which would be
    // worse than saying nothing at all.
    expect(trigger.triggerAttributes.value["aria-haspopup"]).toBeUndefined();

    dispose();
  });
});
