import type {
  UseDisclosureGroupOptions,
  UseDisclosureGroupReturn,
} from "@/composables/use-disclosure-group";

import {afterEach, describe, expect, it, vi} from "vitest";
import {effectScope, shallowRef} from "vue";

import {useDisclosureGroup} from "@/composables/use-disclosure-group";

const scopes: (() => void)[] = [];

const createGroup = (props: UseDisclosureGroupOptions = {}): UseDisclosureGroupReturn => {
  const scope = effectScope();

  scopes.push(() => scope.stop());

  return scope.run(() => useDisclosureGroup(props)) as UseDisclosureGroupReturn;
};

/** Three registered trigger buttons in the document, wired to the group's handler. */
const createTriggers = (group: UseDisclosureGroupReturn, keys = ["a", "b", "c"]) => {
  const container = document.createElement("div");

  document.body.appendChild(container);

  const buttons = keys.map((key) => {
    const button = document.createElement("button");

    button.textContent = key;
    container.appendChild(button);
    group.registerTrigger(key, button);
    button.addEventListener("keydown", group.onTriggerKeydown);

    return button;
  });

  return {buttons, container};
};

const pressKey = (element: HTMLElement, key: string) =>
  element.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key}));

afterEach(() => {
  scopes.splice(0).forEach((stop) => stop());
  document.body.innerHTML = "";
});

describe("useDisclosureGroup", () => {
  describe("expansion", () => {
    it("starts from defaultExpandedKeys", () => {
      const group = createGroup({defaultExpandedKeys: ["a"]});

      expect(group.isExpanded("a")).toBe(true);
      expect(group.isExpanded("b")).toBe(false);
    });

    it("collapses the open item when only one may be expanded", () => {
      const group = createGroup({defaultExpandedKeys: ["a"]});

      group.toggle("b");

      expect(group.isExpanded("a")).toBe(false);
      expect(group.isExpanded("b")).toBe(true);
    });

    it("keeps items open when multiple may be expanded", () => {
      const group = createGroup({allowsMultipleExpanded: true, defaultExpandedKeys: ["a"]});

      group.toggle("b");

      expect([...group.expandedKeys.value]).toEqual(["a", "b"]);
    });

    it("toggles an expanded item closed", () => {
      const group = createGroup({defaultExpandedKeys: ["a"]});

      group.toggle("a");

      expect(group.expandedKeys.value.size).toBe(0);
    });

    it("calls onExpandedChange with the next key set", () => {
      const onExpandedChange = vi.fn();
      const group = createGroup({allowsMultipleExpanded: true, onExpandedChange});

      group.expand("a");

      expect(onExpandedChange).toHaveBeenCalledWith(new Set(["a"]));
    });

    it("supports controlled expandedKeys", () => {
      const expandedKeys = shallowRef<string[]>(["a"]);
      const onExpandedChange = vi.fn();
      const group = createGroup({expandedKeys, onExpandedChange});

      expect(group.isExpanded("a")).toBe(true);

      group.toggle("a");

      // Controlled: the caller owns the value, so only the callback fires.
      expect(onExpandedChange).toHaveBeenCalledWith(new Set([]));
      expect(group.isExpanded("a")).toBe(true);

      expandedKeys.value = ["b"];
      expect(group.isExpanded("a")).toBe(false);
      expect(group.isExpanded("b")).toBe(true);
    });

    it("ignores expansion while the group is disabled", () => {
      const group = createGroup({isDisabled: true});

      group.toggle("a");
      group.expand("a");

      expect(group.expandedKeys.value.size).toBe(0);
    });
  });

  describe("keyboard navigation", () => {
    it("moves focus to the next and previous trigger", () => {
      const group = createGroup();
      const {buttons} = createTriggers(group);

      buttons[0]?.focus();
      pressKey(buttons[0]!, "ArrowDown");
      expect(document.activeElement).toBe(buttons[1]);

      pressKey(buttons[1]!, "ArrowUp");
      expect(document.activeElement).toBe(buttons[0]);
    });

    it("moves focus to the first and last trigger", () => {
      const group = createGroup();
      const {buttons} = createTriggers(group);

      pressKey(buttons[1]!, "End");
      expect(document.activeElement).toBe(buttons[2]);

      pressKey(buttons[2]!, "Home");
      expect(document.activeElement).toBe(buttons[0]);
    });

    it("stays put at the ends of the list", () => {
      const group = createGroup();
      const {buttons} = createTriggers(group);

      buttons[0]?.focus();
      pressKey(buttons[0]!, "ArrowUp");
      expect(document.activeElement).toBe(buttons[0]);

      buttons[2]?.focus();
      pressKey(buttons[2]!, "ArrowDown");
      expect(document.activeElement).toBe(buttons[2]);
    });

    it("navigates in document order regardless of registration order", () => {
      const group = createGroup();
      const container = document.createElement("div");

      document.body.appendChild(container);

      const first = document.createElement("button");
      const second = document.createElement("button");

      container.append(first, second);

      // Registered back to front on purpose.
      group.registerTrigger("second", second);
      group.registerTrigger("first", first);
      first.addEventListener("keydown", group.onTriggerKeydown);

      first.focus();
      pressKey(first, "ArrowDown");

      expect(document.activeElement).toBe(second);
    });

    it("skips a disabled trigger", () => {
      const group = createGroup();
      const {buttons} = createTriggers(group);

      buttons[1]?.setAttribute("disabled", "");

      buttons[0]?.focus();
      pressKey(buttons[0]!, "ArrowDown");

      expect(document.activeElement).toBe(buttons[2]);
    });

    it("claims the navigation keys so the page does not scroll", () => {
      const group = createGroup();
      const {buttons} = createTriggers(group);

      const notCancelled = pressKey(buttons[0]!, "ArrowDown");

      expect(notCancelled).toBe(false);
    });

    it("leaves other keys alone", () => {
      const group = createGroup();
      const {buttons} = createTriggers(group);

      const notCancelled = pressKey(buttons[0]!, "Tab");

      expect(notCancelled).toBe(true);
    });

    it("stops navigating to a trigger once it is unregistered", () => {
      const group = createGroup();
      const {buttons} = createTriggers(group);
      const unregister = group.registerTrigger("b", buttons[1]!);

      unregister();

      buttons[0]?.focus();
      pressKey(buttons[0]!, "ArrowDown");

      expect(document.activeElement).toBe(buttons[2]);
    });
  });
});
