import type { CollectionKey } from "../../composables/use-collection";
import type { SplitterOrientation, SplitterSize } from "./splitter.state";

const VERSION = 1;

interface StoredPanel {
  /** The panel's key. An explicit `id` is what makes this survive a panel being reordered. */
  k: string;
  /** The declared size, not the resolved pixels — which is what makes a restore portable. */
  s: SplitterSize;
  c?: boolean;
}

interface StoredLayout {
  v: number;
  o: SplitterOrientation;
  p: StoredPanel[];
}

export interface SplitterLayout {
  sizes: SplitterSize[];
  collapsed: string[];
}

const keyFor = (id: string) => `ropav:splitter:${id}`;

/**
 * Storage can throw rather than merely fail — Safari's private mode raises on access, not only on
 * write — so every call is guarded, and an unreadable store is treated as an empty one.
 */
const storage = (): Storage | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

/**
 * The layout stored under `id`, or `null` when there is nothing usable there.
 *
 * Validated against the panels actually on screen rather than trusted: a stored layout whose
 * panels no longer match would apply sizes to the wrong ones, which is worse than starting fresh.
 */
export const readSplitterLayout = (
  id: string,
  orientation: SplitterOrientation,
  keys: CollectionKey[],
): SplitterLayout | null => {
  const store = storage();

  if (!store) return null;

  try {
    const raw = store.getItem(keyFor(id));

    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredLayout;

    if (parsed?.v !== VERSION || parsed.o !== orientation || !Array.isArray(parsed.p)) return null;
    if (parsed.p.length !== keys.length) return null;
    if (parsed.p.some((panel, index) => panel.k !== String(keys[index]))) return null;

    return {
      collapsed: parsed.p.filter((panel) => panel.c).map((panel) => panel.k),
      sizes: parsed.p.map((panel) => panel.s),
    };
  } catch {
    return null;
  }
};

export const writeSplitterLayout = (
  id: string,
  orientation: SplitterOrientation,
  keys: CollectionKey[],
  sizes: SplitterSize[],
  collapsed: (key: CollectionKey) => boolean,
): void => {
  const store = storage();

  if (!store) return;

  const layout: StoredLayout = {
    o: orientation,
    p: keys.map((key, index) => ({
      ...(collapsed(key) ? { c: true } : {}),
      k: String(key),
      s: sizes[index] ?? "1fr",
    })),
    v: VERSION,
  };

  try {
    store.setItem(keyFor(id), JSON.stringify(layout));
  } catch {
    // A full or unavailable store is not worth failing a resize over.
  }
};

export const clearSplitterLayout = (id: string): void => {
  try {
    storage()?.removeItem(keyFor(id));
  } catch {
    // Same as above.
  }
};
