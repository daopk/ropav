const VERSION = 1;

interface StoredSidebar {
  v: number;
  /** Whether the panel was left expanded on a wide viewport. */
  e: boolean;
  /** The declared width, not the resolved pixels — which is what makes a restore portable. */
  w?: string;
}

export interface SidebarLayout {
  isExpanded: boolean;
  width: string | undefined;
}

const keyFor = (id: string) => `ropav:sidebar:${id}`;

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

/** What was stored under `id`, or `null` when there is nothing usable there. */
export const readSidebarLayout = (id: string): SidebarLayout | null => {
  const store = storage();

  if (!store) return null;

  try {
    const raw = store.getItem(keyFor(id));

    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredSidebar;

    if (parsed?.v !== VERSION || typeof parsed.e !== "boolean") return null;

    return {
      isExpanded: parsed.e,
      width: typeof parsed.w === "string" ? parsed.w : undefined,
    };
  } catch {
    return null;
  }
};

export const writeSidebarLayout = (id: string, isExpanded: boolean, width?: string): void => {
  const store = storage();

  if (!store) return;

  const layout: StoredSidebar = { e: isExpanded, v: VERSION, ...(width ? { w: width } : {}) };

  try {
    store.setItem(keyFor(id), JSON.stringify(layout));
  } catch {
    // A full or unavailable store is not worth failing a resize over.
  }
};

export const clearSidebarLayout = (id: string): void => {
  try {
    storage()?.removeItem(keyFor(id));
  } catch {
    // Same as above.
  }
};
