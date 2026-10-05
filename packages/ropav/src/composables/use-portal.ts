import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, toValue } from "vue";

import { createContext } from "../utils/create-context";

/** Where the overlays below a `PortalProvider` go, and what they treat as the page. */
export interface Portal {
  /** Where every overlay is rendered: `"body"` without a provider. */
  container: ComputedRef<HTMLElement | string>;
  /**
   * The part of the page an overlay belongs to: what a modal hides outside itself (`inert`), what
   * it holds focus and outside presses within, and what placement keeps an overlay inside. `null`
   * (the whole document) without a provider, or with one that names no root.
   */
  root: ComputedRef<HTMLElement | null>;
  /** Whether overlays render into an element of their own rather than the document's body. */
  isContained: ComputedRef<boolean>;
}

const [usePortalContext, providePortalContext] = createContext<Portal | null>({
  defaultValue: null,
  name: "PortalContext",
  strict: false,
});

const BODY: Portal = {
  container: computed(() => "body"),
  isContained: computed(() => false),
  root: computed(() => null),
};

/**
 * The portal that applies here: the nearest `PortalProvider`'s, or the document's body.
 *
 * Ported from React Aria's `UNSAFE_PortalProvider` (`getContainer`), with the root added: an
 * overlay rendered into a region of the page belongs to that region and has to leave the rest of
 * the page alone — hidden, focused and pressed as it was.
 */
export const usePortal = (): Portal => usePortalContext() ?? BODY;

export interface PortalOptions {
  /** `undefined` inherits the enclosing portal's container, `null` goes back to the body. */
  container: MaybeRefOrGetter<HTMLElement | string | null | undefined>;
  /** `undefined` inherits the enclosing portal's root, `null` goes back to the whole document. */
  root?: MaybeRefOrGetter<HTMLElement | null | undefined>;
}

/**
 * Send every overlay below into `container`, belonging to `root`.
 *
 * Absent and `null` differ as they do in React Aria: a nested provider that names only a container
 * keeps the root of the one around it, and an explicit `null` is the way back to the page.
 */
export const providePortal = (options: PortalOptions): Portal => {
  const parent = usePortal();

  const container = computed(() => {
    const own = toValue(options.container);

    return own === undefined ? parent.container.value : (own ?? "body");
  });

  const root = computed(() => {
    const own = toValue(options.root);

    return own === undefined ? parent.root.value : own;
  });

  const portal: Portal = {
    container,
    // The body named as an element is still the body.
    isContained: computed(
      () =>
        container.value !== "body" &&
        (typeof document === "undefined" || container.value !== document.body),
    ),
    root,
  };

  providePortalContext(portal);

  return portal;
};
