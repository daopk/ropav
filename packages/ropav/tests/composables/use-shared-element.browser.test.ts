import type { SharedElementScope, UseSharedElementReturn } from "@/composables/use-shared-element";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { effectScope, nextTick, shallowRef, watch } from "vue";

import { createSharedElementScope, useSharedElement } from "@/composables/use-shared-element";

/**
 * Real layout and a real animation clock, which is the whole point of testing this in a browser.
 *
 * jsdom answers every rect with zeroes, so every delta the handoff computes is `0px 0px` there and
 * the one thing this composable exists to do is unobservable. The stylesheet is declared here
 * rather than taken from `@ropav/styles` so the durations and offsets are the test's own.
 */
const DURATION = 120;
const NAME = "SelectionIndicator";

const style = document.createElement("style");

beforeAll(() => {
  style.textContent = `
    .shared-host { position: relative; width: 400px; height: 40px }
    .shared {
      position: absolute;
      top: 0;
      transition-property: translate, width, height;
      transition-duration: ${DURATION}ms;
      transition-timing-function: linear;
    }
    /* Every one of the three transitioned properties differs, so all three have to be carried. */
    .shared--left { left: 0; width: 80px; height: 40px }
    .shared--right { left: 200px; width: 160px; height: 24px }
    @keyframes shared-out { from { opacity: 1 } to { opacity: 0 } }
    .shared[data-exiting="true"] { animation: shared-out ${DURATION}ms linear }
  `;

  document.head.appendChild(style);
});

// The rules are the file's own, so they leave with it rather than sitting on the shared page.
afterAll(() => {
  style.remove();
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const settle = async (ticks = 4) => {
  for (let index = 0; index < ticks; index += 1) await nextTick();
};

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const stops: (() => void)[] = [];
const hosts: HTMLElement[] = [];

interface Harness {
  shared: UseSharedElementReturn;
  element: HTMLElement;
  show: (visible: boolean) => void;
}

const mount = (
  scope: SharedElementScope,
  options: { modifier: "left" | "right"; isVisible?: boolean },
): Harness => {
  const host = document.createElement("div");

  host.className = "shared-host";
  hosts.push(host);
  document.body.appendChild(host);

  const element = document.createElement("div");

  element.className = `shared shared--${options.modifier}`;

  const visible = shallowRef(options.isVisible ?? true);
  const effect = effectScope();

  stops.push(() => effect.stop());

  const shared = effect.run(() => {
    const elementRef = shallowRef<HTMLElement | null>(null);

    const result = useSharedElement({
      elementRef,
      isVisible: () => visible.value,
      name: NAME,
      scope,
    });

    // What the component's `v-if` on `isPresent` does, done by hand.
    watch(
      result.isPresent,
      (isPresent) => {
        if (isPresent) {
          host.appendChild(element);
          elementRef.value = element;
        } else {
          element.remove();
          elementRef.value = null;
        }
      },
      { flush: "post", immediate: true },
    );

    /*
     * The state attributes are not decoration: the stylesheet keys the exit animation on
     * `data-exiting`, so writing it is what starts the animation the composable then waits for.
     */
    watch(
      [result.isEntering, result.isExiting],
      ([isEntering, isExiting]) => {
        element.toggleAttribute("data-entering", isEntering);
        if (isExiting) element.setAttribute("data-exiting", "true");
        else element.removeAttribute("data-exiting");
      },
      { flush: "post", immediate: true },
    );

    return result;
  })!;

  return {
    element,
    shared,
    show: (next: boolean) => {
      visible.value = next;
    },
  };
};

/** Hand a left-hand element's place over to a right-hand one, and return the newcomer. */
const handOver = async (scope: SharedElementScope) => {
  const outgoing = mount(scope, { modifier: "left" });

  await settle();
  await frame();

  outgoing.show(false);

  const incoming = mount(scope, { modifier: "right" });

  await settle();

  return { incoming, outgoing };
};

afterEach(() => {
  stops.splice(0).forEach((stop) => stop());
  hosts.splice(0).forEach((host) => host.remove());
});

describe("useSharedElement (browser)", () => {
  it("slides from the previous element's position", async () => {
    const scope = createSharedElementScope();
    const { incoming } = await handOver(scope);

    // The newcomer sits 200px to the right, so it starts 200px to the left of where it belongs.
    const translate = getComputedStyle(incoming.element).translate;

    expect(translate).not.toBe("none");
    expect(Number.parseFloat(translate)).toBeLessThan(0);

    await wait(DURATION + 60);

    expect(getComputedStyle(incoming.element).translate).toBe("none");
  });

  it("animates the previous size to the new one", async () => {
    const scope = createSharedElementScope();
    const { incoming } = await handOver(scope);

    // The transitions that carry the element only start once the real values are put back, which
    // is a frame after the overrides went on.
    await frame();
    await frame();

    const running = incoming.element
      .getAnimations()
      .map((animation) => (animation as CSSTransition).transitionProperty);

    expect(running).toContain("width");
    expect(running).toContain("height");

    await wait(DURATION + 60);

    expect(getComputedStyle(incoming.element).width).toBe("160px");
    expect(getComputedStyle(incoming.element).height).toBe("24px");
  });

  it("cancels the transitions its own overrides triggered", async () => {
    const scope = createSharedElementScope();
    const { incoming } = await handOver(scope);

    // Applying the previous values starts transitions towards where the element came from, and
    // those are cancelled on the spot — so nothing is running until the restore starts the ones
    // that carry the element to where it is going, and then it is exactly those three.
    expect(incoming.element.getAnimations()).toHaveLength(0);

    await frame();
    await frame();

    const properties = incoming.element
      .getAnimations()
      .map((animation) => (animation as CSSTransition).transitionProperty)
      .sort();

    expect(properties).toEqual(["height", "translate", "width"]);
  });

  it("holds the element until its exit animation has finished", async () => {
    const scope = createSharedElementScope();
    const outgoing = mount(scope, { modifier: "left" });

    await settle();
    await frame();

    outgoing.show(false);
    await settle();

    expect(outgoing.shared.isPresent.value).toBe(true);
    expect(outgoing.shared.isExiting.value).toBe(true);

    await wait(DURATION + 60);

    expect(outgoing.shared.isPresent.value).toBe(false);
  });

  it("keeps its inline overrides for exactly one frame", async () => {
    const scope = createSharedElementScope();
    const { incoming } = await handOver(scope);

    expect(incoming.element.style.getPropertyValue("width")).toBe("80px");

    await frame();
    await frame();

    expect(incoming.element.style.getPropertyValue("width")).toBe("");
  });
});
