import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {nextTick} from "vue";

import Fixture from "./fixtures.vue";

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

describe("ScrollShadow (browser)", () => {
  it("tracks real vertical layout from start through both edges to the end", async () => {
    const screen = renderVapor(Fixture, {
      props: {class: "h-[120px]", contentSize: 400},
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
});
