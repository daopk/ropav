import type {MaybeRefOrGetter} from "vue";

import {shallowRef, toValue, watch} from "vue";

export interface UseDisclosurePanelOptions {
  /** Whether the panel is currently expanded. */
  isExpanded: MaybeRefOrGetter<boolean>;
}

export interface UseDisclosurePanelReturn {
  /** Template ref callback for the panel element. */
  setPanelElement: (element: unknown) => void;
}

/**
 * Drives the collapse of a panel that always stays in the DOM.
 *
 * The stylesheet animates `height: var(--disclosure-panel-height)` with `opacity` going to `1`
 * only on `[data-expanded="true"]`, and nothing in CSS ever writes that variable — the height
 * animation is a JS contract. This owns both halves of it: the variables the stylesheet reads,
 * and the `hidden` attribute that keeps a collapsed panel out of the tab order and the
 * accessibility tree.
 *
 * `hidden="until-found"` rather than plain `hidden`, so find-in-page can still reveal collapsed
 * content. The browser drops the attribute itself when it does, so a caller wanting state to
 * follow needs a `beforematch` listener of its own.
 *
 * @example
 * ```ts
 * const {setPanelElement} = useDisclosurePanel({isExpanded});
 * // <div :ref="setPanelElement" :data-expanded="dataAttr(isExpanded)">
 * ```
 */
export const useDisclosurePanel = (
  options: UseDisclosurePanelOptions,
): UseDisclosurePanelReturn => {
  const panelEl = shallowRef<HTMLElement | null>(null);

  const setPanelElement = (element: unknown) => {
    panelEl.value = element instanceof HTMLElement ? element : null;
  };

  /**
   * `null` until the first pass has run, which is how the initial state is applied
   * without animating open on mount.
   */
  let wasExpanded: boolean | null = null;

  const setSize = (panel: HTMLElement, width: string, height: string) => {
    panel.style.setProperty("--disclosure-panel-width", width);
    panel.style.setProperty("--disclosure-panel-height", height);
  };

  const applyPanelState = (panel: HTMLElement, expanded: boolean) => {
    const canAnimate = typeof panel.getAnimations === "function";

    if (wasExpanded === null || !canAnimate) {
      // First pass, or an environment without the Web Animations API: settle, no animation.
      if (expanded) {
        panel.removeAttribute("hidden");
        setSize(panel, "auto", "auto");
      } else {
        panel.setAttribute("hidden", "until-found");
        setSize(panel, "0px", "0px");
      }
    } else if (expanded !== wasExpanded) {
      if (expanded) {
        panel.removeAttribute("hidden");
        // Pixel values so the height is animatable...
        setSize(panel, `${panel.scrollWidth}px`, `${panel.scrollHeight}px`);
        // ...then back to auto once the animation lands, so content can still resize.
        void Promise.all(panel.getAnimations().map((animation) => animation.finished))
          .then(() => setSize(panel, "auto", "auto"))
          .catch(() => {});
      } else {
        setSize(panel, `${panel.scrollWidth}px`, `${panel.scrollHeight}px`);
        // Force a style recalculation so the collapse has a starting value to animate from.
        void window.getComputedStyle(panel).height;
        setSize(panel, "0px", "0px");
        void Promise.all(panel.getAnimations().map((animation) => animation.finished))
          .then(() => panel.setAttribute("hidden", "until-found"))
          .catch(() => {});
      }
    }

    wasExpanded = expanded;
  };

  watch(
    [panelEl, () => toValue(options.isExpanded)],
    ([panel, expanded]) => {
      if (panel) applyPanelState(panel, expanded);
    },
    {flush: "post", immediate: true},
  );

  return {setPanelElement};
};
