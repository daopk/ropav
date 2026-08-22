import type {SharedElementScope, UseSharedElementReturn} from "@/composables/use-shared-element";

import {afterEach, beforeEach, describe, expect, it} from "vitest";
import {effectScope, nextTick, shallowRef, watch} from "vue";

import {createSharedElementScope, useSharedElement} from "@/composables/use-shared-element";

const NAME = "SelectionIndicator";

/**
 * Let every deferral in a phase run.
 *
 * Leaving takes three: the post-flush watcher, the deferral that asks whether anyone claimed the
 * snapshot, and the wait for the animations — which settle at once here, jsdom having none.
 */
const settle = async (ticks = 4) => {
  for (let index = 0; index < ticks; index += 1) await nextTick();
};

/**
 * jsdom has no layout, so every rect is zeroes and every delta is `0px 0px`. These suites assert
 * *that* an override was written and which properties were carried, never what the values were —
 * the geometry is only meaningful in the browser suite.
 */
const style = document.createElement("style");

style.textContent = `
  .shared {
    transition-property: translate, width, height;
    transition-duration: 40ms;
  }
  .a { width: 40px; height: 10px; }
  .b { width: 90px; height: 10px; }
  .plain { transition-property: none; }
`;

const stops: (() => void)[] = [];
const hosts: HTMLElement[] = [];

interface Harness {
  shared: UseSharedElementReturn;
  element: HTMLElement;
  show: (visible: boolean) => void;
  stop: () => void;
}

/**
 * One shared element, mounted into and out of the document by its own `isPresent`, the way the
 * component's `v-if` does it.
 */
const mount = (
  scope: SharedElementScope,
  options: {className?: string; isVisible?: boolean} = {},
): Harness => {
  const host = document.createElement("div");

  hosts.push(host);
  document.body.appendChild(host);

  const element = document.createElement("div");

  element.className = options.className ?? "shared a";

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
      {flush: "post", immediate: true},
    );

    return result;
  })!;

  return {
    element,
    shared,
    show: (next: boolean) => {
      visible.value = next;
    },
    stop: () => effect.stop(),
  };
};

afterEach(() => {
  stops.splice(0).forEach((stop) => stop());
  hosts.splice(0).forEach((host) => host.remove());
  style.remove();
});

describe("useSharedElement", () => {
  beforeEach(() => {
    document.head.appendChild(style);
  });

  describe("presence", () => {
    it("is present while visible and absent while not", async () => {
      const scope = createSharedElementScope();
      const {shared, show} = mount(scope);

      await nextTick();

      expect(shared.isPresent.value).toBe(true);

      show(false);
      await settle();

      expect(shared.isPresent.value).toBe(false);
    });

    it("enters when there is nothing to transition from", async () => {
      const scope = createSharedElementScope();
      const {shared} = mount(scope);

      await nextTick();
      await nextTick();

      expect(shared.isEntering.value).toBe(true);

      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(shared.isEntering.value).toBe(false);
    });
  });

  describe("the snapshot", () => {
    it("stores one before the element is patched away", async () => {
      const scope = createSharedElementScope();
      const {show} = mount(scope);

      await nextTick();
      show(false);

      // Synchronously, with no tick in between: by the time the DOM is patched it is too late.
      expect(scope.snapshots.get(NAME)).toBeDefined();
    });

    it("carries only the properties the stylesheet transitions", async () => {
      const scope = createSharedElementScope();
      const {show} = mount(scope);

      await nextTick();
      show(false);

      const properties = scope.snapshots.get(NAME)!.style.map(([property]) => property);

      expect(properties).toEqual(["translate", "width", "height"]);
      expect(properties).not.toContain("all");
    });

    it("stores nothing when nothing is transitioned", async () => {
      const scope = createSharedElementScope();
      const {show} = mount(scope, {className: "plain"});

      await nextTick();
      show(false);

      expect(scope.snapshots.get(NAME)).toBeUndefined();
    });

    it("stores nothing when the transition is the shorthand default", async () => {
      // With no rule of its own an element reports `all`, which is a shorthand with no readable
      // value — carrying it over would write the engine's placeholder back as an inline style.
      const scope = createSharedElementScope();
      const {show} = mount(scope, {className: "a"});

      await nextTick();
      show(false);

      expect(scope.snapshots.get(NAME)).toBeUndefined();
    });

    it("stores one on teardown as well as on the edge", async () => {
      const scope = createSharedElementScope();
      const {stop} = mount(scope);

      await nextTick();
      stop();

      expect(scope.snapshots.get(NAME)).toBeDefined();
    });

    it("stores nothing for an element that is already leaving", async () => {
      const scope = createSharedElementScope();
      const {show, stop} = mount(scope);

      await nextTick();
      show(false);
      await nextTick();
      await nextTick();
      scope.snapshots.delete(NAME);
      stop();

      expect(scope.snapshots.get(NAME)).toBeUndefined();
    });
  });

  describe("the handoff", () => {
    it("hands the snapshot to the element that mounts next", async () => {
      const scope = createSharedElementScope();
      const outgoing = mount(scope, {className: "shared a"});

      await nextTick();
      await nextTick();

      outgoing.show(false);

      const incoming = mount(scope, {className: "shared b", isVisible: true});

      await nextTick();
      await nextTick();

      expect(incoming.element.style.getPropertyValue("translate")).not.toBe("");
      expect(incoming.element.style.getPropertyValue("width")).toBe("40px");
      expect(scope.snapshots.get(NAME)).toBeUndefined();
    });

    it("restores the real values a frame later", async () => {
      const scope = createSharedElementScope();
      const outgoing = mount(scope, {className: "shared a"});

      await nextTick();
      await nextTick();
      outgoing.show(false);

      const incoming = mount(scope, {className: "shared b"});

      await nextTick();
      await nextTick();
      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(incoming.element.style.getPropertyValue("translate")).toBe("");
      expect(incoming.element.style.getPropertyValue("width")).toBe("");
    });

    it("does not enter when it took over a snapshot", async () => {
      const scope = createSharedElementScope();
      const outgoing = mount(scope, {className: "shared a"});

      await nextTick();
      await nextTick();
      outgoing.show(false);

      const incoming = mount(scope, {className: "shared b"});

      await nextTick();
      await nextTick();

      expect(incoming.shared.isEntering.value).toBe(false);
    });

    it("leaves without exiting when another element took the snapshot", async () => {
      const scope = createSharedElementScope();
      const outgoing = mount(scope, {className: "shared a"});

      await nextTick();
      await nextTick();
      outgoing.show(false);
      mount(scope, {className: "shared b"});

      await nextTick();
      await nextTick();

      expect(outgoing.shared.isExiting.value).toBe(false);
      expect(outgoing.shared.isPresent.value).toBe(false);
    });

    it("exits when nothing takes the snapshot", async () => {
      const scope = createSharedElementScope();
      const {shared, show} = mount(scope);

      await nextTick();
      await nextTick();
      show(false);
      await nextTick();
      await nextTick();

      expect(shared.isExiting.value).toBe(true);

      // jsdom implements no animations, so the wait settles as soon as it is asked.
      await settle();

      expect(shared.isExiting.value).toBe(false);
      expect(shared.isPresent.value).toBe(false);
    });

    it("is indifferent to which element's scope was created first", async () => {
      // React's guarantee that every unmount runs before every mount does not exist here, so the
      // handoff has to hold with the incoming element created before the outgoing one.
      const scope = createSharedElementScope();
      const incoming = mount(scope, {className: "shared b", isVisible: false});
      const outgoing = mount(scope, {className: "shared a", isVisible: true});

      await nextTick();
      await nextTick();

      outgoing.show(false);
      incoming.show(true);

      await nextTick();
      await nextTick();

      expect(incoming.element.style.getPropertyValue("width")).toBe("40px");
      expect(outgoing.shared.isExiting.value).toBe(false);
    });
  });

  it("survives an environment with no animation API", async () => {
    const scope = createSharedElementScope();
    const {shared, show} = mount(scope);

    await nextTick();

    expect(typeof shared.isPresent.value).toBe("boolean");

    show(false);
    await settle();

    expect(shared.isPresent.value).toBe(false);
  });
});
