import {describe, expect, it} from "vitest";
import {effectScope} from "vue";

import {useDialogTrigger} from "@/composables/use-dialog-trigger";
import {useOverlayTriggerState} from "@/composables/use-overlay-trigger-state";

/** Run a composable in a disposable scope, mirroring a component lifetime. */
const withScope = <T>(setup: () => T): [T, () => void] => {
  const scope = effectScope();
  const result = scope.run(setup) as T;

  return [result, () => scope.stop()];
};

const pointer = (type: string) =>
  new PointerEvent(type, {
    bubbles: true,
    button: 0,
    height: 1,
    isPrimary: true,
    pointerId: 1,
    pointerType: "mouse",
    width: 1,
  });

/** A click with pointer data behind it, as a real mouse release produces. */
const realClick = () => new MouseEvent("click", {bubbles: true, button: 0, detail: 1});

/**
 * A real element in the document, wired the way a template wires it: the press machine reads
 * `currentTarget` and attaches its release listeners to the element's own document.
 */
const setup = (options: Parameters<typeof useDialogTrigger>[0] = {}) => {
  const element = document.createElement("button");

  document.body.appendChild(element);

  const [{state, trigger}, dispose] = withScope(() => {
    const state = useOverlayTriggerState();

    return {state, trigger: useDialogTrigger(options, state)};
  });

  trigger.responder.registerElement(element);

  for (const type of ["pointerdown", "pointerup", "click", "keydown"] as const) {
    element.addEventListener(type, (event) => {
      const handlers = trigger.responder.handlers.value;

      if (type === "pointerdown") handlers.onPointerdown(event as PointerEvent);
      if (type === "pointerup") handlers.onPointerup(event as PointerEvent);
      if (type === "click") handlers.onClick(event as MouseEvent);
      if (type === "keydown") handlers.onKeydown(event as KeyboardEvent);
    });
  }

  const press = () => {
    element.dispatchEvent(pointer("pointerdown"));
    element.dispatchEvent(pointer("pointerup"));
    element.dispatchEvent(realClick());
  };

  return {
    dispose: () => {
      dispose();
      element.remove();
    },
    element,
    press,
    state,
    trigger,
  };
};

describe("useDialogTrigger", () => {
  it("toggles the overlay on press", () => {
    const {dispose, press, state} = setup();

    press();

    expect(state.isOpen.value).toBe(true);

    press();

    expect(state.isOpen.value).toBe(false);

    dispose();
  });

  it("exposes the accessibility wiring as responder attributes", () => {
    const {dispose, press, trigger} = setup();

    expect(trigger.responder.attrs.value["id"]).toBe(trigger.triggerId.value);
    expect(trigger.responder.attrs.value["aria-expanded"]).toBe(false);
    expect(trigger.responder.attrs.value["aria-controls"]).toBeUndefined();
    // Screen readers announce most `aria-haspopup` values as "menu", so a dialog says nothing.
    expect(trigger.responder.attrs.value["aria-haspopup"]).toBeUndefined();

    press();

    expect(trigger.responder.attrs.value["aria-expanded"]).toBe(true);
    // Only while the overlay exists: an idref naming nothing is worse than none.
    expect(trigger.responder.attrs.value["aria-controls"]).toBe(trigger.overlayId.value);

    dispose();
  });

  it("names the trigger and the overlay separately", () => {
    const {dispose, trigger} = setup();

    // The trigger's id is the dialog's labelling fallback, so it cannot be the dialog's own id.
    expect(trigger.triggerId.value).not.toBe(trigger.overlayId.value);

    dispose();
  });

  it("stays pressed for as long as the overlay is open", () => {
    const {dispose, press, trigger} = setup();

    expect(trigger.responder.isPressed.value).toBe(false);

    press();

    // The pointer has lifted, but the trigger still owns something on screen.
    expect(trigger.responder.isPressed.value).toBe(true);

    press();

    expect(trigger.responder.isPressed.value).toBe(false);

    dispose();
  });

  it("supports being disabled", () => {
    const {dispose, press, state} = setup({isDisabled: true});

    press();

    expect(state.isOpen.value).toBe(false);

    dispose();
  });

  it("reports the element the overlay is positioned against", () => {
    const {dispose, element, trigger} = setup();

    expect(trigger.triggerElement.value).toBe(element);

    trigger.responder.registerElement(null);

    expect(trigger.triggerElement.value).toBeNull();

    dispose();
  });
});
