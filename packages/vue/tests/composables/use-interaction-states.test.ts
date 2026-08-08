import {describe, expect, it} from "vitest";
import {effectScope, shallowRef} from "vue";

import {useFocusWithin, useInteractionStates} from "@/composables/use-interaction-states";

/** Run a composable in a disposable scope, mirroring a component lifetime. */
const withScope = <T>(setup: () => T): [T, () => void] => {
  const scope = effectScope();
  const result = scope.run(setup) as T;

  return [result, () => scope.stop()];
};

const pointerEvent = (type: string, init: PointerEventInit = {}) =>
  new PointerEvent(type, {button: 0, pointerType: "mouse", ...init});

/** Reset the page-wide modality, which starts out as keyboard. */
const setPointerModality = () => {
  document.dispatchEvent(pointerEvent("pointerdown"));
};

const setKeyboardModality = () => {
  document.dispatchEvent(new KeyboardEvent("keydown", {key: "Tab"}));
};

/**
 * A group with a control inside it, because focus-within is decided by whether the element
 * focus moves to is contained by the one being watched.
 */
const createGroup = () => {
  const group = document.createElement("div");
  const input = document.createElement("input");
  const sibling = document.createElement("input");

  group.appendChild(input);
  document.body.append(group, sibling);

  return {
    cleanup: () => {
      group.remove();
      sibling.remove();
    },
    group,
    input,
    sibling,
  };
};

/**
 * Dispatch a real `focusout` on the group, rather than hand-building the event: `currentTarget`
 * is set by the DOM during dispatch and cannot be assigned, and it is what the containment
 * check reads. Attaching the handler as a listener is also how the template wires it.
 */
const focusOutTo = (
  group: HTMLElement,
  handler: (event: FocusEvent) => void,
  relatedTarget: Element | null,
) => {
  const listener = handler as EventListener;

  group.addEventListener("focusout", listener);
  group.dispatchEvent(new FocusEvent("focusout", {relatedTarget}));
  group.removeEventListener("focusout", listener);
};

describe("useInteractionStates", () => {
  describe("hover", () => {
    it("tracks pointer enter and leave", () => {
      const [states, dispose] = withScope(() => useInteractionStates());

      states.onPointerenter(pointerEvent("pointerenter"));

      expect(states.isHovered.value).toBe(true);

      states.onPointerleave();

      expect(states.isHovered.value).toBe(false);

      dispose();
    });

    it("ignores touch, which has no hover state to report", () => {
      const [states, dispose] = withScope(() => useInteractionStates());

      states.onPointerenter(pointerEvent("pointerenter", {pointerType: "touch"}));

      expect(states.isHovered.value).toBe(false);

      dispose();
    });

    it("reports no hover while disabled", () => {
      const isDisabled = shallowRef(true);
      const [states, dispose] = withScope(() => useInteractionStates({isDisabled}));

      states.onPointerenter(pointerEvent("pointerenter"));

      expect(states.isHovered.value).toBe(false);

      dispose();
    });

    it("drops a hover that was already reported when the element becomes disabled", () => {
      const isDisabled = shallowRef(false);
      const [states, dispose] = withScope(() => useInteractionStates({isDisabled}));

      states.onPointerenter(pointerEvent("pointerenter"));
      isDisabled.value = true;

      expect(states.isHovered.value).toBe(false);

      dispose();
    });
  });

  describe("press", () => {
    it("tracks a press from pointerdown to release", () => {
      const [states, dispose] = withScope(() => useInteractionStates());

      states.onPointerdown(pointerEvent("pointerdown"));

      expect(states.isPressed.value).toBe(true);

      window.dispatchEvent(pointerEvent("pointerup"));

      expect(states.isPressed.value).toBe(false);

      dispose();
    });

    it("ends a press released outside the element", () => {
      const [states, dispose] = withScope(() => useInteractionStates());

      states.onPointerdown(pointerEvent("pointerdown"));
      // Released over the document rather than the element, the drag-out case.
      document.body.dispatchEvent(pointerEvent("pointerup", {bubbles: true}));

      expect(states.isPressed.value).toBe(false);

      dispose();
    });

    it("ends a press on pointercancel", () => {
      const [states, dispose] = withScope(() => useInteractionStates());

      states.onPointerdown(pointerEvent("pointerdown"));
      window.dispatchEvent(pointerEvent("pointercancel"));

      expect(states.isPressed.value).toBe(false);

      dispose();
    });

    it("ignores a secondary button", () => {
      const [states, dispose] = withScope(() => useInteractionStates());

      states.onPointerdown(pointerEvent("pointerdown", {button: 2}));

      expect(states.isPressed.value).toBe(false);

      dispose();
    });

    it("reports no press while pending", () => {
      const [states, dispose] = withScope(() => useInteractionStates({isPending: () => true}));

      states.onPointerdown(pointerEvent("pointerdown"));

      expect(states.isPressed.value).toBe(false);

      dispose();
    });

    it("ends a press when focus leaves", () => {
      const [states, dispose] = withScope(() => useInteractionStates());

      states.onPointerdown(pointerEvent("pointerdown"));
      states.onBlur();

      expect(states.isPressed.value).toBe(false);

      dispose();
    });

    it("releases the window listeners once the press ends", () => {
      const [states, dispose] = withScope(() => useInteractionStates());

      states.onPointerdown(pointerEvent("pointerdown"));
      window.dispatchEvent(pointerEvent("pointerup"));
      // A stale listener would end a press that has not started yet.
      states.onPointerdown(pointerEvent("pointerdown"));

      expect(states.isPressed.value).toBe(true);

      dispose();
    });
  });

  describe("focus", () => {
    it("reports focus regardless of how it arrived", () => {
      const [states, dispose] = withScope(() => useInteractionStates());

      setPointerModality();
      states.onFocus();

      expect(states.isFocused.value).toBe(true);

      dispose();
    });

    it("reports focus as visible after a keyboard interaction", () => {
      const [states, dispose] = withScope(() => useInteractionStates());

      setKeyboardModality();
      states.onFocus();

      expect(states.isFocusVisible.value).toBe(true);

      dispose();
    });

    it("does not report focus as visible after a pointer interaction", () => {
      const [states, dispose] = withScope(() => useInteractionStates());

      setPointerModality();
      states.onFocus();

      expect(states.isFocusVisible.value).toBe(false);

      dispose();
    });

    it("treats a modifier chord as a shortcut rather than navigation", () => {
      const [states, dispose] = withScope(() => useInteractionStates());

      setPointerModality();
      document.dispatchEvent(new KeyboardEvent("keydown", {key: "k", metaKey: true}));
      states.onFocus();

      expect(states.isFocusVisible.value).toBe(false);

      dispose();
    });

    it("keeps focus reportable while pending, which stays focusable", () => {
      const [states, dispose] = withScope(() => useInteractionStates({isPending: () => true}));

      setKeyboardModality();
      states.onFocus();

      expect(states.isFocused.value).toBe(true);
      expect(states.isFocusVisible.value).toBe(true);

      dispose();
    });

    it("reports no focus while disabled", () => {
      const [states, dispose] = withScope(() => useInteractionStates({isDisabled: () => true}));

      states.onFocus();

      expect(states.isFocused.value).toBe(false);
      expect(states.isFocusVisible.value).toBe(false);

      dispose();
    });
  });

  describe("teardown", () => {
    it("stops tracking modality once the last consumer is gone", () => {
      const [, disposeFirst] = withScope(() => useInteractionStates());
      const [second, disposeSecond] = withScope(() => useInteractionStates());

      disposeFirst();
      // The second consumer still holds the listeners, so modality keeps updating.
      setPointerModality();
      second.onFocus();

      expect(second.isFocusVisible.value).toBe(false);

      disposeSecond();

      const [third, disposeThird] = withScope(() => useInteractionStates());

      setKeyboardModality();
      third.onFocus();

      expect(third.isFocusVisible.value).toBe(true);

      disposeThird();
    });
  });
});

describe("useFocusWithin", () => {
  it("reports focus anywhere inside the element", () => {
    const {cleanup, group} = createGroup();
    const [focus, dispose] = withScope(() => useFocusWithin());

    expect(focus.isFocusWithin.value).toBe(false);

    focus.onFocusin();

    expect(focus.isFocusWithin.value).toBe(true);

    focusOutTo(group, focus.onFocusout, null);

    expect(focus.isFocusWithin.value).toBe(false);

    dispose();
    cleanup();
  });

  it("stays focused while focus moves between two children", () => {
    // The browser reports a focusout on the way even though the group never lost focus, so
    // acting on it would flicker the ring off and on for a group with several controls.
    const {cleanup, group} = createGroup();
    const second = document.createElement("button");

    group.appendChild(second);

    const [focus, dispose] = withScope(() => useFocusWithin());

    focus.onFocusin();
    focusOutTo(group, focus.onFocusout, second);

    expect(focus.isFocusWithin.value).toBe(true);

    dispose();
    cleanup();
  });

  it("gives up focus when it leaves for an element outside", () => {
    const {cleanup, group, sibling} = createGroup();
    const [focus, dispose] = withScope(() => useFocusWithin());

    focus.onFocusin();
    focusOutTo(group, focus.onFocusout, sibling);

    expect(focus.isFocusWithin.value).toBe(false);

    dispose();
    cleanup();
  });

  it("reports focus as visible only after a keyboard interaction", () => {
    const {cleanup, group} = createGroup();
    const [focus, dispose] = withScope(() => useFocusWithin());

    setPointerModality();
    focus.onFocusin();

    expect(focus.isFocusWithin.value).toBe(true);
    expect(focus.isFocusVisible.value).toBe(false);

    focusOutTo(group, focus.onFocusout, null);
    setKeyboardModality();
    focus.onFocusin();

    expect(focus.isFocusVisible.value).toBe(true);

    dispose();
    cleanup();
  });

  it("suppresses both states while disabled", () => {
    const isDisabled = shallowRef(false);
    const [focus, dispose] = withScope(() => useFocusWithin({isDisabled: () => isDisabled.value}));

    setKeyboardModality();
    focus.onFocusin();

    expect(focus.isFocusWithin.value).toBe(true);

    // Disabling mid-focus must not leave a stale state behind the prop that suppressed it.
    isDisabled.value = true;

    expect(focus.isFocusWithin.value).toBe(false);
    expect(focus.isFocusVisible.value).toBe(false);

    dispose();
  });
});
