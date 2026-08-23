import {afterEach, beforeAll, describe, expect, it} from "vitest";
import {effectScope, shallowRef, watchEffect} from "vue";

import {useEnterExit} from "@/composables/use-enter-exit";

/**
 * Real animations, which is the whole point of testing this in a browser.
 *
 * jsdom implements none, so the composable's waits resolve immediately there and every ordering
 * question it exists to answer is unobservable. The keyframes are declared here rather than taken
 * from `@ropav/styles` so the durations are the test's own.
 */
const DURATION = 200;

beforeAll(() => {
  const style = document.createElement("style");

  style.textContent = `
    @keyframes enter-exit-in { from { opacity: 0 } to { opacity: 1 } }
    @keyframes enter-exit-out { from { opacity: 1 } to { opacity: 0 } }
    .enter-exit[data-entering="true"] { animation: enter-exit-in ${DURATION}ms linear }
    .enter-exit[data-exiting="true"] { animation: enter-exit-out ${DURATION}ms linear }
  `;

  document.head.appendChild(style);
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const hosts: (() => void)[] = [];

const setup = () => {
  const isOpen = shallowRef(false);
  const elementRef = shallowRef<HTMLElement | null>(null);
  const scope = effectScope();

  const state = scope.run(() => {
    const enterExit = useEnterExit({
      elementRef,
      isOpen,
      // What every real call site passes, in the form this fixture can answer it: the entry may
      // not be waited for before the element exists, or the wait ends against nothing and the
      // animation never plays.
      isReady: () => elementRef.value !== null,
    });

    /**
     * What a component does with the state, done by hand.
     *
     * The attributes are not decoration: the stylesheet keys the animations on them, so writing
     * them is what starts the animations the composable then waits for. Post-flush, because that
     * is when a component's render would have landed them.
     */
    watchEffect(
      () => {
        const element = elementRef.value;

        if (!element) return;

        element.toggleAttribute("data-entering", enterExit.isEntering.value);
        element.toggleAttribute("data-exiting", enterExit.isExiting.value);

        if (enterExit.isEntering.value) element.setAttribute("data-entering", "true");
        if (enterExit.isExiting.value) element.setAttribute("data-exiting", "true");
      },
      {flush: "post"},
    );

    return enterExit;
  })!;

  /**
   * The element exists only while the state says it should, which is what a component's `v-if`
   * does. Mounting it up front instead would make the entry state observable before there was
   * anything to animate.
   */
  scope.run(() =>
    watchEffect(() => {
      if (state!.isPresent.value && elementRef.value === null) {
        const element = document.createElement("div");

        element.className = "enter-exit";
        document.body.appendChild(element);
        elementRef.value = element;

        return;
      }

      if (!state!.isPresent.value && elementRef.value !== null) {
        elementRef.value.remove();
        elementRef.value = null;
      }
    }),
  );

  const dispose = () => {
    scope.stop();
    elementRef.value?.remove();
    elementRef.value = null;
  };

  hosts.push(dispose);

  return {dispose, element: () => elementRef.value, isOpen, state};
};

afterEach(() => {
  while (hosts.length > 0) hosts.pop()!();
});

describe("useEnterExit (browser)", () => {
  it("reports the entry until its animation finishes", async () => {
    const host = setup();

    host.isOpen.value = true;
    await wait(20);

    expect(host.state.isEntering.value).toBe(true);
    expect(host.element()!.getAnimations().length).toBeGreaterThan(0);

    await wait(DURATION + 80);

    expect(host.state.isEntering.value).toBe(false);

    host.dispose();
  });

  it("keeps the element present until its exit animation finishes", async () => {
    const host = setup();

    host.isOpen.value = true;
    await wait(DURATION + 80);

    host.isOpen.value = false;
    await wait(20);

    expect(host.state.isExiting.value).toBe(true);
    expect(host.state.isPresent.value).toBe(true);

    await wait(DURATION + 80);

    expect(host.state.isExiting.value).toBe(false);
    expect(host.state.isPresent.value).toBe(false);

    host.dispose();
  });

  it("clears the entry state after closing and reopening mid-animation", async () => {
    const host = setup();

    host.isOpen.value = true;
    // Part-way through the entry, which is the ordering that matters: the exit begins while the
    // entry is still being waited for.
    await wait(40);

    host.isOpen.value = false;
    await wait(20);
    host.isOpen.value = true;

    await wait(DURATION * 2);

    /**
     * The entry has to clear even though its wait was overtaken by an exit.
     *
     * The two phases were once counted by a single generation, so the exit invalidated the entry's
     * pending wait and nothing ever cleared it. The element then stayed on the first frame of its
     * entry animation for good — for a real overlay that means scaled down and fully transparent,
     * so a popover closed and reopened quickly went invisible until it was destroyed.
     */
    expect(host.state.isEntering.value).toBe(false);
    expect(host.state.isPresent.value).toBe(true);

    host.dispose();
  });

  it("clears the exit state after reopening and closing again mid-animation", async () => {
    const host = setup();

    host.isOpen.value = true;
    await wait(DURATION + 80);

    host.isOpen.value = false;
    await wait(40);
    // Back open while the exit is still being waited for, then closed again.
    host.isOpen.value = true;
    await wait(40);
    host.isOpen.value = false;

    await wait(DURATION * 2);

    // The mirror of the case above: an entry overtaking an exit must not strand it either, or the
    // element would never be taken out of the document.
    expect(host.state.isExiting.value).toBe(false);
    expect(host.state.isPresent.value).toBe(false);

    host.dispose();
  });
});
