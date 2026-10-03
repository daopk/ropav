import { describe, expect, it, vi } from "vitest";
import { shallowRef } from "vue";

import { useOverlayTriggerState } from "@/composables/use-overlay-trigger-state";

import { withScope } from "../harness/scope";

describe("useOverlayTriggerState", () => {
  describe("uncontrolled", () => {
    it("starts closed", () => {
      const [state, dispose] = withScope(() => useOverlayTriggerState());

      expect(state.isOpen.value).toBe(false);

      dispose();
    });

    it("starts at the default", () => {
      const [state, dispose] = withScope(() => useOverlayTriggerState({ defaultOpen: true }));

      expect(state.isOpen.value).toBe(true);

      dispose();
    });

    it("opens, closes and toggles", () => {
      const onOpenChange = vi.fn();
      const [state, dispose] = withScope(() => useOverlayTriggerState({ onOpenChange }));

      state.open();
      expect(state.isOpen.value).toBe(true);

      state.close();
      expect(state.isOpen.value).toBe(false);

      state.toggle();
      expect(state.isOpen.value).toBe(true);

      expect(onOpenChange).toHaveBeenNthCalledWith(1, true);
      expect(onOpenChange).toHaveBeenNthCalledWith(2, false);
      expect(onOpenChange).toHaveBeenNthCalledWith(3, true);

      dispose();
    });
  });

  describe("controlled", () => {
    it("follows the flag it is given and does not move itself", () => {
      const isOpen = shallowRef(false);
      const onOpenChange = vi.fn();
      const [state, dispose] = withScope(() => useOverlayTriggerState({ isOpen, onOpenChange }));

      state.open();

      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(state.isOpen.value).toBe(false);

      isOpen.value = true;

      expect(state.isOpen.value).toBe(true);

      dispose();
    });
  });
});
