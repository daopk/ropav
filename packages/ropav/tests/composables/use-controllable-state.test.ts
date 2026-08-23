import { describe, expect, it, vi } from "vitest";
import { effectScope, shallowRef } from "vue";

import { useControllableState } from "@/composables/use-controllable-state";

/** Run a composable in a disposable scope, mirroring a component lifetime. */
const withScope = <T>(setup: () => T): [T, () => void] => {
  const scope = effectScope();
  const result = scope.run(setup) as T;

  return [result, () => scope.stop()];
};

describe("useControllableState", () => {
  describe("uncontrolled", () => {
    it("starts at the default value", () => {
      const [{ isControlled, state }, dispose] = withScope(() =>
        useControllableState<string>({ defaultValue: "a" }),
      );

      expect(state.value).toBe("a");
      expect(isControlled.value).toBe(false);

      dispose();
    });

    it("updates its own state and calls onValueChange", () => {
      const onValueChange = vi.fn();
      const [{ setState, state }, dispose] = withScope(() =>
        useControllableState<string>({ defaultValue: "a", onValueChange }),
      );

      setState("b");

      expect(state.value).toBe("b");
      expect(onValueChange).toHaveBeenCalledWith("b");

      dispose();
    });

    it("supports an updater function", () => {
      const [{ setState, state }, dispose] = withScope(() =>
        useControllableState<number>({ defaultValue: 1 }),
      );

      setState((previous) => previous + 1);

      expect(state.value).toBe(2);

      dispose();
    });

    it("supports writing through the state ref", () => {
      const [{ state }, dispose] = withScope(() =>
        useControllableState<string>({ defaultValue: "a" }),
      );

      state.value = "b";

      expect(state.value).toBe("b");

      dispose();
    });
  });

  describe("controlled", () => {
    it("reads the value from the controlling ref", () => {
      const value = shallowRef<string | undefined>("a");
      const [{ isControlled, state }, dispose] = withScope(() =>
        useControllableState<string>({ defaultValue: "z", value }),
      );

      expect(isControlled.value).toBe(true);
      expect(state.value).toBe("a");

      value.value = "b";
      expect(state.value).toBe("b");

      dispose();
    });

    it("notifies onValueChange without mutating its own state", () => {
      const value = shallowRef<string | undefined>("a");
      const onValueChange = vi.fn();
      const [{ setState, state }, dispose] = withScope(() =>
        useControllableState<string>({ defaultValue: "z", onValueChange, value }),
      );

      setState("b");

      expect(onValueChange).toHaveBeenCalledWith("b");
      // The owner of `value` decides; until it updates, the state does not move.
      expect(state.value).toBe("a");

      dispose();
    });
  });

  it("calls onValueChange only when the value actually changes", () => {
    const onValueChange = vi.fn();
    const [{ setState }, dispose] = withScope(() =>
      useControllableState<string>({ defaultValue: "a", onValueChange }),
    );

    setState("a");

    expect(onValueChange).not.toHaveBeenCalled();

    dispose();
  });
});
