import type {CollectionKey} from "@/composables/use-collection";
import type {UseTypeaheadOptions, UseTypeaheadReturn} from "@/composables/use-typeahead";

import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {effectScope, shallowRef} from "vue";

import {useTypeahead} from "@/composables/use-typeahead";

const scopes: (() => void)[] = [];

const ITEMS: {key: CollectionKey; text: string}[] = [
  {key: "bob", text: "Bob"},
  {key: "brenda", text: "Brenda"},
  {key: "fred", text: "Fred"},
  {key: "martha", text: "Martha"},
  {key: "ecole", text: "École"},
];

/** Prefix match, preferring keys strictly after `fromKey`, the way the real delegate does. */
const collator = new Intl.Collator(undefined, {sensitivity: "base", usage: "search"});

const getKeyForSearch = (search: string, fromKey?: CollectionKey | null) => {
  const start = fromKey ? ITEMS.findIndex((item) => item.key === fromKey) + 1 : 0;

  for (let index = start; index < ITEMS.length; index += 1) {
    const item = ITEMS[index]!;

    if (collator.compare(item.text.slice(0, search.length), search) === 0) return item.key;
  }

  return null;
};

const createTypeahead = (
  props: Partial<UseTypeaheadOptions> = {},
): UseTypeaheadReturn & {matches: CollectionKey[]; focused: ReturnType<typeof shallowRef>} => {
  const scope = effectScope();

  scopes.push(() => scope.stop());

  const matches: CollectionKey[] = [];
  const focused = shallowRef<CollectionKey | null>(null);

  const typeahead = scope.run(() =>
    useTypeahead({
      focusedKey: () => focused.value,
      getKeyForSearch,
      onSearchMatch: (key) => {
        matches.push(key);
        focused.value = key;
      },
      ...props,
    }),
  ) as UseTypeaheadReturn;

  return {...typeahead, focused, matches};
};

/** A keydown on a container, so the "is the target inside" guard is exercised for real. */
const press = (
  handler: (event: KeyboardEvent) => void,
  key: string,
  init: KeyboardEventInit = {},
) => {
  const container = document.createElement("div");
  const child = document.createElement("div");

  container.appendChild(child);
  document.body.appendChild(container);

  const event = new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key, ...init});

  Object.defineProperty(event, "currentTarget", {value: container});
  Object.defineProperty(event, "target", {value: child});

  handler(event);
  container.remove();

  return event;
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  scopes.splice(0).forEach((stop) => stop());
});

describe("useTypeahead", () => {
  describe("matching", () => {
    it("focuses the first item starting with the character typed", () => {
      const typeahead = createTypeahead();

      press(typeahead.onKeydown, "m");

      expect(typeahead.matches).toEqual(["martha"]);
    });

    it("narrows as more characters arrive", () => {
      const typeahead = createTypeahead();

      press(typeahead.onKeydown, "b");
      press(typeahead.onKeydown, "r");

      expect(typeahead.matches).toEqual(["bob", "brenda"]);
    });

    it("consumes a key it acted on", () => {
      const typeahead = createTypeahead();
      const event = press(typeahead.onKeydown, "m");

      expect(event.defaultPrevented).toBe(true);
    });

    it("searches from the top when nothing after the focused key matches", () => {
      const typeahead = createTypeahead();

      typeahead.focused.value = "martha";
      press(typeahead.onKeydown, "b");

      expect(typeahead.matches).toEqual(["bob"]);
    });

    it("matches without regard to diacritics", () => {
      // The collator options are what make this work, so they are worth pinning.
      const typeahead = createTypeahead();

      press(typeahead.onKeydown, "e");

      expect(typeahead.matches).toEqual(["ecole"]);
    });
  });

  describe("keys that are not characters", () => {
    it.each(["ArrowDown", "Enter", "Home", "Escape", "Tab"])("ignores %s", (key) => {
      const typeahead = createTypeahead();
      const event = press(typeahead.onKeydown, key);

      expect(typeahead.matches).toEqual([]);
      expect(event.defaultPrevented).toBe(false);
    });

    it.each([
      ["ctrlKey", {ctrlKey: true}],
      ["metaKey", {metaKey: true}],
      ["altKey", {altKey: true}],
    ] as const)("ignores a character held with %s", (_name, init) => {
      const typeahead = createTypeahead();

      press(typeahead.onKeydown, "m", init);

      expect(typeahead.matches).toEqual([]);
    });

    it("ignores a key from outside the collection", () => {
      const typeahead = createTypeahead();
      const outside = document.createElement("div");
      const container = document.createElement("div");
      const event = new KeyboardEvent("keydown", {cancelable: true, key: "m"});

      document.body.append(container, outside);
      Object.defineProperty(event, "currentTarget", {value: container});
      Object.defineProperty(event, "target", {value: outside});

      typeahead.onKeydown(event);
      container.remove();
      outside.remove();

      expect(typeahead.matches).toEqual([]);
    });
  });

  describe("space", () => {
    it("does not start a search", () => {
      // A leading Space is how a user activates the focused item.
      const typeahead = createTypeahead();
      const event = press(typeahead.onKeydown, " ");

      expect(typeahead.matches).toEqual([]);
      expect(event.defaultPrevented).toBe(false);
    });

    it("is ignored on capture while no search is running", () => {
      const typeahead = createTypeahead();
      const event = press(typeahead.onKeydownCapture, " ");

      expect(event.defaultPrevented).toBe(false);
    });

    it("extends a running search, and is claimed so the item never sees it", () => {
      // Without this, typing a two-word label would toggle selection halfway through.
      const items = [{key: "new-file", text: "New file"}];
      const typeahead = createTypeahead({
        getKeyForSearch: (search) =>
          items.find((item) => item.text.toLowerCase().startsWith(search.toLowerCase()))?.key ??
          null,
      });

      press(typeahead.onKeydown, "n");
      press(typeahead.onKeydown, "e");
      press(typeahead.onKeydown, "w");

      const event = press(typeahead.onKeydownCapture, " ");

      expect(event.defaultPrevented).toBe(true);
      expect(typeahead.matches.at(-1)).toBe("new-file");
    });
  });

  describe("no match", () => {
    it("does not consume the key", () => {
      const typeahead = createTypeahead();
      const event = press(typeahead.onKeydown, "z");

      expect(typeahead.matches).toEqual([]);
      expect(event.defaultPrevented).toBe(false);
    });

    it("clears the buffer immediately rather than waiting out the timer", () => {
      const typeahead = createTypeahead();

      press(typeahead.onKeydown, "z");
      // If "z" were still buffered this would search "zm" and find nothing.
      press(typeahead.onKeydown, "m");

      expect(typeahead.matches).toEqual(["martha"]);
    });
  });

  describe("expiry", () => {
    it("forgets the search after a pause", () => {
      const typeahead = createTypeahead();

      press(typeahead.onKeydown, "b");
      vi.advanceTimersByTime(1000);
      press(typeahead.onKeydown, "r");

      // A fresh search for "r" finds nothing, rather than continuing "br".
      expect(typeahead.matches).toEqual(["bob"]);
    });

    it("keeps the search alive while typing continues", () => {
      const typeahead = createTypeahead();

      press(typeahead.onKeydown, "b");
      vi.advanceTimersByTime(900);
      press(typeahead.onKeydown, "r");

      expect(typeahead.matches).toEqual(["bob", "brenda"]);
    });

    it("forgets the search when asked", () => {
      const typeahead = createTypeahead();

      press(typeahead.onKeydown, "b");
      typeahead.reset();
      press(typeahead.onKeydown, "r");

      expect(typeahead.matches).toEqual(["bob"]);
    });
  });

  describe("disabled", () => {
    it("does nothing on either handler", () => {
      const typeahead = createTypeahead({isDisabled: true});

      press(typeahead.onKeydown, "m");
      press(typeahead.onKeydownCapture, " ");

      expect(typeahead.matches).toEqual([]);
    });
  });
});
