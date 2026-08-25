import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, nextTick, onScopeDispose, shallowRef, toValue, watch } from "vue";

import { createAnimationSettleWaiter } from "../utils/animation-settled";
import { createContext } from "../utils/create-context";

/** What an element leaves behind for whichever element claims its name next. */
export interface SharedElementSnapshot {
  rect: DOMRect;
  /** `[property, computed value]` for every property the stylesheet says it transitions. */
  style: [string, string][];
}

/**
 * One slot per name, claimed by whichever element mounts into it next.
 *
 * A plain `Map` rather than `reactive`: nothing renders from it. It is a handoff between two
 * elements inside a single flush, and a proxy would only add identity surprises to the object the
 * outgoing element checks its own snapshot against.
 */
export interface SharedElementScope {
  snapshots: Map<string, SharedElementSnapshot>;
}

export const createSharedElementScope = (): SharedElementScope => ({ snapshots: new Map() });

export const [useSharedElementScope, provideSharedElementScope] = createContext<SharedElementScope>(
  {
    errorMessage: "A shared element has to be rendered inside a shared element scope.",
    name: "SharedElementScopeContext",
  },
);

export interface UseSharedElementOptions {
  /**
   * The scope this element shares a slot in.
   *
   * Passed in rather than injected here, so the composable can be exercised without a component
   * instance around it. Injecting is the component's job.
   */
  scope: SharedElementScope;
  /** The slot name. Fixed for the element's lifetime — changing it orphans a stored snapshot. */
  name: MaybeRefOrGetter<string>;
  /** The animated element, assigned once it renders. */
  elementRef: MaybeRefOrGetter<HTMLElement | null | undefined>;
  /** Whether the element should be present. @default true */
  isVisible?: MaybeRefOrGetter<boolean | undefined>;
}

export interface UseSharedElementReturn {
  /** Whether the element should be in the DOM: visible, entering, or still animating out. */
  isPresent: ComputedRef<boolean>;
  /** Render as `data-entering`. */
  isEntering: ComputedRef<boolean>;
  /** Render as `data-exiting`. */
  isExiting: ComputedRef<boolean>;
}

type SharedElementState = "hidden" | "entering" | "visible" | "exiting";

/**
 * Hand an element's position and size to the next element that takes its place, so the two read
 * as one thing moving rather than two things appearing.
 *
 * Ported from React Aria Components' `SharedElementTransition` and `SelectionIndicator`
 * (`react-aria-components/src/SharedElementTransition.tsx` and `SelectionIndicator.tsx`,
 * react-aria-components 1.20.0).
 *
 * The measurement is taken when the outgoing element is told it is going away rather than when it
 * is torn down, and that is the one place this departs from the original. React can measure in an
 * unmount cleanup because it runs every cleanup in the tree before every effect, so the outgoing
 * element always speaks first. Here the two elements live in sibling subtrees whose renders flush
 * in the order their components were created, so the incoming one can easily go first — moving the
 * selection backwards through a list would do it. Measuring on the synchronous edge instead makes
 * the order a fact about the state change rather than about the tree.
 *
 * Which properties are carried over is read off the element's own `transition-property`, so the
 * stylesheet remains the only place that decides what animates.
 *
 * @example
 * ```ts
 * const {isEntering, isExiting, isPresent} = useSharedElement({
 *   elementRef: element,
 *   isVisible: () => isSelected.value,
 *   name: "SelectionIndicator",
 *   scope: useSharedElementScope(),
 * });
 * ```
 */
export const useSharedElement = (options: UseSharedElementOptions): UseSharedElementReturn => {
  const { scope } = options;

  const isVisible = computed(() => toValue(options.isVisible) ?? true);
  const name = computed(() => toValue(options.name));

  const state = shallowRef<SharedElementState>(isVisible.value ? "visible" : "hidden");

  const getElement = () => toValue(options.elementRef) ?? null;

  let cancelled = false;
  let frame: number | null = null;
  /** The snapshot this element stored, so a newer one is never mistaken for it. */
  let stored: SharedElementSnapshot | null = null;

  const cancelFrame = () => {
    if (frame != null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(frame);
    frame = null;
  };

  /** Run `callback` on the next frame, or straight away where there are no frames. */
  const onNextFrame = (callback: () => void) => {
    if (typeof requestAnimationFrame !== "function") {
      callback();

      return;
    }

    frame = requestAnimationFrame(() => {
      frame = null;
      callback();
    });
  };

  const settle = createAnimationSettleWaiter(getElement);

  const takeSnapshot = () => {
    const element = getElement();

    if (!element || !element.isConnected) return;
    if (state.value === "hidden" || state.value === "exiting") return;

    const computedStyle = getComputedStyle(element);

    // Nothing transitions, so there is nothing for the next element to animate from.
    if (computedStyle.transitionProperty === "none") return;

    /*
     * `all` is dropped along with the empty entries. It is a shorthand with no readable value —
     * engines answer with either nothing or a placeholder — so carrying it over would write that
     * placeholder back as an inline style. React Aria stores it and then matches no branch for
     * it, which amounts to the same nothing.
     */
    const properties = computedStyle.transitionProperty
      .split(/\s*,\s*/)
      .filter((property) => property !== "" && property !== "all");

    if (properties.length === 0) return;

    stored = {
      rect: element.getBoundingClientRect(),
      style: properties.map(
        (property) => [property, computedStyle.getPropertyValue(property)] as [string, string],
      ),
    };
    scope.snapshots.set(name.value, stored);
  };

  /** Take over a previous element's position and size, then animate away from them. */
  const consume = (element: HTMLElement, previous: SharedElementSnapshot) => {
    scope.snapshots.delete(name.value);
    state.value = "visible";

    const before = element.getAnimations?.() ?? [];

    /*
     * `setProperty` rather than indexing the style declaration, which has no indexed accessor for
     * a hyphenated property name — so an indexed write silently does nothing for one.
     */
    const restore = previous.style.map(([property, previousValue]) => {
      const real = element.style.getPropertyValue(property);

      if (property === "translate") {
        const now = element.getBoundingClientRect();

        element.style.setProperty(
          "translate",
          `${previous.rect.left - now.left}px ${previous.rect.top - now.top}px`,
        );
      } else {
        element.style.setProperty(property, previousValue);
      }

      return [property, real] as [string, string];
    });

    // The overrides above start transitions of their own, which would animate to where the
    // element came from rather than to where it is going.
    for (const animation of element.getAnimations?.() ?? []) {
      if (!before.includes(animation)) animation.cancel();
    }

    onNextFrame(() => {
      for (const [property, value] of restore) element.style.setProperty(property, value);
    });
  };

  /** Nothing to take over from, so the element simply arrives. */
  const enter = () => {
    state.value = "entering";

    void nextTick(() => {
      if (cancelled || state.value !== "entering") return;

      onNextFrame(() => {
        if (!cancelled && state.value === "entering") state.value = "visible";
      });
    });
  };

  /**
   * Leave, once it is known whether anyone wanted the snapshot.
   *
   * Deferred to after the flush so every element that mounted in the same tick has had its turn
   * to claim it. Identity-checked, so a snapshot stored later by someone else does not read as
   * this element's own going unclaimed.
   */
  const leave = () => {
    void nextTick(() => {
      if (cancelled) return;

      // Shown again before the deferral got here, which is what happens when the element is
      // told it is not needed and the selection then resolves onto it in the same tick. Leaving
      // would undo that.
      if (isVisible.value) return;

      const mine = stored;

      stored = null;

      if (mine == null || scope.snapshots.get(name.value) !== mine) {
        state.value = "hidden";

        return;
      }

      scope.snapshots.delete(name.value);
      state.value = "exiting";

      settle.whenSettled(() => {
        if (state.value === "exiting") state.value = "hidden";
      });
    });
  };

  /*
   * Synchronous, because the measurement has to happen while the element is still laid out where
   * it is. The write that hides it comes from an event handler, so this runs at that write —
   * before any render effect, and before the element the selection moved to exists.
   */
  watch(
    isVisible,
    (visible, wasVisible) => {
      if (visible) {
        // Shown again before it finished leaving: it never left, so it goes straight back.
        if (state.value === "hidden" || state.value === "exiting") state.value = "visible";

        return;
      }

      if (wasVisible) takeSnapshot();
    },
    { flush: "sync" },
  );

  // Post-flush, so every patch of this tick has landed and the element can be measured.
  watch(
    [isVisible, () => getElement()],
    ([visible]) => {
      cancelFrame();

      if (!visible) {
        leave();

        return;
      }

      const element = getElement();

      if (!element) return;

      const previous = scope.snapshots.get(name.value);

      if (previous) consume(element, previous);
      else enter();
    },
    { flush: "post", immediate: true },
  );

  onScopeDispose(() => {
    cancelled = true;
    settle.cancel();
    cancelFrame();
    /*
     * Teardown, which the edge above cannot see: an element removed along with whatever held it
     * never stops being visible, it simply stops existing.
     */
    takeSnapshot();
  }, true);

  return {
    isEntering: computed(() => state.value === "entering"),
    isExiting: computed(() => state.value === "exiting"),
    isPresent: computed(() => state.value !== "hidden"),
  };
};
