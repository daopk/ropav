import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { nextTick, reactive } from "vue";

import Fixture from "./fixtures.vue";

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

describe("ScrollShadow (browser)", () => {
  it("tracks real vertical layout from start through both edges to the end", async () => {
    const screen = renderVapor(Fixture, {
      props: { class: "h-[120px]", contentSize: 400 },
    });
    const root = screen.container.querySelector<HTMLElement>("[data-slot='scroll-shadow']")!;

    await nextTick();
    await nextFrame();
    await nextFrame();

    expect(root.scrollHeight).toBeGreaterThan(root.clientHeight);
    expect(root).toHaveAttribute("data-bottom-scroll", "true");

    root.scrollTop = 100;
    root.dispatchEvent(new Event("scroll"));
    await nextFrame();

    expect(root).toHaveAttribute("data-top-bottom-scroll", "true");

    root.scrollTop = root.scrollHeight;
    root.dispatchEvent(new Event("scroll"));
    await nextFrame();

    expect(root).toHaveAttribute("data-top-scroll", "true");
    expect(root).toHaveAttribute("data-bottom-scroll", "false");
  });

  /*
   * The gap a `ResizeObserver` on the container alone cannot see: the region keeps its size and
   * what is inside it grows. An accordion opening inside a scroll shadow does exactly this, and
   * nothing here scrolls, so without watching the content the fade only turns up once the reader
   * scrolls — by which point it has stopped being the hint it exists to be.
   *
   * `hideScrollBar` is what makes this the real test rather than an accident: a scrollbar taking
   * layout width would resize the container and set the check off for the wrong reason, and on a
   * platform with overlay scrollbars it never would.
   */
  it("notices the content growing under it, with nothing scrolled and nothing resized", async () => {
    const props = reactive({ class: "h-[120px]", contentSize: 60, hideScrollBar: true });
    const screen = renderVapor(Fixture, { props });
    const root = screen.container.querySelector<HTMLElement>("[data-slot='scroll-shadow']")!;

    await nextTick();
    await nextFrame();
    await nextFrame();

    expect(root.scrollHeight).toBeLessThanOrEqual(root.clientHeight);
    // Reported as `false` rather than dropped, which is how a settled check says "nothing beyond".
    expect(root).toHaveAttribute("data-bottom-scroll", "false");

    props.contentSize = 400;
    await nextTick();
    await nextFrame();
    await nextFrame();

    expect(root.scrollHeight).toBeGreaterThan(root.clientHeight);
    expect(root.scrollTop).toBe(0);
    expect(root).toHaveAttribute("data-bottom-scroll", "true");
  });
});
