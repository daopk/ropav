import {renderInterop} from "@heroui/testing/helpers/vue";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {h, nextTick} from "vue";

import {ButtonRoot} from "@/components/button";
import {Tooltip} from "@/components/tooltip";
import {setInteractionModality} from "@/composables/use-interaction-states";
import {resetTooltipWarmup} from "@/composables/use-tooltip-trigger-state";

/**
 * The tooltip mounted the way a consumer mounts it: from a VDOM host, with the trigger and the
 * content written in the host and forwarded through slots.
 *
 * Content written in Vapor resolves `inject` against the component that renders it, so anything
 * the tooltip provides is found; content written in a VDOM host resolves against the host, so only
 * what the component it was handed to provides is found. Both of the tooltip's provides — the
 * focus behaviour the trigger takes, and the placement the arrow reads — go to slot content, so
 * both have to be proven here as well as in the Vapor suite.
 */
const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

const render = () =>
  renderInterop(Tooltip, {
    props: {defaultOpen: true},
    slots: {
      default: () => [
        h(ButtonRoot, null, {default: () => "Open tooltip"}),
        // Never flipped: a jsdom measurement is all zeroes, so a placement free to flip would
        // report whichever side the fallback lands on rather than the one asked for.
        h(Tooltip.Content, {shouldFlip: false}, {default: () => [h(Tooltip.Arrow)]}),
      ],
    },
  });

describe("Tooltip (interop)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setInteractionModality("pointer");
  });

  afterEach(() => {
    vi.useRealTimers();
    resetTooltipWarmup();
    setInteractionModality("keyboard");
  });

  it("hands the trigger's description to a button written in the host", async () => {
    const result = render();

    await settle();

    const button = result.container.querySelector("[data-slot='button']");
    const tooltip = result.screen.getByRole("tooltip");

    expect(button).toBeTruthy();
    expect(tooltip.id).toBeTruthy();
    expect(button!.getAttribute("aria-describedby")).toBe(tooltip.id);

    result.unmount();
  });

  it("positions the tooltip against a button written in the host", async () => {
    const result = render();

    await settle();

    // A placement at all means the button reported itself as the element to measure. Without that
    // report there is nothing to position against, and the tooltip renders at the top left corner
    // of the page with no placement of any kind.
    expect(result.screen.getByRole("tooltip").getAttribute("data-placement")).toBe("top");

    result.unmount();
  });

  it("tells an arrow written in the host which side it is on", async () => {
    const result = render();

    await settle();

    const group = document.body.querySelector("[data-slot='tooltip-arrow']");

    expect(group).toBeTruthy();
    // Without the placement the arrow keeps its unplaced offsets and sits in the middle of the
    // tooltip rather than pointing at the trigger.
    expect(group!.getAttribute("data-placement")).toBe("top");
    expect(document.body.querySelector("[data-slot='overlay-arrow']")).toBeTruthy();

    result.unmount();
  });
});
