import {afterEach, describe, expect, it, vi} from "vitest";
import {effectScope, nextTick, shallowRef} from "vue";

import {useMediaQuery} from "@/composables/use-media-query";

/** Read outside a component: nothing here depends on an instance. */
const read = <T>(body: () => T): {stop: () => void; value: T} => {
  const scope = effectScope();
  const value = scope.run(body)!;

  return {stop: () => scope.stop(), value};
};

interface StubList {
  addEventListener: (type: string, listener: () => void) => void;
  emit: () => void;
  matches: boolean;
  media: string;
  removeEventListener: (type: string, listener: () => void) => void;
}

const lists = new Map<string, StubList>();

/**
 * A media query list whose answer the test controls.
 *
 * jsdom implements `matchMedia` but never matches anything and never emits a change, so the
 * listener path — the whole point of the composable — is unreachable without this.
 */
const stubMatchMedia = (initial: Record<string, boolean> = {}) => {
  lists.clear();

  vi.stubGlobal("matchMedia", (media: string): StubList => {
    const listeners = new Set<() => void>();
    const list: StubList = {
      addEventListener: (type, listener) => {
        if (type === "change") listeners.add(listener);
      },
      emit: () => {
        for (const listener of [...listeners]) listener();
      },
      matches: initial[media] ?? false,
      media,
      removeEventListener: (type, listener) => {
        if (type === "change") listeners.delete(listener);
      },
    };

    lists.set(media, list);

    return list;
  });

  return lists;
};

/** The legacy pair, which is all a media query list in Safari below 14 has. */
const stubLegacyMatchMedia = (initial: Record<string, boolean> = {}) => {
  const added: (() => void)[] = [];
  const removed: (() => void)[] = [];

  vi.stubGlobal("matchMedia", (media: string) => ({
    addListener: (listener: () => void) => added.push(listener),
    matches: initial[media] ?? false,
    media,
    removeListener: (listener: () => void) => removed.push(listener),
  }));

  return {added, removed};
};

describe("useMediaQuery", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    lists.clear();
  });

  it("reports whether the query matches on the first read", () => {
    stubMatchMedia({"(max-width: 768px)": true});

    const {stop, value} = read(() => useMediaQuery("(max-width: 768px)"));

    expect(value.value).toBe(true);

    stop();
  });

  it("reports a change emitted by the media query list", () => {
    const stubs = stubMatchMedia({"(max-width: 768px)": false});

    const {stop, value} = read(() => useMediaQuery("(max-width: 768px)"));

    expect(value.value).toBe(false);

    const list = stubs.get("(max-width: 768px)")!;

    list.matches = true;
    list.emit();

    expect(value.value).toBe(true);

    stop();
  });

  it("supports a reactive query, tearing the previous listener down", async () => {
    const stubs = stubMatchMedia({"(max-width: 768px)": true, "(min-width: 1024px)": false});
    const query = shallowRef("(max-width: 768px)");

    const {stop, value} = read(() => useMediaQuery(query));

    expect(value.value).toBe(true);

    query.value = "(min-width: 1024px)";
    await nextTick();

    expect(value.value).toBe(false);

    // The abandoned list must no longer be able to speak for the composable.
    const previous = stubs.get("(max-width: 768px)")!;

    previous.matches = true;
    previous.emit();

    expect(value.value).toBe(false);

    stop();
  });

  it("stops listening when the scope is disposed", () => {
    const stubs = stubMatchMedia({"(max-width: 768px)": false});

    const {stop, value} = read(() => useMediaQuery("(max-width: 768px)"));

    stop();

    const list = stubs.get("(max-width: 768px)")!;

    list.matches = true;
    list.emit();

    expect(value.value).toBe(false);
  });

  it("supports the deprecated addListener pair", () => {
    const {added, removed} = stubLegacyMatchMedia({"(max-width: 768px)": true});

    const {stop, value} = read(() => useMediaQuery("(max-width: 768px)"));

    expect(value.value).toBe(true);
    expect(added).toHaveLength(1);

    stop();

    expect(removed).toEqual(added);
  });

  it("reports the default value where there is no matchMedia to ask", () => {
    vi.stubGlobal("matchMedia", undefined);

    const {stop, value} = read(() => useMediaQuery("(max-width: 768px)", {defaultValue: true}));

    expect(value.value).toBe(true);

    stop();
  });
});
