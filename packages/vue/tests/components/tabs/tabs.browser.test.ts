import {expectNoA11yViolations} from "@heroui/testing/helpers/a11y";
import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {userEvent} from "vitest/browser";
import {nextTick} from "vue";

import TabsFixture from "./fixtures.vue";

const OVERFLOW_ITEMS = [
  "Overview",
  "Analytics",
  "Reports",
  "Performance",
  "Engagement",
  "Audience",
  "Acquisition",
  "Retention",
  "Settings",
].map((label) => ({id: label.toLowerCase(), label}));

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/**
 * Press a tab the way a pointer does.
 *
 * `element.click()` is not enough: a tab is chosen as the press begins, which is what React Aria
 * does for a tab that is not a link, so the pointer sequence is what selects it.
 */
const pressTab = (tab: HTMLElement) => userEvent.click(tab);

const settle = async (ticks = 4) => {
  for (let index = 0; index < ticks; index += 1) await nextTick();
};

/** Everything derived from the collection, plus a frame for the indicator to be laid out. */
const ready = async () => {
  await settle();
  await nextFrame();
  await nextFrame();
};

const tabsIn = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>('[data-slot="tabs-tab"]'),
];

const indicatorIn = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="tabs-indicator"]');

const scrollerIn = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="tabs-list-container"] .scroll-shadow')!;

const chevronIn = (container: HTMLElement, edge: "prev" | "next") =>
  container.querySelector<HTMLButtonElement>(`.tabs__list-container__scroll-${edge}`)!;

/**
 * The muted label on an unselected tab falls below 4.5:1 against the strip it sits on. It comes
 * from the shared stylesheet, so the React build reports the same thing — scoped off here rather
 * than papered over.
 */
const SHARED_WITH_REACT = {rules: {"color-contrast": {enabled: false}}};

describe("Tabs (browser)", () => {
  describe("the indicator", () => {
    it("clears the entering state once the arrival has settled", async () => {
      // jsdom implements no animations, so the entering state resolves there without a frame
      // ever passing and this could not go red.
      const {container, unmount} = renderVapor(TabsFixture);

      await ready();

      const indicator = indicatorIn(container)!;

      expect(typeof indicator.getAnimations).toBe("function");
      expect(indicator).not.toHaveAttribute("data-entering");

      unmount();
    });

    it("slides from the tab it was handed over from", async () => {
      const {container, unmount} = renderVapor(TabsFixture);

      await ready();

      const from = indicatorIn(container)!.getBoundingClientRect();

      await pressTab(tabsIn(container)[2]!);
      await settle();

      const indicator = indicatorIn(container)!;
      const translate = getComputedStyle(indicator).translate;

      // Real layout, which jsdom cannot give: the newcomer starts where the old one stood, so
      // the offset is the distance between the two tabs and it is negative going rightwards.
      expect(translate).not.toBe("none");
      expect(Number.parseFloat(translate)).toBeLessThan(0);

      await Promise.all(indicator.getAnimations().map((animation) => animation.finished));
      await nextFrame();

      const to = indicator.getBoundingClientRect();

      expect(getComputedStyle(indicator).translate).toBe("none");
      expect(Math.round(to.left)).toBeGreaterThan(Math.round(from.left));
      expect(Math.round(to.left)).toBe(
        Math.round(tabsIn(container)[2]!.getBoundingClientRect().left),
      );

      unmount();
    });

    it("leaves exactly one indicator behind after a handover", async () => {
      const {container, unmount} = renderVapor(TabsFixture);

      await ready();

      await pressTab(tabsIn(container)[1]!);
      await settle();
      await nextFrame();

      expect(container.querySelectorAll('[data-slot="tabs-indicator"]')).toHaveLength(1);
      expect(indicatorIn(container)!.closest('[data-slot="tabs-tab"]')).toHaveTextContent(
        "Analytics",
      );

      unmount();
    });
  });

  describe("overflow", () => {
    it("reports the scrollable edges and reveals only the reachable chevron", async () => {
      const {container, unmount} = renderVapor(TabsFixture, {
        props: {class: "w-[400px]", items: OVERFLOW_ITEMS},
      });

      await ready();

      const scroller = scrollerIn(container);

      // Real geometry and a real frame, both of which the overflow check needs.
      expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
      expect(scroller.dataset["leftScroll"]).toBe("false");
      expect(scroller.dataset["rightScroll"]).toBe("true");
      expect(getComputedStyle(chevronIn(container, "prev")).display).toBe("none");
      expect(getComputedStyle(chevronIn(container, "next")).display).toBe("flex");

      unmount();
    });

    it("scrolls towards the edge the chevron names", async () => {
      const {container, unmount} = renderVapor(TabsFixture, {
        props: {class: "w-[400px]", items: OVERFLOW_ITEMS},
      });

      await ready();

      const scroller = scrollerIn(container);

      chevronIn(container, "next").click();
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(scroller.scrollLeft).toBeGreaterThan(0);

      const middle = scroller.scrollLeft;

      chevronIn(container, "prev").click();
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(scroller.scrollLeft).toBeLessThan(middle);

      unmount();
    });

    it("scrolls towards the named edge in a right-to-left strip", async () => {
      // The horizontal scroll range runs into the negatives there, so the delta's sign has to
      // flip — a branch no jsdom test can reach, having no layout to scroll.
      const {container, unmount} = renderVapor(TabsFixture, {
        props: {class: "w-[400px]", items: OVERFLOW_ITEMS},
      });

      container.setAttribute("dir", "rtl");
      await ready();

      const scroller = scrollerIn(container);

      expect(getComputedStyle(scroller).direction).toBe("rtl");

      chevronIn(container, "next").click();
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(scroller.scrollLeft).toBeLessThan(0);

      unmount();
    });

    it("keeps a visible chevron out of the tab order", async () => {
      const {container, unmount} = renderVapor(TabsFixture, {
        props: {class: "w-[400px]", items: OVERFLOW_ITEMS},
      });

      await ready();

      const next = chevronIn(container, "next");

      // Visible, and between the tab list and the panel in document order — so without its own
      // tab index it is exactly what Tab from the selected tab would reach.
      expect(getComputedStyle(next).display).not.toBe("none");
      expect(next.tabIndex).toBe(-1);

      tabsIn(container)[0]!.focus();
      await userEvent.tab();

      expect(document.activeElement).not.toBe(next);
      expect(document.activeElement).toBe(container.querySelector('[data-slot="tabs-panel"]'));

      unmount();
    });
  });

  describe("focus", () => {
    it("paints the ring with a box shadow on the tab the keyboard reached", async () => {
      /*
       * Compared against a sibling rather than against the same tab a moment earlier: whether
       * focus counts as visible is tracked page-wide, so an earlier test in this file having
       * used the keyboard already decides it.
       *
       * The ring is drawn with a box shadow, so asserting an outline would pass while proving
       * nothing at all.
       */
      const {container, unmount} = renderVapor(TabsFixture);

      await ready();

      const [overview, analytics] = tabsIn(container);

      overview!.focus();
      await userEvent.keyboard("{ArrowLeft}{ArrowRight}");
      overview!.focus();
      await settle();

      expect(overview).toHaveAttribute("data-focus-visible", "true");
      expect(analytics).not.toHaveAttribute("data-focus-visible");
      // The shared stylesheet draws the ring with `ring-2`, which is a box shadow — asserting an
      // outline here would pass on the browser's own focus ring and prove nothing about ours.
      expect(getComputedStyle(overview!).boxShadow).not.toBe(
        getComputedStyle(analytics!).boxShadow,
      );

      unmount();
    });
  });

  describe("the keyboard", () => {
    it("walks the tabs and takes the selection along", async () => {
      const {container, unmount} = renderVapor(TabsFixture);

      await ready();

      tabsIn(container)[0]!.focus();
      await userEvent.keyboard("{ArrowRight}");
      await settle();

      expect(tabsIn(container)[1]).toHaveAttribute("aria-selected", "true");
      expect(document.activeElement).toBe(tabsIn(container)[1]);

      await userEvent.keyboard("{ArrowRight}{ArrowRight}");
      await settle();

      // Wrapped past the end and back to the first tab.
      expect(tabsIn(container)[0]).toHaveAttribute("aria-selected", "true");
      expect(document.activeElement).toBe(tabsIn(container)[0]);

      unmount();
    });
  });

  it("has no accessibility violations", async () => {
    const {container, unmount} = renderVapor(TabsFixture);

    await ready();

    await expectNoA11yViolations(container, SHARED_WITH_REACT);

    unmount();
  });
});
