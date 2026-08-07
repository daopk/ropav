import {describe, expect, it} from "vitest";
import {effectScope, nextTick, shallowRef} from "vue";

import {useEnterExit} from "@/composables/use-enter-exit";

/** Run a composable in a disposable scope, mirroring a component lifetime. */
const withScope = <T>(setup: () => T): [T, () => void] => {
  const scope = effectScope();
  const result = scope.run(setup) as T;

  return [result, () => scope.stop()];
};

const setup = (options: {isOpen?: boolean; isReady?: boolean} = {}) => {
  const element = document.createElement("div");

  document.body.appendChild(element);

  const isOpen = shallowRef(options.isOpen ?? true);
  const isReady = shallowRef(options.isReady ?? true);

  const [state, dispose] = withScope(() => useEnterExit({elementRef: element, isOpen, isReady}));

  return {
    dispose: () => {
      dispose();
      element.remove();
    },
    element,
    isOpen,
    isReady,
    state,
  };
};

/**
 * jsdom implements no animations, so every wait resolves at once and the states collapse to
 * their end values. That is the behaviour under test here — the timing itself is covered in the
 * browser suites, where there is a real animation to wait for.
 */
describe("useEnterExit", () => {
  describe("presence", () => {
    it("is present while open", () => {
      const {dispose, state} = setup();

      expect(state.isPresent.value).toBe(true);

      dispose();
    });

    it("is absent while closed", () => {
      const {dispose, state} = setup({isOpen: false});

      expect(state.isPresent.value).toBe(false);

      dispose();
    });

    it("goes absent once the exit has finished", async () => {
      const {dispose, isOpen, state} = setup();

      isOpen.value = false;
      await nextTick();

      expect(state.isExiting.value).toBe(false);
      expect(state.isPresent.value).toBe(false);

      dispose();
    });
  });

  describe("entering", () => {
    it("clears the entering state once the animation has finished", async () => {
      const {dispose, state} = setup();

      await nextTick();

      expect(state.isEntering.value).toBe(false);

      dispose();
    });

    it("does not report entering until the element is ready", async () => {
      const {dispose, isReady, state} = setup({isReady: false});

      await nextTick();

      // An overlay is not ready until it has been measured and positioned; animating before
      // that would be a slide in from wherever it was laid out.
      expect(state.isEntering.value).toBe(false);

      isReady.value = true;
      await nextTick();

      expect(state.isEntering.value).toBe(false);

      dispose();
    });

    it("enters again when it is reopened", async () => {
      const {dispose, isOpen, isReady, state} = setup();

      await nextTick();

      expect(state.isEntering.value).toBe(false);

      // Held un-ready across the reopen, which is the only way to catch the entering state in
      // jsdom: with nothing to wait for it is otherwise cleared within the same flush.
      isReady.value = false;
      isOpen.value = false;
      await nextTick();
      isOpen.value = true;
      await nextTick();
      isReady.value = true;

      expect(state.isEntering.value).toBe(true);

      await nextTick();

      expect(state.isEntering.value).toBe(false);

      dispose();
    });
  });

  describe("reopening mid-exit", () => {
    it("returns to open rather than finishing the exit", async () => {
      const {dispose, isOpen, state} = setup();

      await nextTick();
      isOpen.value = false;
      isOpen.value = true;
      await nextTick();

      // The element never left, so it must not be reported as on its way out.
      expect(state.isExiting.value).toBe(false);
      expect(state.isPresent.value).toBe(true);

      dispose();
    });
  });
});
