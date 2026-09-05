import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";

import Fixture from "./fixtures.vue";

/**
 * What the compiled stylesheet does with the fill's band.
 *
 * The band paints on a pseudo-element, and two of the three questions here cannot be answered
 * anywhere else. Whether it survives alongside the indeterminate slide is a question about which
 * declaration won, which needs the cascade resolved; whether reduced motion reaches it is a
 * question about what the `motion-reduce` variant compiled to, and written one line off it
 * compiles to a selector matching nothing while still reading correctly in the source.
 */

const part = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

/** The OS preference would stop the band before any of these got to. */
const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

describe("ProgressBar band", () => {
  it.skipIf(prefersReduced)("travels when animated", () => {
    const { container, unmount } = renderVapor(Fixture, { props: { isAnimated: true, value: 60 } });
    const fill = part(container, "progress-bar-fill");

    expect(getComputedStyle(fill, "::after").animationName).toBe("rp-progress-bar-stripes");

    unmount();
  });

  it.skipIf(prefersReduced)("stands still when only striped", () => {
    const { container, unmount } = renderVapor(Fixture, { props: { isStriped: true, value: 60 } });
    const after = getComputedStyle(part(container, "progress-bar-fill"), "::after");

    expect(after.backgroundImage).toContain("linear-gradient");
    expect(after.animationName).toBe("none");

    unmount();
  });

  it("settles into a still band under `data-reduce-motion` on an ancestor", () => {
    const { container, unmount } = renderVapor(Fixture, { props: { isAnimated: true, value: 60 } });

    container.setAttribute("data-reduce-motion", "true");

    const after = getComputedStyle(part(container, "progress-bar-fill"), "::after");

    expect(after.animationName).toBe("none");
    // Stopped, not dropped - what is left is `isStriped`.
    expect(after.backgroundImage).toContain("linear-gradient");

    unmount();
  });

  it.skipIf(prefersReduced)("keeps travelling while the fill itself slides", () => {
    const { container, unmount } = renderVapor(Fixture, {
      props: { isAnimated: true, isIndeterminate: true },
    });
    const fill = part(container, "progress-bar-fill");

    // Different boxes, so the slide does not take the `animation` the band needs.
    expect(getComputedStyle(fill).animationName).toBe("rp-progress-bar-indeterminate");
    expect(getComputedStyle(fill, "::after").animationName).toBe("rp-progress-bar-stripes");

    unmount();
  });
});
