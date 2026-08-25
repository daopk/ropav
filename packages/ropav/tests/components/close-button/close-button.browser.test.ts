import { renderVapor } from "@ropav/testing/helpers/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { CloseButton } from "@/components/close-button";

import { parkPointer } from "../../harness/park-pointer";

import ResponderFixture from "./fixtures.vue";

const buttonIn = (container: HTMLElement) => container.querySelector("button")!;

/**
 * A close button is the shape the listener-ordering bug was found in: a press supplied from above
 * has to run ahead of the button's own, and both are attached to the same element.
 *
 * A dispatched click cannot tell whether that still holds. A real press moves the pointer onto the
 * button first, and the hover it reports re-renders the button; in vapor a re-render re-attaches
 * every listener that arrived through `v-bind`, which leaves the supplied press *behind* the
 * button's own instead of ahead of it, and can drop a listener that has not run yet while the
 * event is still in flight. The press then re-renders again mid-dispatch when it marks itself
 * pressed. Both re-renders are invisible to a dispatched event, so this is the only place the
 * ordering is actually proven.
 *
 * The pointer is parked before each case because it belongs to the page rather than to the test:
 * left on the button by an earlier file, a click would never cross onto it and neither re-render
 * would happen.
 */
describe("CloseButton driven from above (browser)", () => {
  beforeEach(parkPointer);

  const renderWithResponder = (props: Record<string, unknown> = {}) =>
    renderVapor(ResponderFixture, { props });

  it("passes a press from the pointer itself to the supplied press", async () => {
    const onResponderClick = vi.fn();
    const { container, unmount } = renderWithResponder({ onResponderClick });

    await userEvent.click(buttonIn(container));
    await nextTick();

    expect(onResponderClick).toHaveBeenCalledOnce();

    unmount();
  });

  it("keeps the supplied press ahead of the button's own under a real pointer", async () => {
    const calls: string[] = [];
    const { container, unmount } = renderWithResponder({
      onOwnClick: () => calls.push("own"),
      onResponderClick: () => calls.push("responder"),
      withOwnClick: true,
    });

    await userEvent.click(buttonIn(container));
    await nextTick();

    expect(calls).toEqual(["responder", "own"]);

    unmount();
  });

  it("reports its own hover alongside the press it was given", async () => {
    // The hover is the re-render that reorders the listeners, so a press that survives it has to
    // be able to show the hover that caused it.
    const onResponderClick = vi.fn();
    const { container, unmount } = renderWithResponder({ onResponderClick });
    const button = buttonIn(container);

    await userEvent.hover(button);
    await nextTick();

    expect(button).toHaveAttribute("data-hovered", "true");

    await userEvent.click(button);
    await nextTick();

    expect(onResponderClick).toHaveBeenCalledOnce();

    unmount();
  });

  it("activates a plain close button from the pointer itself", async () => {
    const onClick = vi.fn();
    const { container, unmount } = renderVapor(CloseButton, { props: { onClick } });

    await userEvent.click(buttonIn(container));
    await nextTick();

    expect(onClick).toHaveBeenCalledOnce();

    unmount();
  });
});
