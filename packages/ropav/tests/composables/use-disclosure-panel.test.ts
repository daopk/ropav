import type { UseDisclosurePanelOptions } from "@/composables/use-disclosure-panel";
import type { MaybeRefOrGetter } from "vue";

import { afterEach, describe, expect, it } from "vitest";
import { effectScope, nextTick, shallowRef } from "vue";

import { useDisclosurePanel } from "@/composables/use-disclosure-panel";

const scopes: (() => void)[] = [];

/** A panel element in the document, already reported to a running composable. */
const createPanel = async (isExpanded: MaybeRefOrGetter<boolean>) => {
  const panel = document.createElement("div");

  document.body.appendChild(panel);

  const scope = effectScope();

  scopes.push(() => scope.stop());

  const options: UseDisclosurePanelOptions = { isExpanded };
  const { setPanelElement } = scope.run(() => useDisclosurePanel(options))!;

  setPanelElement(panel);
  await nextTick();

  return { panel, setPanelElement };
};

const heightOf = (panel: HTMLElement) => panel.style.getPropertyValue("--disclosure-panel-height");
const widthOf = (panel: HTMLElement) => panel.style.getPropertyValue("--disclosure-panel-width");

afterEach(() => {
  scopes.splice(0).forEach((stop) => stop());
  document.body.innerHTML = "";
});

describe("useDisclosurePanel", () => {
  describe("collapsed", () => {
    it("keeps the panel out of the tab order and the a11y tree", async () => {
      const { panel } = await createPanel(false);

      // `until-found` rather than plain hidden, so find-in-page can still reveal it.
      expect(panel.getAttribute("hidden")).toBe("until-found");
    });

    it("writes both size variables as zero", async () => {
      const { panel } = await createPanel(false);

      expect(heightOf(panel)).toBe("0px");
      expect(widthOf(panel)).toBe("0px");
    });
  });

  describe("expanded", () => {
    it("starts revealed without animating in", async () => {
      const { panel } = await createPanel(true);

      expect(panel.hasAttribute("hidden")).toBe(false);
      // `auto` straight away, never a pixel value: the first pass settles, it does not animate.
      expect(heightOf(panel)).toBe("auto");
      expect(widthOf(panel)).toBe("auto");
    });
  });

  describe("state changes", () => {
    it("reveals the panel and releases its height when expanded", async () => {
      const isExpanded = shallowRef(false);
      const { panel } = await createPanel(isExpanded);

      isExpanded.value = true;
      await nextTick();

      expect(panel.hasAttribute("hidden")).toBe(false);
      expect(heightOf(panel)).toBe("auto");
    });

    it("hides the panel again when collapsed", async () => {
      const isExpanded = shallowRef(true);
      const { panel } = await createPanel(isExpanded);

      isExpanded.value = false;
      await nextTick();

      expect(panel.getAttribute("hidden")).toBe("until-found");
      expect(heightOf(panel)).toBe("0px");
    });

    it("settles at once where the Web Animations API is missing", async () => {
      const isExpanded = shallowRef(false);
      const { panel } = await createPanel(isExpanded);

      // jsdom has no `getAnimations`, and it is deliberately not polyfilled: the state lands
      // directly instead of waiting on animations that would never finish.
      expect(typeof panel.getAnimations).toBe("undefined");

      isExpanded.value = true;
      await nextTick();

      expect(heightOf(panel)).toBe("auto");
    });

    it("reads the expanded state through a getter", async () => {
      const isExpanded = shallowRef(false);
      const { panel } = await createPanel(() => isExpanded.value);

      isExpanded.value = true;
      await nextTick();

      expect(panel.hasAttribute("hidden")).toBe(false);
    });
  });

  describe("element reporting", () => {
    it("ignores a reported value that is not an element", async () => {
      const { panel, setPanelElement } = await createPanel(false);

      setPanelElement(null);
      await nextTick();

      // The panel keeps whatever was last applied to it; nothing throws.
      expect(panel.getAttribute("hidden")).toBe("until-found");
    });

    it("applies the current state to an element reported late", async () => {
      const scope = effectScope();

      scopes.push(() => scope.stop());

      const { setPanelElement } = scope.run(() => useDisclosurePanel({ isExpanded: true }))!;

      await nextTick();

      const panel = document.createElement("div");

      document.body.appendChild(panel);
      setPanelElement(panel);
      await nextTick();

      expect(panel.hasAttribute("hidden")).toBe(false);
      expect(heightOf(panel)).toBe("auto");
    });
  });
});
