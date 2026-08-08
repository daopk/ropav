import type {ListData, UseListDataOptions} from "@/composables/use-list-data";

import {afterEach, describe, expect, it} from "vitest";
import {effectScope} from "vue";

import {useListData} from "@/composables/use-list-data";

const scopes: (() => void)[] = [];

interface Item {
  id: string;
  name: string;
}

const ITEMS: Item[] = [
  {id: "1", name: "News"},
  {id: "2", name: "Travel"},
  {id: "3", name: "Gaming"},
  {id: "4", name: "Shopping"},
];

const createList = (options: UseListDataOptions<Item> = {}): ListData<Item> => {
  const scope = effectScope();

  scopes.push(() => scope.stop());

  return scope.run(() => useListData<Item>({initialItems: ITEMS, ...options})) as ListData<Item>;
};

const names = (list: ListData<Item>) => list.items.value.map((item) => item.name);
const keys = (list: ListData<Item>) => [...(list.selectedKeys.value as Set<string>)];

afterEach(() => {
  scopes.splice(0).forEach((stop) => stop());
});

describe("useListData", () => {
  describe("initial state", () => {
    it("holds the items it was given", () => {
      expect(names(createList())).toEqual(["News", "Travel", "Gaming", "Shopping"]);
    });

    it("starts with an empty selection", () => {
      expect(keys(createList())).toEqual([]);
    });

    it("accepts initially selected keys", () => {
      expect(keys(createList({initialSelectedKeys: ["2"]}))).toEqual(["2"]);
    });

    it("accepts all as an initial selection", () => {
      expect(createList({initialSelectedKeys: "all"}).selectedKeys.value).toBe("all");
    });

    it("derives keys from id, then key", () => {
      const list = createList();

      expect(list.getItem("3")?.name).toBe("Gaming");
    });

    it("accepts a custom key function", () => {
      const list = createList({getKey: (item) => item.name});

      expect(list.getItem("Gaming")?.id).toBe("3");
    });
  });

  describe("inserting", () => {
    it("inserts at an index", () => {
      const list = createList();

      list.insert(1, {id: "5", name: "Food"});

      expect(names(list)).toEqual(["News", "Food", "Travel", "Gaming", "Shopping"]);
    });

    it("inserts before and after a key", () => {
      const list = createList();

      list.insertBefore("3", {id: "5", name: "Food"});
      list.insertAfter("4", {id: "6", name: "Music"});

      expect(names(list)).toEqual(["News", "Travel", "Food", "Gaming", "Shopping", "Music"]);
    });

    it("appends and prepends", () => {
      const list = createList({initialItems: []});

      list.append({id: "1", name: "News"});
      list.prepend({id: "2", name: "Travel"});

      expect(names(list)).toEqual(["Travel", "News"]);
    });

    it("ignores an unknown key when the list has items", () => {
      const list = createList();

      list.insertBefore("nope", {id: "5", name: "Food"});

      expect(names(list)).toHaveLength(4);
    });

    it("inserts into an empty list even for an unknown key", () => {
      const list = createList({initialItems: []});

      list.insertBefore("nope", {id: "5", name: "Food"});

      expect(names(list)).toEqual(["Food"]);
    });
  });

  describe("removing", () => {
    it("removes by key and drops it from the selection", () => {
      const list = createList({initialSelectedKeys: ["2", "3"]});

      list.remove("2");

      expect(names(list)).toEqual(["News", "Gaming", "Shopping"]);
      expect(keys(list)).toEqual(["3"]);
    });

    it("clears the selection once the list empties", () => {
      // An "all" left standing over an empty list would keep claiming everything about nothing.
      const list = createList({initialSelectedKeys: "all"});

      list.remove("1", "2", "3", "4");

      expect(list.selectedKeys.value).toEqual(new Set());
    });

    it("removes the selected items", () => {
      const list = createList({initialSelectedKeys: ["1", "3"]});

      list.removeSelectedItems();

      expect(names(list)).toEqual(["Travel", "Shopping"]);
      expect(keys(list)).toEqual([]);
    });

    it("empties the list when everything is selected", () => {
      const list = createList({initialSelectedKeys: "all"});

      list.removeSelectedItems();

      expect(names(list)).toEqual([]);
    });
  });

  describe("moving", () => {
    it("moves one item to an index", () => {
      const list = createList();

      list.move("4", 0);

      expect(names(list)).toEqual(["Shopping", "News", "Travel", "Gaming"]);
    });

    it("moves several items before a key, keeping their order", () => {
      const list = createList();

      list.moveBefore("1", ["3", "4"]);

      expect(names(list)).toEqual(["Gaming", "Shopping", "News", "Travel"]);
    });

    it("keeps order when the keys are given back to front", () => {
      const list = createList();

      list.moveBefore("1", ["4", "3"]);

      expect(names(list)).toEqual(["Gaming", "Shopping", "News", "Travel"]);
    });

    it("moves several items after a key", () => {
      const list = createList();

      list.moveAfter("4", ["1", "2"]);

      expect(names(list)).toEqual(["Gaming", "Shopping", "News", "Travel"]);
    });

    it("moves items from both sides of the destination", () => {
      // The index bookkeeping has to shift the target for items coming from before it.
      const list = createList();

      list.moveBefore("3", ["1", "4"]);

      expect(names(list)).toEqual(["Travel", "News", "Shopping", "Gaming"]);
    });

    it("ignores an unknown destination", () => {
      const list = createList();

      list.moveBefore("nope", ["1"]);

      expect(names(list)).toEqual(["News", "Travel", "Gaming", "Shopping"]);
    });
  });

  describe("updating", () => {
    it("replaces an item", () => {
      const list = createList();

      list.update("2", {id: "2", name: "Trips"});

      expect(names(list)).toEqual(["News", "Trips", "Gaming", "Shopping"]);
    });

    it("derives the replacement from the current item", () => {
      const list = createList();

      list.update("2", (previous) => ({...previous, name: `${previous.name}!`}));

      expect(list.getItem("2")?.name).toBe("Travel!");
    });

    it("ignores an unknown key", () => {
      const list = createList();

      list.update("nope", {id: "nope", name: "Nope"});

      expect(names(list)).toHaveLength(4);
    });
  });

  describe("filtering", () => {
    it("shows only matching items while keeping the rest", () => {
      const list = createList({
        filter: (item, text) => item.name.toLowerCase().includes(text.toLowerCase()),
      });

      list.setFilterText("ing");

      expect(names(list)).toEqual(["Gaming", "Shopping"]);

      // Filtering is a view, not a destructive edit, so clearing brings everything back.
      list.setFilterText("");

      expect(names(list)).toHaveLength(4);
    });

    it("still resolves a filtered-out item by key", () => {
      const list = createList({filter: (item, text) => item.name.startsWith(text)});

      list.setFilterText("News");

      expect(list.getItem("2")?.name).toBe("Travel");
    });

    it("ignores filter text when no filter was given", () => {
      const list = createList();

      list.setFilterText("nope");

      expect(names(list)).toHaveLength(4);
    });
  });

  describe("selection", () => {
    it("replaces the selection", () => {
      const list = createList();

      list.setSelectedKeys(new Set(["1", "2"]));

      expect(keys(list)).toEqual(["1", "2"]);
    });

    it("adds and removes keys", () => {
      const list = createList({initialSelectedKeys: ["1"]});

      list.addKeysToSelection(new Set(["3"]));

      expect(keys(list)).toEqual(["1", "3"]);

      list.removeKeysFromSelection(new Set(["1"]));

      expect(keys(list)).toEqual(["3"]);
    });

    it("leaves an all selection alone when adding", () => {
      const list = createList({initialSelectedKeys: "all"});

      list.addKeysToSelection(new Set(["1"]));

      expect(list.selectedKeys.value).toBe("all");
    });

    it("resolves an all selection when removing from it", () => {
      const list = createList({initialSelectedKeys: "all"});

      list.removeKeysFromSelection(new Set(["1"]));

      expect(keys(list)).toEqual(["2", "3", "4"]);
    });

    it("empties the selection when asked to remove all", () => {
      const list = createList({initialSelectedKeys: ["1", "2"]});

      list.removeKeysFromSelection("all");

      expect(keys(list)).toEqual([]);
    });
  });
});
