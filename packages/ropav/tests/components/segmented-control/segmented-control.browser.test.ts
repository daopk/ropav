import { PALETTE_CONTRAST_DEBT, expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { settled } from "../../harness/settle";

import SegmentedControlFixture from "./fixtures.vue";

// `setup-styles.ts` only pulls in the default theme, which is all a component test usually needs.
// A second one has to be asked for, exactly as a consumer asks for it.
import "../../../../styles/themes/uber.css";

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const settle = async (ticks = 4) => {
  for (let index = 0; index < ticks; index += 1) await nextTick();
};

/** Everything derived from the collection, plus a frame for the indicator to be laid out. */
const ready = async () => {
  await settle();
  await nextFrame();
  await nextFrame();
};

const itemsIn = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>('[data-slot="segmented-control-item"]'),
];

const indicatorIn = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="segmented-control-indicator"]');

const trackIn = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="segmented-control"]')!;

/** The contrast exclusion is the palette's, not this component's. */
const SHARED_WITH_REACT = PALETTE_CONTRAST_DEBT;

describe("SegmentedControl (browser)", () => {
  describe("the indicator", () => {
    it("clears the entering state once the arrival has settled", async () => {
      // jsdom implements no animations, so the entering state resolves there without a frame
      // ever passing and this could not go red.
      const { container, unmount } = renderVapor(SegmentedControlFixture);

      await ready();

      expect(indicatorIn(container)).not.toHaveAttribute("data-entering");

      unmount();
    });

    it("slides from the segment it was handed over from", async () => {
      const { container, unmount } = renderVapor(SegmentedControlFixture);

      await ready();

      const from = indicatorIn(container)!.getBoundingClientRect();

      await userEvent.click(itemsIn(container)[2]!);
      await settle();

      const indicator = indicatorIn(container)!;
      const translate = getComputedStyle(indicator).translate;

      // Real layout, which jsdom cannot give: the newcomer starts where the old one stood, so
      // the offset is the distance between the two segments and it is negative going rightwards.
      expect(translate).not.toBe("none");
      expect(Number.parseFloat(translate)).toBeLessThan(0);

      await Promise.all(indicator.getAnimations().map((animation) => animation.finished));
      await nextFrame();

      const to = indicator.getBoundingClientRect();

      expect(getComputedStyle(indicator).translate).toBe("none");
      expect(Math.round(to.left)).toBeGreaterThan(Math.round(from.left));
      expect(Math.round(to.left)).toBe(
        Math.round(itemsIn(container)[2]!.getBoundingClientRect().left),
      );

      unmount();
    });

    it("carries the properties the handoff needs across", async () => {
      const { container, unmount } = renderVapor(SegmentedControlFixture);

      await ready();

      // `useSharedElement` reads this very declaration to decide what to carry over, so the
      // pill stops sliding the moment someone drops `translate` from the stylesheet.
      const transitionProperty = getComputedStyle(indicatorIn(container)!).transitionProperty;

      expect(transitionProperty).toContain("translate");
      expect(transitionProperty).toContain("width");

      unmount();
    });

    it("leaves exactly one indicator behind after a handover", async () => {
      const { container, unmount } = renderVapor(SegmentedControlFixture);

      await ready();

      await userEvent.click(itemsIn(container)[1]!);
      await settle();
      await nextFrame();

      expect(container.querySelectorAll('[data-slot="segmented-control-indicator"]')).toHaveLength(
        1,
      );
      expect(
        indicatorIn(container)!.closest('[data-slot="segmented-control-item"]'),
      ).toHaveTextContent("Weekly");

      unmount();
    });

    it("resizes to a segment of a different width", async () => {
      const { container, unmount } = renderVapor(SegmentedControlFixture, {
        props: {
          items: [
            { id: "a", label: "A" },
            { id: "b", label: "A much longer label" },
          ],
        },
      });

      await ready();

      const narrow = indicatorIn(container)!.getBoundingClientRect().width;

      await userEvent.click(itemsIn(container)[1]!);
      await settle();

      const indicator = indicatorIn(container)!;

      await Promise.all(indicator.getAnimations().map((animation) => animation.finished));
      await nextFrame();

      const wide = indicator.getBoundingClientRect().width;

      expect(Math.round(wide)).toBeGreaterThan(Math.round(narrow));
      expect(Math.round(wide)).toBe(
        Math.round(itemsIn(container)[1]!.getBoundingClientRect().width),
      );

      unmount();
    });
  });

  describe("the separator", () => {
    const FOUR = [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
      { id: "c", label: "C" },
      { id: "d", label: "D" },
    ];

    const opacities = (container: HTMLElement) =>
      [...container.querySelectorAll<HTMLElement>('[data-slot="segmented-control-separator"]')].map(
        (separator) => getComputedStyle(separator).opacity,
      );

    it("shows a divider only where there are two segments to divide", async () => {
      const { container, unmount } = renderVapor(SegmentedControlFixture, {
        props: { defaultSelectedKey: "b", items: FOUR, withSeparator: true },
      });

      await ready();

      // Nothing in front of the first segment, nothing on the pill, and nothing hard against the
      // pill's trailing edge — which is the segment that follows it.
      expect(opacities(container)).toEqual(["0", "0", "0", "1"]);

      unmount();
    });

    it("moves the gap along as the pill travels", async () => {
      const { container, unmount } = renderVapor(SegmentedControlFixture, {
        props: { defaultSelectedKey: "b", items: FOUR, withSeparator: true },
      });

      await ready();

      await userEvent.click(itemsIn(container)[3]!);
      await settled(container.querySelector('[data-slot="segmented-control"]')!);

      // The pill is last, so only its own divider goes — there is no segment after it.
      expect(opacities(container)).toEqual(["0", "1", "1", "0"]);

      unmount();
    });
  });

  describe("the selected segment", () => {
    it("paints the pill and shifts the label colour", async () => {
      const { container, unmount } = renderVapor(SegmentedControlFixture);

      await ready();

      const [selected, unselected] = itemsIn(container);

      await settled(selected!);

      expect(getComputedStyle(selected!).color).not.toBe(getComputedStyle(unselected!).color);
      // The pill is a real fill rather than a transparent placeholder.
      expect(getComputedStyle(indicatorIn(container)!).backgroundColor).not.toBe(
        "rgba(0, 0, 0, 0)",
      );

      unmount();
    });
  });

  describe("focus", () => {
    it("draws an inset ring so it stays inside the track", async () => {
      const { container, unmount } = renderVapor(SegmentedControlFixture);

      await ready();

      // Focused with the keyboard rather than with `.focus()`: the stylesheet keys the ring on
      // `data-focus-visible`, which tracks the interaction modality, so a programmatic focus
      // leaves the segment focused and unringed.
      await userEvent.tab();

      const [first, second] = itemsIn(container);

      expect(first).toHaveAttribute("data-focus-visible", "true");
      await settled(first!);

      // The ring is a box shadow, not an outline — asserting an outline would pass on the
      // browser's own default ring and prove nothing about the stylesheet.
      const focused = getComputedStyle(first!).boxShadow;

      expect(focused).not.toBe(getComputedStyle(second!).boxShadow);
      expect(focused).toContain("inset");

      unmount();
    });

    it("moves exactly one segment per arrow press", async () => {
      const { container, unmount } = renderVapor(SegmentedControlFixture);

      await ready();

      itemsIn(container)[0]!.focus();
      await userEvent.keyboard("{ArrowRight}");
      await settle();

      expect(itemsIn(container)[1]).toHaveAttribute("aria-checked", "true");
      expect(document.activeElement).toBe(itemsIn(container)[1]);

      unmount();
    });
  });

  describe("full width", () => {
    it("shares the track between the segments", async () => {
      const { container, unmount } = renderVapor(SegmentedControlFixture, {
        props: { class: "w-[420px]", fullWidth: true },
      });

      await ready();

      const widths = itemsIn(container).map((item) => item.getBoundingClientRect().width);

      expect(new Set(widths.map((width) => Math.round(width))).size).toBe(1);

      const track = trackIn(container);
      const padding = Number.parseFloat(getComputedStyle(track).paddingInlineStart);
      const content = track.getBoundingClientRect().width - padding * 2;
      const filled = widths.reduce((total, width) => total + width, 0);

      // Flex hands out fractional pixels, so the sum lands within a pixel of the content box
      // rather than exactly on it.
      expect(Math.abs(filled - content)).toBeLessThan(1);

      unmount();
    });
  });

  it("wears the same corner as everything else on the control scale", async () => {
    const { container, unmount } = renderVapor(SegmentedControlFixture);

    await ready();

    // The track, the segments and the pill all read `--component-radius`, so a segmented control
    // sitting beside a button of the same size meets it corner for corner. Stepping the track's
    // corner out by its own padding would break that at the one place the two touch.
    const track = getComputedStyle(trackIn(container)).borderRadius;

    expect(getComputedStyle(itemsIn(container)[0]!).borderRadius).toBe(track);
    expect(getComputedStyle(indicatorIn(container)!).borderRadius).toBe(track);

    unmount();
  });

  it("takes its corner from the theme rather than a fixed radius", async () => {
    const { container, unmount } = renderVapor(SegmentedControlFixture);

    await ready();

    const track = trackIn(container);

    // The default theme flattens `--component-radius` onto its field radius, 6px; uber keeps the
    // pill-ish 3x of a 4px base, 12px. Reading a different corner under each is what proves the
    // track goes through `--component-radius` at all rather than through a radius of its own.
    expect(getComputedStyle(track).borderRadius).toBe("6px");

    container.dataset["theme"] = "uber";
    await nextFrame();

    expect(getComputedStyle(track).borderRadius).toBe("12px");

    unmount();
  });

  it("has no accessibility violations", async () => {
    const { container, unmount } = renderVapor(SegmentedControlFixture);

    await ready();

    await expectNoA11yViolations(container, SHARED_WITH_REACT);

    unmount();
  });
});
