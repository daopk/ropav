import {describe, expect, it} from "vitest";
import {effectScope, nextTick, shallowRef} from "vue";

import {useFocusScope} from "@/composables/use-focus-scope";

/** Run a composable in a disposable scope, mirroring a component lifetime. */
const withScope = <T>(setup: () => T): [T, () => void] => {
  const scope = effectScope();
  const result = scope.run(setup) as T;

  return [result, () => scope.stop()];
};

/**
 * A scope element with two focusable children, standing in for an overlay. It is focusable
 * itself, exactly as the popover the React build renders is.
 */
const buildScope = () => {
  const root = document.createElement("div");

  root.tabIndex = -1;

  const first = document.createElement("button");
  const last = document.createElement("button");

  first.textContent = "first";
  last.textContent = "last";
  root.append(first, last);
  document.body.appendChild(root);

  return {first, last, root};
};

const tab = (options: {shift?: boolean} = {}) => {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    key: "Tab",
    shiftKey: options.shift ?? false,
  });

  (document.activeElement ?? document.body).dispatchEvent(event);

  return event;
};

describe("useFocusScope", () => {
  describe("containment", () => {
    it("wraps from the last focusable back to the first", async () => {
      const {first, last, root} = buildScope();
      const [, dispose] = withScope(() => useFocusScope({contain: true, scopeRef: root}));

      await nextTick();
      last.focus();
      tab();

      // An overlay is rendered at the end of the document, so without the wrap Tab would land
      // on whatever happens to follow in the body.
      expect(document.activeElement).toBe(first);

      dispose();
      root.remove();
    });

    it("wraps backwards from the first focusable to the last", async () => {
      const {first, last, root} = buildScope();
      const [, dispose] = withScope(() => useFocusScope({contain: true, scopeRef: root}));

      await nextTick();
      first.focus();
      tab({shift: true});

      expect(document.activeElement).toBe(last);

      dispose();
      root.remove();
    });

    it("blocks the browser's own tab handling so focus cannot leave", async () => {
      const {last, root} = buildScope();
      const [, dispose] = withScope(() => useFocusScope({contain: true, scopeRef: root}));

      await nextTick();
      last.focus();

      expect(tab().defaultPrevented).toBe(true);

      dispose();
      root.remove();
    });

    it("pulls focus back when it escapes the scope", async () => {
      const {root} = buildScope();
      const outside = document.createElement("button");

      document.body.appendChild(outside);

      const [, dispose] = withScope(() => useFocusScope({contain: true, scopeRef: root}));

      await nextTick();
      outside.focus();

      expect(document.activeElement).toBe(root);

      outside.remove();
      dispose();
      root.remove();
    });

    it("keeps focus on the scope itself when it has nothing focusable", async () => {
      const root = document.createElement("div");

      root.tabIndex = -1;
      document.body.appendChild(root);

      const [, dispose] = withScope(() => useFocusScope({contain: true, scopeRef: root}));

      await nextTick();
      root.focus();
      tab();

      expect(document.activeElement).toBe(root);

      dispose();
      root.remove();
    });

    it("leaves tab alone when it was not asked to contain", async () => {
      const {last, root} = buildScope();
      const [, dispose] = withScope(() => useFocusScope({scopeRef: root}));

      await nextTick();
      last.focus();

      expect(tab().defaultPrevented).toBe(false);

      dispose();
      root.remove();
    });

    it("stops containing once it is no longer active", async () => {
      const isActive = shallowRef(true);
      const {last, root} = buildScope();
      const [, dispose] = withScope(() => useFocusScope({contain: true, isActive, scopeRef: root}));

      await nextTick();
      isActive.value = false;
      await nextTick();
      last.focus();

      expect(tab().defaultPrevented).toBe(false);

      dispose();
      root.remove();
    });
  });

  describe("nesting", () => {
    it("hands containment to the innermost scope", async () => {
      const outer = buildScope();
      const inner = buildScope();

      const [, disposeOuter] = withScope(() =>
        useFocusScope({contain: true, scopeRef: outer.root}),
      );

      await nextTick();

      const [, disposeInner] = withScope(() =>
        useFocusScope({contain: true, scopeRef: inner.root}),
      );

      await nextTick();
      inner.last.focus();
      tab();

      // A submenu is a sibling of its menu rather than a child, so the outer scope must not
      // claim the tab.
      expect(document.activeElement).toBe(inner.first);

      disposeInner();
      disposeOuter();
      outer.root.remove();
      inner.root.remove();
    });

    it("allows focus to move into a nested scope", async () => {
      const outer = buildScope();
      const inner = buildScope();

      const [, disposeOuter] = withScope(() =>
        useFocusScope({contain: true, scopeRef: outer.root}),
      );

      await nextTick();

      const [, disposeInner] = withScope(() => useFocusScope({scopeRef: inner.root}));

      await nextTick();
      inner.first.focus();

      // Pulling this back would make a submenu impossible to reach.
      expect(document.activeElement).toBe(inner.first);

      disposeInner();
      disposeOuter();
      outer.root.remove();
      inner.root.remove();
    });

    it("returns containment to the outer scope when the inner one closes", async () => {
      const outer = buildScope();
      const inner = buildScope();

      const [, disposeOuter] = withScope(() =>
        useFocusScope({contain: true, scopeRef: outer.root}),
      );

      await nextTick();

      const [, disposeInner] = withScope(() =>
        useFocusScope({contain: true, scopeRef: inner.root}),
      );

      await nextTick();
      disposeInner();
      inner.root.remove();

      outer.last.focus();
      tab();

      expect(document.activeElement).toBe(outer.first);

      disposeOuter();
      outer.root.remove();
    });
  });

  describe("auto focus", () => {
    it("focuses the scope itself", async () => {
      const {root} = buildScope();
      const [, dispose] = withScope(() => useFocusScope({autoFocus: true, scopeRef: root}));

      await nextTick();

      expect(document.activeElement).toBe(root);

      dispose();
      root.remove();
    });

    it("focuses the first focusable element", async () => {
      const {first, root} = buildScope();
      const [, dispose] = withScope(() => useFocusScope({autoFocus: "first", scopeRef: root}));

      await nextTick();

      expect(document.activeElement).toBe(first);

      dispose();
      root.remove();
    });

    it("focuses the last focusable element", async () => {
      const {last, root} = buildScope();
      const [, dispose] = withScope(() => useFocusScope({autoFocus: "last", scopeRef: root}));

      await nextTick();

      expect(document.activeElement).toBe(last);

      dispose();
      root.remove();
    });

    it("focuses nothing when it was not asked to", async () => {
      const {root} = buildScope();

      document.body.focus();

      const [, dispose] = withScope(() => useFocusScope({scopeRef: root}));

      await nextTick();

      expect(document.activeElement).not.toBe(root);

      dispose();
      root.remove();
    });
  });

  describe("restoring focus", () => {
    it("gives focus back to what held it before the scope opened", async () => {
      const trigger = document.createElement("button");

      document.body.appendChild(trigger);
      trigger.focus();

      const {root} = buildScope();
      const [, dispose] = withScope(() =>
        useFocusScope({autoFocus: true, restoreFocus: true, scopeRef: root}),
      );

      await nextTick();

      expect(document.activeElement).toBe(root);

      dispose();

      // Without this a keyboard user is dropped at the top of the page when the menu closes.
      expect(document.activeElement).toBe(trigger);

      trigger.remove();
      root.remove();
    });

    it("leaves focus alone when the user already moved it elsewhere", async () => {
      const trigger = document.createElement("button");
      const elsewhere = document.createElement("input");

      document.body.append(trigger, elsewhere);
      trigger.focus();

      const {root} = buildScope();
      const [, dispose] = withScope(() =>
        useFocusScope({autoFocus: true, restoreFocus: true, scopeRef: root}),
      );

      await nextTick();
      elsewhere.focus();
      dispose();

      expect(document.activeElement).toBe(elsewhere);

      trigger.remove();
      elsewhere.remove();
      root.remove();
    });

    it("does nothing when the element it would restore to is gone", async () => {
      const trigger = document.createElement("button");

      document.body.appendChild(trigger);
      trigger.focus();

      const {root} = buildScope();
      const [, dispose] = withScope(() =>
        useFocusScope({autoFocus: true, restoreFocus: true, scopeRef: root}),
      );

      await nextTick();
      trigger.remove();

      expect(() => dispose()).not.toThrow();

      root.remove();
    });

    it("does not restore when it was not asked to", async () => {
      const trigger = document.createElement("button");

      document.body.appendChild(trigger);
      trigger.focus();

      const {root} = buildScope();
      const [, dispose] = withScope(() => useFocusScope({autoFocus: true, scopeRef: root}));

      await nextTick();
      dispose();

      expect(document.activeElement).toBe(root);

      trigger.remove();
      root.remove();
    });
  });
});
