import type {
  UseDisclosureGroupNavigationOptions,
  UseDisclosureGroupNavigationReturn,
} from "@/composables/use-disclosure-group-navigation";

import {afterEach, describe, expect, it, vi} from "vitest";
import {effectScope, shallowRef} from "vue";

import {useDisclosureGroupNavigation} from "@/composables/use-disclosure-group-navigation";

const scopes: (() => void)[] = [];

const createNavigation = (
  options: UseDisclosureGroupNavigationOptions,
): UseDisclosureGroupNavigationReturn => {
  const scope = effectScope();

  scopes.push(() => scope.stop());

  return scope.run(() => useDisclosureGroupNavigation(options))!;
};

const ITEMS = ["one", "two", "three"];

afterEach(() => {
  scopes.splice(0).forEach((stop) => stop());
});

describe("useDisclosureGroupNavigation", () => {
  describe("current item", () => {
    it("starts from the first item when nothing is expanded", () => {
      const nav = createNavigation({
        expandedKeys: [],
        itemIds: ITEMS,
        onExpandedChange: () => {},
      });

      expect(nav.currentIndex.value).toBe(0);
    });

    it("follows the expanded item", () => {
      const nav = createNavigation({
        expandedKeys: ["three"],
        itemIds: ITEMS,
        onExpandedChange: () => {},
      });

      expect(nav.currentIndex.value).toBe(2);
    });

    it("takes the first expanded item when several are open", () => {
      const nav = createNavigation({
        expandedKeys: ["three", "two"],
        itemIds: ITEMS,
        onExpandedChange: () => {},
      });

      // Resolved against the item order, not the order the keys were expanded in.
      expect(nav.currentIndex.value).toBe(1);
    });

    it("ignores an expanded key that is not one of the items", () => {
      const nav = createNavigation({
        expandedKeys: ["elsewhere"],
        itemIds: ITEMS,
        onExpandedChange: () => {},
      });

      expect(nav.currentIndex.value).toBe(0);
    });

    it("reports no current item for an empty group", () => {
      const nav = createNavigation({
        expandedKeys: [],
        itemIds: [],
        onExpandedChange: () => {},
      });

      expect(nav.currentIndex.value).toBe(-1);
    });

    it("treats zero as a usable key", () => {
      const nav = createNavigation({
        expandedKeys: [],
        itemIds: [0, 1, 2],
        onExpandedChange: () => {},
      });

      // Falsy but present: an id of `0` is the first item, not a missing one.
      expect(nav.currentIndex.value).toBe(0);
      expect(nav.isNextDisabled.value).toBe(false);
    });

    it("follows the item list when it changes", () => {
      const itemIds = shallowRef(["one"]);
      const nav = createNavigation({
        expandedKeys: [],
        itemIds,
        onExpandedChange: () => {},
      });

      expect(nav.isNextDisabled.value).toBe(true);

      itemIds.value = ["one", "two"];

      expect(nav.isNextDisabled.value).toBe(false);
    });
  });

  describe("bounds", () => {
    it("disables the previous step at the start", () => {
      const nav = createNavigation({
        expandedKeys: ["one"],
        itemIds: ITEMS,
        onExpandedChange: () => {},
      });

      expect(nav.isPrevDisabled.value).toBe(true);
      expect(nav.isNextDisabled.value).toBe(false);
    });

    it("disables the next step at the end", () => {
      const nav = createNavigation({
        expandedKeys: ["three"],
        itemIds: ITEMS,
        onExpandedChange: () => {},
      });

      expect(nav.isPrevDisabled.value).toBe(false);
      expect(nav.isNextDisabled.value).toBe(true);
    });

    it("disables both steps for an empty group", () => {
      const nav = createNavigation({
        expandedKeys: [],
        itemIds: [],
        onExpandedChange: () => {},
      });

      expect(nav.isPrevDisabled.value).toBe(true);
      expect(nav.isNextDisabled.value).toBe(true);
    });
  });

  describe("stepping", () => {
    it("expands the next item on its own", () => {
      const onExpandedChange = vi.fn();
      const nav = createNavigation({
        expandedKeys: ["one"],
        itemIds: ITEMS,
        onExpandedChange,
      });

      nav.onNext();

      expect(onExpandedChange).toHaveBeenCalledWith(new Set(["two"]));
    });

    it("expands the previous item on its own", () => {
      const onExpandedChange = vi.fn();
      const nav = createNavigation({
        expandedKeys: ["three"],
        itemIds: ITEMS,
        onExpandedChange,
      });

      nav.onPrevious();

      expect(onExpandedChange).toHaveBeenCalledWith(new Set(["two"]));
    });

    it("adds to what is open while several items may be expanded", () => {
      const onExpandedChange = vi.fn();
      const nav = createNavigation({
        allowsMultipleExpanded: true,
        expandedKeys: ["one"],
        itemIds: ITEMS,
        onExpandedChange,
      });

      nav.onNext();

      expect(onExpandedChange).toHaveBeenCalledWith(new Set(["one", "two"]));
    });

    it("stays put at the end of the list", () => {
      const onExpandedChange = vi.fn();
      const nav = createNavigation({
        expandedKeys: ["three"],
        itemIds: ITEMS,
        onExpandedChange,
      });

      nav.onNext();

      expect(onExpandedChange).not.toHaveBeenCalled();
    });

    it("stays put at the start of the list", () => {
      const onExpandedChange = vi.fn();
      const nav = createNavigation({
        expandedKeys: ["one"],
        itemIds: ITEMS,
        onExpandedChange,
      });

      nav.onPrevious();

      expect(onExpandedChange).not.toHaveBeenCalled();
    });

    it("does nothing for an empty group", () => {
      const onExpandedChange = vi.fn();
      const nav = createNavigation({
        expandedKeys: [],
        itemIds: [],
        onExpandedChange,
      });

      nav.onNext();
      nav.onPrevious();

      expect(onExpandedChange).not.toHaveBeenCalled();
    });

    it("steps from the expanded key it is given each time", () => {
      const expandedKeys = shallowRef<string[]>(["one"]);
      const onExpandedChange = vi.fn((keys: Set<string | number>) => {
        expandedKeys.value = [...keys] as string[];
      });
      const nav = createNavigation({expandedKeys, itemIds: ITEMS, onExpandedChange});

      nav.onNext();
      nav.onNext();

      expect(onExpandedChange).toHaveBeenLastCalledWith(new Set(["three"]));
      expect(nav.isNextDisabled.value).toBe(true);
    });

    it("follows a change of expansion mode without being rebuilt", () => {
      const allowsMultipleExpanded = shallowRef(false);
      const onExpandedChange = vi.fn();
      const nav = createNavigation({
        allowsMultipleExpanded,
        expandedKeys: ["one"],
        itemIds: ITEMS,
        onExpandedChange,
      });

      nav.onNext();
      expect(onExpandedChange).toHaveBeenLastCalledWith(new Set(["two"]));

      allowsMultipleExpanded.value = true;
      nav.onNext();

      expect(onExpandedChange).toHaveBeenLastCalledWith(new Set(["one", "two"]));
    });
  });
});
