import { PALETTE_CONTRAST_DEBT, expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { settled } from "../../harness/settle";

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
].map((label) => ({ id: label.toLowerCase(), label }));

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
  container.querySelector<HTMLElement>('[data-slot="tabs-list-container"] .rp-scroll-shadow')!;

const chevronIn = (container: HTMLElement, edge: "prev" | "next") =>
  container.querySelector<HTMLButtonElement>(`.rp-tabs__list-container__scroll-${edge}`)!;

/** The contrast exclusion is the palette's, not this component's. */
const SHARED_WITH_REACT = PALETTE_CONTRAST_DEBT;

describe("Tabs (browser)", () => {
  describe("the indicator", () => {
    it("clears the entering state once the arrival has settled", async () => {
      // jsdom implements no animations, so the entering state resolves there without a frame
      // ever passing and this could not go red.
      const { container, unmount } = renderVapor(TabsFixture);

      await ready();

      const indicator = indicatorIn(container)!;

      expect(typeof indicator.getAnimations).toBe("function");
      expect(indicator).not.toHaveAttribute("data-entering");

      unmount();
    });

    it("slides from the tab it was handed over from", async () => {
      const { container, unmount } = renderVapor(TabsFixture);

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
      const { container, unmount } = renderVapor(TabsFixture);

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

  describe("a tab holding more than a label", () => {
    const withParts = { withChip: true, withIcon: true };

    it("lays the icon, the label and the count out on one line", async () => {
      const { container, unmount } = renderVapor(TabsFixture, { props: withParts });

      await ready();

      const tab = tabsIn(container)[0]!;
      const icon = tab.querySelector("svg")!;
      const chip = tab.querySelector<HTMLElement>('[data-slot="chip"]')!;
      const style = getComputedStyle(tab);

      // The tab owns the box of whatever it was handed: the parts are spaced, the icon is sized
      // here rather than at whatever it was drawn at, and the row is kept off a second line the
      // tab has nowhere to put.
      expect(style.columnGap).toBe("8px");
      expect(style.whiteSpace).toBe("nowrap");
      expect(getComputedStyle(icon).width).toBe("16px");
      expect(getComputedStyle(icon).height).toBe("16px");
      expect(tab.getBoundingClientRect().height).toBeCloseTo(32, 0);

      // One line, in the order they were written, with the count inside the tab rather than
      // hanging out of it.
      expect(chip.getBoundingClientRect().left).toBeGreaterThan(icon.getBoundingClientRect().right);
      expect(chip.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        tab.getBoundingClientRect().bottom,
      );

      unmount();
    });

    it("selects the tab from a press that lands on the count", async () => {
      const { container, unmount } = renderVapor(TabsFixture, { props: withParts });

      await ready();

      const analytics = tabsIn(container)[1]!;

      // Nothing the caller puts in the tab is a target of its own — the tab is chosen wherever
      // the press lands inside it, which is what lets a count sit in there at all.
      await pressTab(analytics.querySelector<HTMLElement>('[data-slot="chip"]')!);
      await settle();

      expect(analytics).toHaveAttribute("aria-selected", "true");

      unmount();
    });
  });

  describe("overflow", () => {
    it("reports the scrollable edges and reveals only the reachable chevron", async () => {
      const { container, unmount } = renderVapor(TabsFixture, {
        props: { class: "w-[400px]", items: OVERFLOW_ITEMS },
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
      const { container, unmount } = renderVapor(TabsFixture, {
        props: { class: "w-[400px]", items: OVERFLOW_ITEMS },
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
      const { container, unmount } = renderVapor(TabsFixture, {
        props: { class: "w-[400px]", items: OVERFLOW_ITEMS },
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
      const { container, unmount } = renderVapor(TabsFixture, {
        props: { class: "w-[400px]", items: OVERFLOW_ITEMS },
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
      const { container, unmount } = renderVapor(TabsFixture);

      await ready();

      const [overview, analytics] = tabsIn(container);

      overview!.focus();
      await userEvent.keyboard("{ArrowLeft}{ArrowRight}");
      overview!.focus();
      await settle();

      expect(overview).toHaveAttribute("data-focus-visible", "true");
      expect(analytics).not.toHaveAttribute("data-focus-visible");

      await settled(overview!);

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
      const { container, unmount } = renderVapor(TabsFixture);

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

  /*
   * The alignment rules reach the tab through the list, so only a mounted tree says whether they
   * match — and the class landing on the root is not the same claim as the tab moving.
   */
  describe("alignment", () => {
    const justify = async (align?: string) => {
      const { container, unmount } = renderVapor(TabsFixture, { props: { align } });

      await ready();

      const tab = container.querySelector<HTMLElement>('[data-slot="tabs-tab"]')!;
      const resolved = getComputedStyle(tab).justifyContent;

      unmount();

      return resolved;
    };

    it("moves the tab's content to the edge it names", async () => {
      expect({
        center: await justify("center"),
        end: await justify("end"),
        none: await justify(),
        start: await justify("start"),
      }).toEqual({ center: "center", end: "flex-end", none: "center", start: "flex-start" });
    });
  });

  /*
   * Whether the tabs share the row or hug their labels is layout, so only real geometry says
   * whether the rule reached the tab - and whether the list it leaves alone still overflows.
   */
  describe("width", () => {
    const boxOf = (element: Element) => element.getBoundingClientRect();
    const containerIn = (container: HTMLElement) =>
      container.querySelector<HTMLElement>('[data-slot="tabs-list-container"]')!;
    const rootIn = (container: HTMLElement) =>
      container.querySelector<HTMLElement>('[data-slot="tabs"]')!;

    /**
     * A tab's label plus its padding - what a hugging tab measures. The label's text node, not the
     * tab's contents, because the indicator inside is laid out at the tab's full width.
     */
    const contentWidthOf = (tab: HTMLElement) => {
      const style = getComputedStyle(tab);
      const label = [...tab.childNodes].find(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent!.trim(),
      )!;
      const range = document.createRange();

      range.selectNodeContents(label);

      return (
        range.getBoundingClientRect().width +
        Number.parseFloat(style.paddingLeft) +
        Number.parseFloat(style.paddingRight)
      );
    };

    it("shares the row between the tabs by default", async () => {
      const { container, unmount } = renderVapor(TabsFixture, { props: { class: "w-[600px]" } });

      await ready();

      const widths = tabsIn(container).map((tab) => Math.round(boxOf(tab).width));

      // 600px less the list's 4px padding each side, in three.
      expect(widths).toEqual([197, 197, 197]);
      expect(Math.round(boxOf(containerIn(container)).width)).toBe(600);

      unmount();
    });

    it("sizes each tab to its label, and the track to the tabs, when it does not", async () => {
      const { container, unmount } = renderVapor(TabsFixture, {
        props: { class: "w-[600px]", fullWidth: false },
      });

      await ready();

      const tabs = tabsIn(container);

      for (const tab of tabs) {
        expect(boxOf(tab).width).toBeCloseTo(contentWidthOf(tab), 0);
      }

      // The track ends where the last tab does, padding and all, rather than running on.
      const track = boxOf(containerIn(container));
      const last = boxOf(tabs.at(-1)!);

      expect(track.width).toBeLessThan(600);
      expect(track.right - last.right).toBeCloseTo(4, 0);

      unmount();
    });

    it("keeps the secondary rule across the whole row", async () => {
      const { container, unmount } = renderVapor(TabsFixture, {
        props: { class: "w-[600px]", fullWidth: false, variant: "secondary" },
      });

      await ready();

      const tab = tabsIn(container)[0]!;

      expect(boxOf(tab).width).toBeCloseTo(contentWidthOf(tab), 0);
      expect(Math.round(boxOf(containerIn(container)).width)).toBe(600);

      unmount();
    });

    it("starts the row at the inline start in a right-to-left strip", async () => {
      const { container, unmount } = renderVapor(TabsFixture, {
        props: { class: "w-[600px]", fullWidth: false },
      });

      container.setAttribute("dir", "rtl");
      await ready();

      const root = boxOf(rootIn(container));
      const track = boxOf(containerIn(container));
      const tabs = tabsIn(container);

      // The track and the first tab sit against the right edge, and the row stops well short of
      // the left one - where a shared row would have run the last tab out to it.
      expect(root.right - track.right).toBeCloseTo(0, 0);
      expect(root.right - boxOf(tabs[0]!).right).toBeCloseTo(4, 0);
      expect(boxOf(tabs.at(-1)!).left - root.left).toBeGreaterThan(200);

      unmount();
    });

    it("still overflows into the scroller when the labels outgrow the row", async () => {
      const { container, unmount } = renderVapor(TabsFixture, {
        props: { class: "w-[400px]", fullWidth: false, items: OVERFLOW_ITEMS },
      });

      await ready();

      const scroller = scrollerIn(container);

      // The hugging track is held to the row, so the scroller has an edge to overflow past.
      expect(Math.round(boxOf(containerIn(container)).width)).toBe(400);
      expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
      expect(scroller.dataset["rightScroll"]).toBe("true");
      expect(getComputedStyle(chevronIn(container, "next")).display).toBe("flex");

      unmount();
    });

    it("leaves a vertical list's tabs at the widest one's width", async () => {
      const { container, unmount } = renderVapor(TabsFixture, {
        props: { fullWidth: false, orientation: "vertical" },
      });

      await ready();

      const widths = new Set(tabsIn(container).map((tab) => Math.round(boxOf(tab).width)));

      expect(widths.size).toBe(1);

      unmount();
    });
  });

  it("has no accessibility violations", async () => {
    const { container, unmount } = renderVapor(TabsFixture);

    await ready();

    await expectNoA11yViolations(container, SHARED_WITH_REACT);

    unmount();
  });
});
