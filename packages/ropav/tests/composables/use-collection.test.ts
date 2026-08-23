import type { CollectionKey, UseCollectionReturn } from "@/composables/use-collection";
import type { VirtualizerCollection } from "@/utils/virtualizer-layout";

import { afterEach, describe, expect, it } from "vitest";
import { effectScope } from "vue";

import { useCollection } from "@/composables/use-collection";
import { createListCollection } from "@/utils/virtualizer-collection";

const scopes: (() => void)[] = [];
const containers: HTMLElement[] = [];

const createCollection = (): UseCollectionReturn => {
  const scope = effectScope();

  scopes.push(() => scope.stop());

  return scope.run(() => useCollection()) as UseCollectionReturn;
};

const createSourcedCollection = (
  source: () => VirtualizerCollection | null,
): UseCollectionReturn => {
  const scope = effectScope();

  scopes.push(() => scope.stop());

  return scope.run(() => useCollection({ source })) as UseCollectionReturn;
};

/**
 * Registers items against real elements. `order` is the order they are *registered* in, which
 * is deliberately allowed to differ from the order they sit in the DOM.
 */
const populate = (
  collection: UseCollectionReturn,
  keys: CollectionKey[],
  options: { registerOrder?: CollectionKey[]; disabled?: CollectionKey[] } = {},
) => {
  const container = document.createElement("div");

  containers.push(container);
  document.body.appendChild(container);

  const elements = new Map<CollectionKey, HTMLElement>();

  for (const key of keys) {
    const element = document.createElement("div");

    element.textContent = String(key);
    container.appendChild(element);
    elements.set(key, element);
  }

  const cleanups = new Map<CollectionKey, () => void>();

  for (const key of options.registerOrder ?? keys) {
    cleanups.set(
      key,
      collection.register(key, {
        element: () => elements.get(key) ?? null,
        isDisabled: () => Boolean(options.disabled?.includes(key)),
        textValue: () => String(key),
      }),
    );
  }

  return { cleanups, container, elements };
};

afterEach(() => {
  scopes.splice(0).forEach((stop) => stop());
  containers.splice(0).forEach((container) => container.remove());
});

describe("useCollection", () => {
  describe("registration", () => {
    it("starts empty", () => {
      const collection = createCollection();

      expect(collection.size.value).toBe(0);
      expect(collection.orderedKeys()).toEqual([]);
      expect(collection.getFirstKey()).toBeNull();
      expect(collection.getLastKey()).toBeNull();
    });

    it("counts registered items", () => {
      const collection = createCollection();

      populate(collection, ["a", "b", "c"]);

      expect(collection.size.value).toBe(3);
    });

    it("stops counting an item once it unregisters", () => {
      const collection = createCollection();
      const { cleanups } = populate(collection, ["a", "b"]);

      cleanups.get("a")!();

      expect(collection.size.value).toBe(1);
      expect(collection.orderedKeys()).toEqual(["b"]);
    });

    it("does not double-count a key registered twice", () => {
      const collection = createCollection();
      const element = document.createElement("div");

      collection.register("a", {
        element: () => element,
        isDisabled: () => false,
        textValue: () => "a",
      });
      collection.register("a", {
        element: () => element,
        isDisabled: () => false,
        textValue: () => "a",
      });

      expect(collection.size.value).toBe(1);
    });

    it("keeps a re-registered key when the old cleanup runs late", () => {
      // An item that moves in the DOM unmounts after its replacement has already registered,
      // so a cleanup that deletes blindly would drop a live item.
      const collection = createCollection();
      const element = document.createElement("div");
      const meta = { element: () => element, isDisabled: () => false, textValue: () => "a" };
      const stale = collection.register("a", meta);

      collection.register("a", { ...meta });
      stale();

      expect(collection.size.value).toBe(1);
    });
  });

  describe("document order", () => {
    it("orders by position in the DOM, not by registration order", () => {
      // This is the whole reason order is read from the DOM: `v-for` and conditionals mount
      // children in an order that need not match where they end up.
      const collection = createCollection();

      populate(collection, ["a", "b", "c"], { registerOrder: ["c", "a", "b"] });

      expect(collection.orderedKeys()).toEqual(["a", "b", "c"]);
    });

    it("follows items that move in the DOM without re-registering", () => {
      const collection = createCollection();
      const { container, elements } = populate(collection, ["a", "b", "c"]);

      container.insertBefore(elements.get("c")!, elements.get("a")!);

      expect(collection.orderedKeys()).toEqual(["c", "a", "b"]);
    });

    it("excludes an item whose element has left the document", () => {
      const collection = createCollection();
      const { elements } = populate(collection, ["a", "b"]);

      elements.get("a")!.remove();

      expect(collection.orderedKeys()).toEqual(["b"]);
    });

    it("orders items interleaved across nested sections", () => {
      const collection = createCollection();
      const container = document.createElement("div");

      containers.push(container);
      document.body.appendChild(container);

      // Two sections of two items each: nesting is what a listbox with sections really looks
      // like, and a flat document-order walk has to see straight through it.
      const keys = ["a", "b", "c", "d"];
      const elements = new Map<string, HTMLElement>();

      for (const [index, key] of keys.entries()) {
        if (index % 2 === 0) container.appendChild(document.createElement("section"));

        const element = document.createElement("div");

        elements.set(key, element);
        container.lastElementChild!.appendChild(element);
      }

      for (const key of keys) {
        collection.register(key, {
          element: () => elements.get(key) ?? null,
          isDisabled: () => false,
          textValue: () => key,
        });
      }

      expect(collection.orderedKeys()).toEqual(keys);
    });
  });

  describe("neighbours", () => {
    it("reports the first and last keys", () => {
      const collection = createCollection();

      populate(collection, ["a", "b", "c"]);

      expect(collection.getFirstKey()).toBe("a");
      expect(collection.getLastKey()).toBe("c");
    });

    it("walks forwards and backwards", () => {
      const collection = createCollection();

      populate(collection, ["a", "b", "c"]);

      expect(collection.getKeyAfter("a")).toBe("b");
      expect(collection.getKeyBefore("c")).toBe("b");
    });

    it("stops at the ends rather than wrapping", () => {
      const collection = createCollection();

      populate(collection, ["a", "b"]);

      expect(collection.getKeyAfter("b")).toBeNull();
      expect(collection.getKeyBefore("a")).toBeNull();
    });

    it("returns null for a key it does not hold", () => {
      const collection = createCollection();

      populate(collection, ["a"]);

      expect(collection.getKeyAfter("nope")).toBeNull();
      expect(collection.getKeyBefore("nope")).toBeNull();
    });

    it("does not skip a disabled neighbour", () => {
      // Skipping belongs to the keyboard delegate, which walks these neighbours until it
      // finds one it can land on; doing it here would hide disabled items from selection too.
      const collection = createCollection();

      populate(collection, ["a", "b", "c"], { disabled: ["b"] });

      expect(collection.getKeyAfter("a")).toBe("b");
    });
  });

  describe("item lookup", () => {
    it("exposes an item's live metadata", () => {
      const collection = createCollection();
      const element = document.createElement("div");
      let disabled = false;

      document.body.appendChild(element);
      containers.push(element);
      collection.register("a", {
        element: () => element,
        isDisabled: () => disabled,
        textValue: () => "Bob",
      });

      const item = collection.getItem("a")!;

      expect(item.textValue()).toBe("Bob");
      expect(item.isDisabled()).toBe(false);

      // Metadata is stored as getters, so a later change is visible without re-registering.
      disabled = true;

      expect(item.isDisabled()).toBe(true);
    });

    it("resolves an item's element", () => {
      const collection = createCollection();
      const { elements } = populate(collection, ["a"]);

      expect(collection.getElement("a")).toBe(elements.get("a"));
      expect(collection.getElement("nope")).toBeNull();
    });
  });
});

describe("useCollection with a data source", () => {
  const users = Array.from({ length: 1000 }, (_, index) => ({
    id: `user-${index}`,
    name: `User ${index}`,
  }));

  const listSource = (): VirtualizerCollection =>
    createListCollection({
      getTextValue: (user) => user.name,
      isDisabled: (user) => user.id === "user-4",
      items: users,
    });

  it("answers for every item while the DOM holds none of them", () => {
    const collection = createSourcedCollection(listSource);

    expect(collection.size.value).toBe(1000);
    expect(collection.orderedKeys()).toHaveLength(1000);
    expect(collection.getFirstKey()).toBe("user-0");
    expect(collection.getLastKey()).toBe("user-999");
    expect(collection.getKeyAfter("user-0")).toBe("user-1");
    expect(collection.getKeyBefore("user-999")).toBe("user-998");
    expect(collection.getIndex("user-500")).toBe(500);
  });

  it("reads text and disabled state of an item that never rendered", () => {
    const collection = createSourcedCollection(listSource);

    expect(collection.getItem("user-4")?.textValue()).toBe("User 4");
    expect(collection.getItem("user-4")?.isDisabled()).toBe(true);
    expect(collection.getItem("user-5")?.isDisabled()).toBe(false);
    expect(collection.getItem("nobody")).toBeUndefined();
  });

  it("has no element for an item outside the rendered window", () => {
    const collection = createSourcedCollection(listSource);
    const { elements } = populate(collection, ["user-3"]);

    // Registered: the element is the one thing the data cannot answer, so focus needs it.
    expect(collection.getElement("user-3")).toBe(elements.get("user-3"));
    expect(collection.getItem("user-3")?.element()).toBe(elements.get("user-3"));
    // Not registered: known to the collection, absent from the DOM.
    expect(collection.getElement("user-900")).toBeNull();
    expect(collection.getItem("user-900")?.element()).toBeNull();
  });

  it("keeps data order rather than the order a window registered in", () => {
    const collection = createSourcedCollection(listSource);

    // A window scrolled into view registers whatever it renders, in whatever order.
    populate(collection, ["user-7", "user-5", "user-6"]);

    expect(collection.orderedKeys().slice(5, 8)).toEqual(["user-5", "user-6", "user-7"]);
    expect(collection.getFirstKey()).toBe("user-0");
  });

  it("falls back to the DOM when the source is gone", () => {
    let sourced = true;
    const collection = createSourcedCollection(() => (sourced ? listSource() : null));

    expect(collection.size.value).toBe(1000);

    sourced = false;
    populate(collection, ["a", "b"]);

    expect(collection.size.value).toBe(2);
    expect(collection.orderedKeys()).toEqual(["a", "b"]);
  });
});
