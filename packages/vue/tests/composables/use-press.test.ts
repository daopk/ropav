import type {PressEvent} from "@/composables/use-press";

import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {effectScope, nextTick, shallowRef} from "vue";

import {usePress} from "@/composables/use-press";

/** Run a composable in a disposable scope, mirroring a component lifetime. */
const withScope = <T>(setup: () => T): [T, () => void] => {
  const scope = effectScope();
  const result = scope.run(setup) as T;

  return [result, () => scope.stop()];
};

/**
 * A real element in the document is needed rather than a bare event object: the press machine
 * reads `currentTarget`, checks containment, and attaches its release listeners to the
 * element's own document.
 */
const createButton = () => {
  const element = document.createElement("button");

  element.type = "button";

  return element;
};

const setup = (
  options: Parameters<typeof usePress>[0] = {},
  element: HTMLElement = createButton(),
) => {
  document.body.appendChild(element);

  const events: string[] = [];
  const received: PressEvent[] = [];
  const record = (type: string) => (event: PressEvent) => {
    events.push(type);
    received.push(event);
  };

  const [press, dispose] = withScope(() =>
    usePress({
      onPress: record("press"),
      onPressEnd: record("pressend"),
      onPressStart: record("pressstart"),
      onPressUp: record("pressup"),
      ...options,
    }),
  );

  // Bound the way a template binds them, so `currentTarget` is the element itself.
  element.addEventListener("pointerdown", (event) => press.handlers.onPointerdown(event));
  element.addEventListener("pointerup", (event) => press.handlers.onPointerup(event));
  element.addEventListener("click", (event) => press.handlers.onClick(event));
  element.addEventListener("keydown", (event) => press.handlers.onKeydown(event));
  element.addEventListener("mousedown", (event) => press.handlers.onMousedown(event));

  return {
    dispose: () => {
      dispose();
      element.remove();
    },
    element,
    events,
    press,
    received,
  };
};

const pointer = (type: string, init: PointerEventInit = {}) =>
  new PointerEvent(type, {
    bubbles: true,
    button: 0,
    height: 1,
    isPrimary: true,
    pointerId: 1,
    pointerType: "mouse",
    width: 1,
    ...init,
  });

/** A click with pointer data behind it, as a real mouse release produces. */
const realClick = () => new MouseEvent("click", {bubbles: true, button: 0, detail: 1});

describe("usePress", () => {
  describe("mouse", () => {
    it("reports the press only once the click lands", () => {
      const {dispose, element, events} = setup();

      element.dispatchEvent(pointer("pointerdown"));

      // The press has started but not completed: a release elsewhere must still be able to
      // abandon it.
      expect(events).toEqual(["pressstart"]);

      element.dispatchEvent(pointer("pointerup"));
      element.dispatchEvent(realClick());

      expect(events).toEqual(["pressstart", "pressup", "pressend", "press"]);

      dispose();
    });

    it("exposes the pressed state between down and click", () => {
      const {dispose, element, press} = setup();

      expect(press.isPressed.value).toBe(false);

      element.dispatchEvent(pointer("pointerdown"));

      expect(press.isPressed.value).toBe(true);

      element.dispatchEvent(pointer("pointerup"));
      element.dispatchEvent(realClick());

      expect(press.isPressed.value).toBe(false);

      dispose();
    });

    it("ends the press without activating it when the pointer leaves the element", () => {
      const {dispose, element, events, press} = setup();

      element.dispatchEvent(pointer("pointerdown"));
      press.handlers.onPointerleave(pointer("pointerleave"));

      // `:active` and a bare click handler both get this wrong: dragging off a control and
      // releasing must not activate it.
      expect(events).toEqual(["pressstart", "pressend"]);
      expect(press.isPressed.value).toBe(false);

      dispose();
    });

    it("restarts the press when the pointer comes back", () => {
      const {dispose, element, events, press} = setup();

      element.dispatchEvent(pointer("pointerdown"));
      press.handlers.onPointerleave(pointer("pointerleave"));
      press.handlers.onPointerenter(pointer("pointerenter"));

      expect(events).toEqual(["pressstart", "pressend", "pressstart"]);
      expect(press.isPressed.value).toBe(true);

      dispose();
    });

    it("abandons the press when it is released outside the element", () => {
      const {dispose, element, events} = setup();

      element.dispatchEvent(pointer("pointerdown"));
      document.dispatchEvent(pointer("pointerup", {bubbles: false}));

      expect(events).toEqual(["pressstart", "pressend"]);

      dispose();
    });

    it("ignores a secondary button", () => {
      const {dispose, element, events} = setup();

      element.dispatchEvent(pointer("pointerdown", {button: 2}));

      expect(events).toEqual([]);

      dispose();
    });

    it("reports the pointer type that started the press", () => {
      const {dispose, element, received} = setup();

      element.dispatchEvent(pointer("pointerdown", {pointerType: "touch"}));

      expect(received[0]!.pointerType).toBe("touch");

      dispose();
    });
  });

  describe("keyboard", () => {
    it("presses on Enter and completes on release", () => {
      const {dispose, element, events, received} = setup();

      element.focus();
      element.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: "Enter"}));

      expect(events).toEqual(["pressstart"]);

      element.dispatchEvent(new KeyboardEvent("keyup", {bubbles: true, key: "Enter"}));

      expect(events).toEqual(["pressstart", "pressup", "pressend", "press"]);
      expect(received.map((event) => event.pointerType)).toEqual(Array(4).fill("keyboard"));

      dispose();
    });

    it("blocks the default action so Space does not scroll the page", () => {
      const {dispose, element} = setup();
      const event = new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key: " "});

      element.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);

      dispose();
    });

    it("leaves native link activation to the browser and preserves modifier keys", () => {
      const element = document.createElement("a");

      element.href = "#target";

      const {dispose, events, received} = setup({}, element);
      const keydown = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        key: "Enter",
      });
      const keyup = new KeyboardEvent("keyup", {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        key: "Enter",
      });

      element.dispatchEvent(keydown);
      element.dispatchEvent(keyup);

      expect(keydown.defaultPrevented).toBe(false);
      expect(keyup.defaultPrevented).toBe(false);
      expect(events).toEqual(["pressstart", "pressup", "pressend", "press"]);
      expect(received.every((event) => event.ctrlKey)).toBe(true);

      dispose();
    });

    it("keeps the macOS Enter context-menu shortcut available", () => {
      const platform = vi.spyOn(navigator, "platform", "get").mockReturnValue("MacIntel");
      const element = document.createElement("div");
      const {dispose} = setup({}, element);
      const keydown = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "Enter",
      });
      const keyup = new KeyboardEvent("keyup", {
        bubbles: true,
        cancelable: true,
        key: "Enter",
      });

      element.dispatchEvent(keydown);
      element.dispatchEvent(keyup);

      expect(keydown.defaultPrevented).toBe(false);
      expect(keyup.defaultPrevented).toBe(false);

      platform.mockRestore();
      dispose();
    });

    it("prevents Enter defaults on a custom pressable outside macOS", () => {
      const platform = vi.spyOn(navigator, "platform", "get").mockReturnValue("Linux x86_64");
      const element = document.createElement("div");
      const {dispose} = setup({}, element);
      const keydown = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "Enter",
      });
      const keyup = new KeyboardEvent("keyup", {
        bubbles: true,
        cancelable: true,
        key: "Enter",
      });

      element.dispatchEvent(keydown);
      element.dispatchEvent(keyup);

      expect(keydown.defaultPrevented).toBe(true);
      expect(keyup.defaultPrevented).toBe(true);

      platform.mockRestore();
      dispose();
    });

    it("ignores a repeated key so a held key presses once", () => {
      const {dispose, element, events} = setup();

      element.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: "Enter"}));
      element.dispatchEvent(
        new KeyboardEvent("keydown", {bubbles: true, key: "Enter", repeat: true}),
      );

      expect(events).toEqual(["pressstart"]);

      dispose();
    });

    it("listens for the release on the document, so focus may move first", () => {
      const {dispose, element, events} = setup();
      const elsewhere = document.createElement("input");

      document.body.appendChild(elsewhere);

      element.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: "Enter"}));
      // A menu trigger hands focus to its menu on the way down, so the release never reaches
      // the element the press started on.
      elsewhere.focus();
      elsewhere.dispatchEvent(new KeyboardEvent("keyup", {bubbles: true, key: "Enter"}));

      // Released away from the element: the press ends without activating.
      expect(events).toEqual(["pressstart", "pressend"]);

      elsewhere.remove();
      dispose();
    });

    it("leaves other keys alone", () => {
      const {dispose, element, events} = setup();

      element.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: "ArrowDown"}));

      expect(events).toEqual([]);

      dispose();
    });
  });

  describe("assistive technology", () => {
    it("plays out the whole press on a click with no pointer behind it", () => {
      const {dispose, element, events, received} = setup();

      // What a screen reader activation and `element.click()` both produce.
      element.dispatchEvent(new MouseEvent("click", {bubbles: true, button: 0, detail: 0}));

      expect(events).toEqual(["pressstart", "pressup", "pressend", "press"]);
      expect(received.map((event) => event.pointerType)).toEqual(Array(4).fill("virtual"));

      dispose();
    });

    it("treats a zero-sized pointer as virtual and leaves it to the click", () => {
      const {dispose, element, events} = setup();

      // Safari on iOS reports screen-reader activations this way, with coordinates and a
      // target that cannot be trusted.
      element.dispatchEvent(pointer("pointerdown", {height: 0, width: 0}));

      expect(events).toEqual([]);

      element.dispatchEvent(new MouseEvent("click", {bubbles: true, button: 0, detail: 0}));

      expect(events).toEqual(["pressstart", "pressup", "pressend", "press"]);

      dispose();
    });
  });

  describe("propagation", () => {
    it("stops the event so an enclosing pressable does not also press", () => {
      const {dispose, element} = setup();
      const outer = document.createElement("div");

      element.parentElement!.appendChild(outer);
      outer.appendChild(element);

      const seen = vi.fn();

      outer.addEventListener("pointerdown", seen);
      element.dispatchEvent(pointer("pointerdown"));

      expect(seen).not.toHaveBeenCalled();

      outer.remove();
      dispose();
    });

    it("keeps the event bubbling when the handler asks it to", () => {
      const {dispose, element} = setup({
        onPressStart: (event) => event.continuePropagation(),
      });
      const outer = document.createElement("div");

      element.parentElement!.appendChild(outer);
      outer.appendChild(element);

      const seen = vi.fn();

      outer.addEventListener("pointerdown", seen);
      element.dispatchEvent(pointer("pointerdown"));

      // This is what lets a long-press detector observe a press without swallowing it.
      expect(seen).toHaveBeenCalledTimes(1);

      outer.remove();
      dispose();
    });
  });

  describe("disabled", () => {
    it("reports nothing while disabled", () => {
      const {dispose, element, events} = setup({isDisabled: true});

      element.dispatchEvent(pointer("pointerdown"));
      element.dispatchEvent(realClick());

      expect(events).toEqual([]);

      dispose();
    });

    it("releases a press that was in flight when it became disabled", async () => {
      const isDisabled = shallowRef(false);
      const {dispose, element, events, press} = setup({isDisabled});

      element.dispatchEvent(pointer("pointerdown"));
      isDisabled.value = true;
      await nextTick();

      // A stuck pressed state would keep the control looking active for good, with its
      // release listeners still on the document.
      expect(events).toEqual(["pressstart", "pressend"]);
      expect(press.isPressed.value).toBe(false);

      dispose();
    });
  });

  describe("forced pressed state", () => {
    it("stays pressed for as long as the caller says so", () => {
      const isPressed = shallowRef(true);
      const {dispose, press} = setup({isPressed});

      // A menu trigger looks pressed for as long as its menu is open, with no pointer down.
      expect(press.isPressed.value).toBe(true);

      isPressed.value = false;

      expect(press.isPressed.value).toBe(false);

      dispose();
    });
  });

  describe("focus", () => {
    it("blocks the default focus on press when asked", () => {
      const {dispose, element} = setup({preventFocusOnPress: true});
      const event = new MouseEvent("mousedown", {bubbles: true, button: 0, cancelable: true});

      element.dispatchEvent(event);

      // The control hands focus somewhere else itself; letting the browser focus it first
      // would make the hand-off visible as a flash.
      expect(event.defaultPrevented).toBe(true);

      dispose();
    });

    it("leaves the default focus alone otherwise", () => {
      const {dispose, element} = setup();
      const event = new MouseEvent("mousedown", {bubbles: true, button: 0, cancelable: true});

      element.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);

      dispose();
    });
  });

  describe("touch", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("synthesises the click that iOS withholds after a long press", () => {
      const {dispose, element, events} = setup();

      element.dispatchEvent(pointer("pointerdown", {pointerType: "touch"}));
      element.dispatchEvent(pointer("pointerup", {pointerType: "touch"}));

      expect(events).toEqual(["pressstart"]);

      vi.advanceTimersByTime(100);

      // Without this the press would never complete on touch, because the press is otherwise
      // finished by a click that never arrives.
      expect(events).toEqual(["pressstart", "pressup", "pressend", "press"]);

      dispose();
    });

    it("does not synthesise a second click when the real one arrives", () => {
      const {dispose, element, events} = setup();

      element.dispatchEvent(pointer("pointerdown", {pointerType: "touch"}));
      element.dispatchEvent(pointer("pointerup", {pointerType: "touch"}));
      element.dispatchEvent(realClick());

      expect(events).toEqual(["pressstart", "pressup", "pressend", "press"]);

      vi.advanceTimersByTime(100);

      expect(events).toEqual(["pressstart", "pressup", "pressend", "press"]);

      dispose();
    });
  });
});
