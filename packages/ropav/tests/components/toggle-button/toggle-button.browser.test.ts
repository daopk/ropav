import { renderVapor } from "@ropav/testing/helpers/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { ToggleButton } from "@/components/toggle-button";

import { parkPointer } from "../../harness/park-pointer";

const renderToggleButton = (props: Record<string, unknown> = {}) =>
  renderVapor(ToggleButton, {
    props,
    slots: { default: () => document.createTextNode("Like") },
  });

const buttonIn = (container: HTMLElement) => container.querySelector("button")!;

/**
 * The jsdom suite toggles this button by dispatching a click, which proves the handler runs but
 * not that a finger can reach it. A real press moves the pointer onto the button first, and that
 * hover re-renders it; in vapor a re-render re-attaches every listener that arrived through
 * `v-bind`, which both reorders them and can drop one mid-dispatch. Selection here is also state
 * the press itself changes, so the re-render lands in the middle of the very dispatch that caused
 * it — the shape a dispatched event never produces.
 *
 * Every case parks the pointer first. It belongs to the page, not to the test, so a button left
 * under it by an earlier file would never see the pointer cross onto it and the press would skip
 * the re-render this is here to survive.
 */
describe("ToggleButton (browser)", () => {
  beforeEach(parkPointer);

  it("toggles on a press from the pointer itself", async () => {
    const onChange = vi.fn();
    const { container, unmount } = renderToggleButton({ onChange });
    const button = buttonIn(container);

    expect(button).not.toHaveAttribute("data-selected");

    await userEvent.click(button);
    await nextTick();

    expect(onChange).toHaveBeenCalledWith(true);
    expect(button).toHaveAttribute("data-selected", "true");

    unmount();
  });

  it("toggles back on a second press without the pointer leaving", async () => {
    // The pointer stays put between the two presses, so the second one arrives with the hover
    // already established and only the selection re-rendering underneath it.
    const onChange = vi.fn();
    const { container, unmount } = renderToggleButton({ onChange });
    const button = buttonIn(container);

    await userEvent.click(button);
    await nextTick();
    await userEvent.click(button);
    await nextTick();

    expect(onChange).toHaveBeenNthCalledWith(2, false);
    expect(button).not.toHaveAttribute("data-selected");

    unmount();
  });
});
