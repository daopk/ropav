import type { ScrollWheelDelta } from "@/composables/use-scroll-wheel";

import { describe, expect, it, vi } from "vitest";
import { effectScope, nextTick, shallowRef } from "vue";

import { useScrollWheel } from "@/composables/use-scroll-wheel";

/** Run the composable over a real element in a disposable scope, mirroring a component lifetime. */
const setup = (options: { isDisabled?: boolean } = {}) => {
  const element = document.createElement("div");

  document.body.append(element);

  const target = shallowRef<HTMLElement | null>(element);
  const isDisabled = shallowRef(options.isDisabled ?? false);
  const onScroll = vi.fn<(delta: ScrollWheelDelta) => void>();

  const scope = effectScope();

  scope.run(() => useScrollWheel(target, { isDisabled, onScroll }));

  const wheel = (init: WheelEventInit = {}) => {
    const event = new WheelEvent("wheel", { bubbles: true, cancelable: true, ...init });

    element.dispatchEvent(event);

    return event;
  };

  return {
    dispose: () => {
      scope.stop();
      element.remove();
    },
    element,
    isDisabled,
    onScroll,
    target,
    wheel,
  };
};

describe("useScrollWheel", () => {
  it("reports both axes of a gesture", async () => {
    const { dispose, onScroll, wheel } = setup();

    await nextTick();
    wheel({ deltaX: 3, deltaY: -7 });

    expect(onScroll).toHaveBeenCalledWith({ deltaX: 3, deltaY: -7 });

    dispose();
  });

  it("stops the page from scrolling", async () => {
    // The listener is attached by hand rather than declared in a template for exactly this: a
    // template listener is passive by default, and a passive listener cannot cancel.
    const { dispose, wheel } = setup();

    await nextTick();

    expect(wheel({ deltaY: 10 }).defaultPrevented).toBe(true);

    dispose();
  });

  it("stops the page even for a gesture the caller ignores", async () => {
    // The caller decides whether the gesture means anything; the page is held still either way,
    // or a control that answers the wheel would scroll out from under itself half the time.
    const { dispose, wheel } = setup();

    await nextTick();

    expect(wheel({ deltaX: 20, deltaY: 0 }).defaultPrevented).toBe(true);

    dispose();
  });

  it("ignores a pinch zoom", async () => {
    // A wheel gesture with the ctrl key held is a zoom. It arrives with a vertical delta like
    // any other, so without the check a pinch would drive whatever the caller does.
    const { dispose, onScroll, wheel } = setup();

    await nextTick();

    const event = wheel({ ctrlKey: true, deltaY: 10 });

    expect(onScroll).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);

    dispose();
  });

  it("attaches nothing while disabled", async () => {
    const { dispose, onScroll, wheel } = setup({ isDisabled: true });

    await nextTick();

    const event = wheel({ deltaY: 10 });

    expect(onScroll).not.toHaveBeenCalled();
    // Not merely unreported: with no listener the page scrolls as it normally would.
    expect(event.defaultPrevented).toBe(false);

    dispose();
  });

  it("follows the disabled flag as it changes", async () => {
    const { dispose, isDisabled, onScroll, wheel } = setup({ isDisabled: true });

    await nextTick();
    isDisabled.value = false;
    await nextTick();
    wheel({ deltaY: 10 });

    expect(onScroll).toHaveBeenCalledTimes(1);

    isDisabled.value = true;
    await nextTick();
    wheel({ deltaY: 10 });

    expect(onScroll).toHaveBeenCalledTimes(1);

    dispose();
  });

  it("follows the element as it changes", async () => {
    const { dispose, onScroll, target, wheel } = setup();

    await nextTick();
    target.value = null;
    await nextTick();
    wheel({ deltaY: 10 });

    expect(onScroll).not.toHaveBeenCalled();

    dispose();
  });

  it("detaches when the scope ends", async () => {
    const { dispose, element, onScroll } = setup();

    await nextTick();
    dispose();

    element.dispatchEvent(new WheelEvent("wheel", { cancelable: true, deltaY: 10 }));

    expect(onScroll).not.toHaveBeenCalled();
  });
});
