<script setup lang="ts" vapor>
import type {AccordionPanelProps} from "./accordion.types";

import {shallowRef, watch} from "vue";

import {dataAttr} from "../../utils/assertion";
import {composeSlotClassName} from "../../utils/compose";

import {useAccordionContext, useAccordionItemContext} from "./accordion.context";

const props = withDefaults(defineProps<AccordionPanelProps>(), {role: "group"});

defineSlots<{default?: () => unknown}>();

const {slots} = useAccordionContext();
const {isExpanded, panelId, toggle, triggerId} = useAccordionItemContext();

const panelEl = shallowRef<HTMLElement | null>(null);

const setPanelEl = (element: unknown) => {
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

/**
 * Drive the CSS variables the stylesheet animates, and the `hidden` attribute that
 * keeps a collapsed panel out of the tab order and the accessibility tree.
 *
 * `hidden="until-found"` rather than plain `hidden`, so find-in-page can still reveal
 * collapsed content; the `beforematch` handler syncs state when the browser does.
 */
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
  [panelEl, isExpanded],
  ([panel, expanded]) => {
    if (panel) applyPanelState(panel, expanded);
  },
  {flush: "post", immediate: true},
);

/** Fired when find-in-page reveals the panel; the browser has already dropped `hidden`. */
const onBeforeMatch = () => {
  if (!isExpanded.value) toggle();
};
</script>

<template>
  <div
    :id="panelId"
    :ref="setPanelEl"
    :aria-hidden="!isExpanded"
    :aria-labelledby="triggerId"
    :class="composeSlotClassName(slots.panel, props.class)"
    :data-expanded="dataAttr(isExpanded)"
    data-slot="accordion-panel"
    :role="props.role"
    @beforematch="onBeforeMatch"
  >
    <slot />
  </div>
</template>
