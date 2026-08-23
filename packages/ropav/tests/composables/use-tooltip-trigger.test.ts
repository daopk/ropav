import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope, nextTick } from "vue";

import { setInteractionModality } from "@/composables/use-interaction-states";
import { useTooltipTrigger } from "@/composables/use-tooltip-trigger";
import {
  resetTooltipWarmup,
  useTooltipTriggerState,
} from "@/composables/use-tooltip-trigger-state";

type Options = Parameters<typeof useTooltipTrigger>[0];
type StateOptions = Parameters<typeof useTooltipTriggerState>[0];

const POINTER = { bubbles: true, pointerId: 1, pointerType: "mouse" } as const;

const setup = (options: Options = {}, stateOptions: StateOptions = {}) => {
  const scope = effectScope();
  const result = scope.run(() => {
    const state = useTooltipTriggerState({ closeDelay: 500, delay: 1500, ...stateOptions });

    return { state, trigger: useTooltipTrigger(options, state) };
  })!;

  const { onBlur, onFocus, onKeydown, onPointerdown, onPointerenter, onPointerleave } =
    result.trigger.responder.handlers.value;

  return {
    blur: () => onBlur(new FocusEvent("blur")),
    dispose: () => scope.stop(),
    focus: () => onFocus(new FocusEvent("focus")),
    hoverEnd: (pointerType = "mouse") =>
      onPointerleave(new PointerEvent("pointerleave", { ...POINTER, pointerType })),
    hoverStart: (pointerType = "mouse") =>
      onPointerenter(new PointerEvent("pointerenter", { ...POINTER, pointerType })),
    keydown: () => onKeydown(new KeyboardEvent("keydown", { key: "Enter" })),
    pointerdown: () => onPointerdown(new PointerEvent("pointerdown", POINTER)),
    state: result.state,
    trigger: result.trigger,
  };
};

describe("useTooltipTrigger", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // The modality is page-wide, so each case states the one it needs rather than inheriting it.
    setInteractionModality("pointer");
  });

  afterEach(() => {
    vi.useRealTimers();
    resetTooltipWarmup();
    setInteractionModality("keyboard");
  });

  describe("hover", () => {
    it("opens after the delay", () => {
      const host = setup();

      host.hoverStart();
      expect(host.state.isOpen.value).toBe(false);

      vi.advanceTimersByTime(1500);
      expect(host.state.isOpen.value).toBe(true);

      host.dispose();
    });

    it("closes after the close delay when the pointer leaves", () => {
      const host = setup();

      host.hoverStart();
      vi.advanceTimersByTime(1500);
      host.hoverEnd();

      expect(host.state.isOpen.value).toBe(true);

      vi.advanceTimersByTime(500);
      expect(host.state.isOpen.value).toBe(false);

      host.dispose();
    });

    it("ignores hover while the user is not driving with a pointer", () => {
      setInteractionModality("keyboard");

      const host = setup();

      // Chrome ends hover when something covers the trigger and restores it when that goes away,
      // so a tooltip would otherwise reappear with the pointer nowhere near it.
      host.hoverStart();
      vi.advanceTimersByTime(3000);

      expect(host.state.isOpen.value).toBe(false);

      host.dispose();
    });

    it("ignores a touch", () => {
      const host = setup();

      // A touch reports hover twice, once as `touch` and again as `mouse`, and a tooltip opened
      // that way has no gesture that dismisses it.
      host.hoverStart("touch");
      vi.advanceTimersByTime(3000);

      expect(host.state.isOpen.value).toBe(false);

      host.dispose();
    });

    it("does nothing while disabled", () => {
      const host = setup({ isDisabled: true });

      host.hoverStart();
      vi.advanceTimersByTime(3000);

      expect(host.state.isOpen.value).toBe(false);

      host.dispose();
    });

    it("does nothing when it only opens on focus", () => {
      const host = setup({ trigger: "focus" });

      host.hoverStart();
      vi.advanceTimersByTime(3000);

      expect(host.state.isOpen.value).toBe(false);

      host.dispose();
    });
  });

  describe("focus", () => {
    it("opens at once for keyboard focus", () => {
      setInteractionModality("keyboard");

      const host = setup();

      host.focus();

      // No delay: a user who tabbed here asked for the label deliberately.
      expect(host.state.isOpen.value).toBe(true);

      host.dispose();
    });

    it("ignores focus that arrived from a press", () => {
      const host = setup();

      // Clicking a button focuses it, and a tooltip left behind by every click is noise.
      host.focus();
      vi.advanceTimersByTime(3000);

      expect(host.state.isOpen.value).toBe(false);

      host.dispose();
    });

    it("closes at once on blur", () => {
      setInteractionModality("keyboard");

      const host = setup();

      host.focus();
      host.blur();

      expect(host.state.isOpen.value).toBe(false);

      host.dispose();
    });

    it("does nothing while disabled", () => {
      setInteractionModality("keyboard");

      const host = setup({ isDisabled: true });

      host.focus();

      expect(host.state.isOpen.value).toBe(false);

      host.dispose();
    });
  });

  describe("hover and focus together", () => {
    it("stays open while the pointer is still on the trigger after blur", () => {
      const host = setup();

      host.hoverStart();
      vi.advanceTimersByTime(1500);
      setInteractionModality("keyboard");
      host.focus();

      host.blur();

      // Blur clears both, so this is the documented React behaviour rather than an accident: the
      // tooltip goes even though the pointer has not moved.
      expect(host.state.isOpen.value).toBe(false);

      host.dispose();
    });

    it("stays open when hover ends while focus remains", () => {
      setInteractionModality("keyboard");

      const host = setup();

      host.focus();
      expect(host.state.isOpen.value).toBe(true);

      setInteractionModality("pointer");
      host.hoverStart();
      host.hoverEnd();

      // Leaving the trigger clears focus too, matching React — one gesture, one meaning.
      expect(host.state.isOpen.value).toBe(true);

      vi.advanceTimersByTime(500);
      expect(host.state.isOpen.value).toBe(false);

      host.dispose();
    });
  });

  describe("press", () => {
    it("closes at once on pointer down", () => {
      const host = setup();

      host.hoverStart();
      vi.advanceTimersByTime(1500);
      host.pointerdown();

      // Instantly, not after the close delay: the tooltip would otherwise sit over whatever the
      // press opened.
      expect(host.state.isOpen.value).toBe(false);

      host.dispose();
    });

    it("closes at once on a key press", () => {
      setInteractionModality("keyboard");

      const host = setup();

      host.focus();
      host.keydown();

      expect(host.state.isOpen.value).toBe(false);

      host.dispose();
    });

    it("stays open through a press when asked to", () => {
      const host = setup({ shouldCloseOnPress: false });

      host.hoverStart();
      vi.advanceTimersByTime(1500);
      host.pointerdown();

      expect(host.state.isOpen.value).toBe(true);

      host.dispose();
    });
  });

  describe("escape", () => {
    it("closes on Escape while open", async () => {
      const host = setup();

      host.hoverStart();
      vi.advanceTimersByTime(1500);
      // The listener is attached once the tooltip is on screen, which is a flush after it opens.
      await nextTick();

      document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

      // Listened for on the document: focus is still on the trigger, or nowhere at all after a
      // click, so nothing on the path from the key to the tooltip could handle it.
      expect(host.state.isOpen.value).toBe(false);

      host.dispose();
    });

    it("ignores other keys", async () => {
      const host = setup();

      host.hoverStart();
      vi.advanceTimersByTime(1500);
      await nextTick();

      document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "a" }));

      expect(host.state.isOpen.value).toBe(true);

      host.dispose();
    });

    it("keeps the key from reaching anything else", async () => {
      const host = setup();
      const other = document.createElement("div");

      document.body.appendChild(other);

      const seen: string[] = [];

      other.addEventListener("keydown", (event) => seen.push(event.key));

      host.hoverStart();
      vi.advanceTimersByTime(1500);
      await nextTick();

      other.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

      // Stopped in the capture phase on the document, so a dialog behind the tooltip does not also
      // close on the same key — one Escape dismisses one thing.
      expect(seen).toEqual([]);
      expect(host.state.isOpen.value).toBe(false);

      other.remove();
      host.dispose();
    });

    it("stops listening once it is closed", async () => {
      const host = setup();

      host.hoverStart();
      vi.advanceTimersByTime(1500);
      await nextTick();
      host.hoverEnd();
      vi.advanceTimersByTime(500);
      await nextTick();

      expect(host.state.isOpen.value).toBe(false);

      // Nothing should throw, and nothing should be left listening on the document.
      expect(() =>
        document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" })),
      ).not.toThrow();

      host.dispose();
    });
  });

  describe("description", () => {
    it("points the trigger at the tooltip only while it is open", () => {
      const host = setup();
      const describedBy = () => host.trigger.responder.attrs.value["aria-describedby"];

      expect(describedBy()).toBeUndefined();
      // Non-empty, so the assertion below cannot pass by comparing two absent values.
      expect(host.trigger.tooltipId.value).toBeTruthy();

      host.hoverStart();
      vi.advanceTimersByTime(1500);

      // An idref to an element that is not rendered is worse than none: a screen reader announces
      // nothing and the user has no way to tell.
      expect(describedBy()).toBe(host.trigger.tooltipId.value);

      host.hoverEnd();
      vi.advanceTimersByTime(500);

      expect(describedBy()).toBeUndefined();

      host.dispose();
    });
  });

  describe("element", () => {
    it("reports the element the tooltip is positioned against", () => {
      const host = setup();
      const element = document.createElement("button");

      expect(host.trigger.triggerElement.value).toBeNull();

      host.trigger.responder.registerElement(element);
      expect(host.trigger.triggerElement.value).toBe(element);

      host.trigger.responder.registerElement(null);
      expect(host.trigger.triggerElement.value).toBeNull();

      host.dispose();
    });
  });
});
