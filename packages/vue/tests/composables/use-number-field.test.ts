import type {UseNumberFieldReturn} from "@/composables/use-number-field";

import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import Host from "../fixtures/number-field-full-host.vue";

const mount = (props: Record<string, unknown> = {}) => {
  let field!: UseNumberFieldReturn;

  const result = renderVapor(Host, {
    props: {
      ariaLabel: "Quantity",
      locale: "en-US",
      onReady: (next: UseNumberFieldReturn) => (field = next),
      ...props,
    },
  });

  const at = (testId: string) =>
    result.container.querySelector<HTMLElement>(`[data-testid='${testId}']`)!;

  return {
    ...result,
    at,
    decrement: () => at("decrement") as HTMLButtonElement,
    field: () => field,
    increment: () => at("increment") as HTMLButtonElement,
    input: () => at("input") as HTMLInputElement,
  };
};

const type = (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event("input"));
};

const press = (element: Element, key: string) => {
  const event = new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key});

  element.dispatchEvent(event);

  return event;
};

/**
 * A paste event carrying text.
 *
 * jsdom has no `DataTransfer`, so the payload is attached to the event by hand. What a real
 * clipboard does is covered in the browser suite; this exercises the branch that decides whether
 * the paste replaces the whole field.
 */
const pasteEvent = (text: string) => {
  const event = new Event("paste", {bubbles: true, cancelable: true});

  Object.defineProperty(event, "clipboardData", {value: {getData: () => text}});

  return event;
};

const pointerPress = (button: HTMLElement) => {
  button.dispatchEvent(
    new PointerEvent("pointerdown", {bubbles: true, cancelable: true, pointerType: "mouse"}),
  );
  button.dispatchEvent(
    new PointerEvent("pointerup", {bubbles: true, cancelable: true, pointerType: "mouse"}),
  );
};

describe("useNumberField", () => {
  describe("the control it renders", () => {
    it("renders a text input rather than a number input", () => {
      // A number input rejects a currency symbol and a grouping separator, which are exactly the
      // strings this field exists to accept.
      const {input, unmount} = mount({defaultValue: 5});

      expect(input().type).toBe("text");

      unmount();
    });

    it("turns off the browser's own text assistance", () => {
      const {input, unmount} = mount();

      expect(input()).toHaveAttribute("autocomplete", "off");
      expect(input()).toHaveAttribute("autocorrect", "off");
      expect(input()).toHaveAttribute("spellcheck", "false");

      unmount();
    });

    it("describes itself as a number field", () => {
      const {input, unmount} = mount();

      expect(input()).toHaveAttribute("aria-roledescription", "Number field");

      unmount();
    });

    it("carries no spin button role", () => {
      // The spin button semantics are there for the value announcements, but the role itself is
      // dropped: VoiceOver cannot put its cursor on a spin button.
      const {input, unmount} = mount();

      expect(input()).not.toHaveAttribute("role");
      expect(input()).not.toHaveAttribute("aria-valuenow");
      expect(input()).not.toHaveAttribute("aria-valuetext");

      unmount();
    });

    it("asks for a numeric keyboard", () => {
      const {input, unmount} = mount({minValue: 0});

      expect(input()).toHaveAttribute("inputmode", "numeric");

      unmount();
    });

    it("groups the input with its steppers", () => {
      const {at, unmount} = mount();

      expect(at("group")).toHaveAttribute("role", "group");

      unmount();
    });
  });

  describe("the slot attribute the stylesheet reads", () => {
    it("renders slot=increment and slot=decrement on the buttons", () => {
      // A live CSS contract: `.number-field__group:has([slot="decrement"])` is what decides the
      // grid columns, so dropping either one silently collapses the layout.
      const {decrement, increment, unmount} = mount();

      expect(increment()).toHaveAttribute("slot", "increment");
      expect(decrement()).toHaveAttribute("slot", "decrement");

      unmount();
    });

    it("keeps the slot attribute alongside the aria wiring", () => {
      // The attribute is merged with the composable's own bag, so neither can drop the other.
      const {increment, unmount} = mount();

      expect(increment()).toHaveAttribute("slot", "increment");
      expect(increment()).toHaveAttribute("aria-controls");

      unmount();
    });
  });

  describe("the stepper buttons", () => {
    it("names each button after the field", () => {
      const {decrement, increment, unmount} = mount({ariaLabel: "Quantity"});

      expect(increment()).toHaveAttribute("aria-label", "Increase Quantity");
      expect(decrement()).toHaveAttribute("aria-label", "Decrease Quantity");

      unmount();
    });

    it("supports a name of its own on each button", () => {
      const {decrement, increment, unmount} = mount({
        decrementAriaLabel: "Fewer",
        incrementAriaLabel: "More",
      });

      expect(increment()).toHaveAttribute("aria-label", "More");
      expect(decrement()).toHaveAttribute("aria-label", "Fewer");
      // A name of its own replaces the chain rather than joining it.
      expect(increment()).not.toHaveAttribute("aria-labelledby");

      unmount();
    });

    it("points each button at the input it drives", () => {
      const {decrement, increment, input, unmount} = mount();

      expect(increment()).toHaveAttribute("aria-controls", input().id);
      expect(decrement()).toHaveAttribute("aria-controls", input().id);

      unmount();
    });

    it("keeps both buttons out of the tab order", () => {
      // The field takes the arrow keys, so a tab stop on each button would put two extra stops
      // in front of every number on a form.
      const {decrement, increment, unmount} = mount();

      expect(increment()).toHaveAttribute("tabindex", "-1");
      expect(decrement()).toHaveAttribute("tabindex", "-1");

      unmount();
    });

    it("steps the value on a pointer press", () => {
      const {field, increment, unmount} = mount({defaultValue: 5, step: 1});

      pointerPress(increment());

      expect(field().state.numberValue.value).toBe(6);

      unmount();
    });

    it("steps down on a pointer press", () => {
      const {decrement, field, unmount} = mount({defaultValue: 5, step: 1});

      pointerPress(decrement());

      expect(field().state.numberValue.value).toBe(4);

      unmount();
    });

    it("disables the button that has nowhere left to go", async () => {
      const {decrement, increment, unmount} = mount({
        defaultValue: 10,
        maxValue: 10,
        minValue: 0,
        step: 1,
      });

      await nextTick();

      expect(increment()).toBeDisabled();
      expect(decrement()).not.toBeDisabled();

      unmount();
    });

    it("disables both buttons on a read-only field", async () => {
      const {decrement, increment, unmount} = mount({defaultValue: 5, isReadOnly: true});

      await nextTick();

      expect(increment()).toBeDisabled();
      expect(decrement()).toBeDisabled();

      unmount();
    });
  });

  describe("the keyboard", () => {
    it("steps with the arrow keys", () => {
      const {field, input, unmount} = mount({defaultValue: 5, step: 1});

      press(input(), "ArrowUp");
      expect(field().state.numberValue.value).toBe(6);

      press(input(), "ArrowDown");
      expect(field().state.numberValue.value).toBe(5);

      unmount();
    });

    it("jumps to the ends of the range with Home and End", () => {
      const {field, input, unmount} = mount({
        defaultValue: 5,
        maxValue: 10,
        minValue: 2,
        step: 1,
      });

      press(input(), "End");
      expect(field().state.numberValue.value).toBe(10);

      press(input(), "Home");
      expect(field().state.numberValue.value).toBe(2);

      unmount();
    });

    it("steps with the page keys", () => {
      const {field, input, unmount} = mount({defaultValue: 5, step: 1});

      press(input(), "PageUp");
      expect(field().state.numberValue.value).toBe(6);

      unmount();
    });

    it("swallows the arrow keys so the caret does not move as well", () => {
      const {input, unmount} = mount({defaultValue: 5, step: 1});

      expect(press(input(), "ArrowUp").defaultPrevented).toBe(true);

      unmount();
    });

    it("claims Home and End even with no range to jump to", () => {
      // Matching react-aria: the field always supplies both handlers, so the keys are always
      // taken and the value simply does not move. The consequence is that Home and End never
      // reach the caret in a number field, in either framework.
      const {field, input, unmount} = mount({defaultValue: 5});

      expect(press(input(), "Home").defaultPrevented).toBe(true);
      expect(press(input(), "End").defaultPrevented).toBe(true);
      expect(field().state.numberValue.value).toBe(5);

      unmount();
    });

    it("commits on Enter without taking the key from the form", () => {
      // Enter both normalises the field and submits the form around it; preventing it would stop
      // the submit the user asked for.
      const {field, input, unmount} = mount();

      type(input(), "12.7");
      const event = press(input(), "Enter");

      expect(field().state.numberValue.value).toBe(12.7);
      expect(event.defaultPrevented).toBe(false);

      unmount();
    });

    it("does not step a disabled or read-only field from the keyboard", () => {
      const disabled = mount({defaultValue: 5, isDisabled: true, step: 1});

      press(disabled.input(), "ArrowUp");
      expect(disabled.field().state.numberValue.value).toBe(5);
      disabled.unmount();

      const readOnly = mount({defaultValue: 5, isReadOnly: true, step: 1});

      press(readOnly.input(), "ArrowUp");
      expect(readOnly.field().state.numberValue.value).toBe(5);
      readOnly.unmount();
    });
  });

  describe("typing and committing", () => {
    it("keeps text that could still become a number", () => {
      const {field, input, unmount} = mount();

      type(input(), "-");

      expect(field().state.inputValue.value).toBe("-");

      unmount();
    });

    it("refuses text that could never become a number", async () => {
      // The last line of defence behind `beforeinput`, which jsdom does not deliver.
      const {field, input, unmount} = mount({defaultValue: 5});

      type(input(), "abc");
      await nextTick();

      expect(field().state.inputValue.value).toBe("5");
      expect(input().value).toBe("5");

      unmount();
    });

    it("normalises the text when focus leaves", async () => {
      const {input, unmount} = mount({formatOptions: {currency: "USD", style: "currency"}});

      type(input(), "1234.5");
      input().dispatchEvent(new FocusEvent("blur"));
      await nextTick();

      expect(input().value).toBe("$1,234.50");

      unmount();
    });

    it("commits a paste that replaces the whole field", async () => {
      const {field, input, unmount} = mount();

      input().value = "";
      input().setSelectionRange(0, 0);

      const event = pasteEvent(" 42 ");

      input().dispatchEvent(event);
      await nextTick();

      expect(event.defaultPrevented).toBe(true);
      expect(field().state.numberValue.value).toBe(42);

      unmount();
    });

    it("leaves a partial paste to the input", () => {
      // Working out where the caret lands inside a partly replaced string is where this kind of
      // code goes wrong, so it is left to the event that can already refuse bad characters.
      const {input, unmount} = mount({defaultValue: 5});

      input().setSelectionRange(0, 0);

      const event = pasteEvent("7");

      input().dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);

      unmount();
    });
  });

  describe("focus within", () => {
    it("reports focus reaching anything in the group", async () => {
      const {at, field, input, unmount} = mount();

      input().dispatchEvent(new FocusEvent("focus"));
      expect(field().isFocusWithin.value).toBe(true);

      at("group").dispatchEvent(new FocusEvent("focusout", {relatedTarget: null}));
      expect(field().isFocusWithin.value).toBe(false);

      unmount();
    });

    it("stays focused while focus moves between the input and a button", () => {
      const {at, field, increment, input, unmount} = mount();

      input().dispatchEvent(new FocusEvent("focus"));

      const event = new FocusEvent("focusout", {relatedTarget: increment()});

      at("group").dispatchEvent(event);

      expect(field().isFocusWithin.value).toBe(true);

      unmount();
    });

    it("never reports focus on a disabled field", () => {
      const {field, input, unmount} = mount({isDisabled: true});

      input().dispatchEvent(new FocusEvent("focus"));

      expect(field().isFocusWithin.value).toBe(false);

      unmount();
    });
  });

  describe("state and validation", () => {
    it("reports its own state on the input", () => {
      const {input, unmount} = mount({isReadOnly: true});

      expect(input()).toHaveAttribute("aria-readonly", "true");

      unmount();
    });

    it("marks the input required under aria behaviour only", () => {
      const aria = mount({isRequired: true, validationBehavior: "aria"});

      expect(aria.input()).toHaveAttribute("aria-required", "true");
      expect(aria.input()).not.toHaveAttribute("required");
      aria.unmount();

      const native = mount({isRequired: true});

      expect(native.input()).toHaveAttribute("required");
      expect(native.input()).not.toHaveAttribute("aria-required");
      native.unmount();
    });

    it("reports invalid on the input and the group", async () => {
      const {at, input, unmount} = mount({isInvalid: true});

      await nextTick();

      expect(input()).toHaveAttribute("aria-invalid", "true");
      expect(at("group")).toHaveAttribute("aria-invalid", "true");

      unmount();
    });

    it("borrows the browser's range message under validate behaviour", async () => {
      // The point is the message: the browser writes one in the user's own language, so nothing
      // here has to ship a translation for "must be less than or equal to".
      // `aria` behaviour, because under `native` the borrowed verdict is held back until a
      // commit reveals it — that path needs a form, and is covered where one is involved.
      const {field, input, unmount} = mount({
        commitBehavior: "validate",
        maxValue: 10,
        minValue: 0,
        validationBehavior: "aria",
      });

      type(input(), "50");
      field().state.commit();
      await nextTick();
      await nextTick();

      expect(field().state.displayValidation.value.isInvalid).toBe(true);
      expect(field().state.displayValidation.value.validationDetails.rangeOverflow).toBe(true);
      expect(field().state.displayValidation.value.validationErrors[0]).toBeTruthy();

      unmount();
    });

    it("leaves the range alone under snap behaviour, having already corrected it", async () => {
      const {field, input, unmount} = mount({maxValue: 10, minValue: 0});

      type(input(), "50");
      field().state.commit();
      await nextTick();

      expect(field().state.numberValue.value).toBe(10);
      expect(field().state.realtimeValidation.value.isInvalid).toBe(false);

      unmount();
    });
  });

  describe("the wheel", () => {
    it("steps the value while focus is inside", async () => {
      const {field, input, unmount} = mount({defaultValue: 5, step: 1});

      input().dispatchEvent(new FocusEvent("focus"));
      await nextTick();

      input().dispatchEvent(new WheelEvent("wheel", {cancelable: true, deltaY: 10}));

      expect(field().state.numberValue.value).toBe(6);

      unmount();
    });

    it("ignores the wheel while focus is elsewhere", async () => {
      // Otherwise scrolling a page past a number field would quietly rewrite it.
      const {field, input, unmount} = mount({defaultValue: 5, step: 1});

      await nextTick();
      input().dispatchEvent(new WheelEvent("wheel", {cancelable: true, deltaY: 10}));

      expect(field().state.numberValue.value).toBe(5);

      unmount();
    });

    it("ignores a mostly sideways gesture", async () => {
      // A trackpad reports both axes at once; a sideways scroll past the field is not someone
      // asking to change the number.
      const {field, input, unmount} = mount({defaultValue: 5, step: 1});

      input().dispatchEvent(new FocusEvent("focus"));
      await nextTick();

      input().dispatchEvent(new WheelEvent("wheel", {cancelable: true, deltaX: 20, deltaY: 5}));

      expect(field().state.numberValue.value).toBe(5);

      unmount();
    });

    it("ignores a pinch zoom", async () => {
      // A wheel gesture with the ctrl key held is a zoom, not a scroll. The browser reports it
      // with a vertical delta like any other, so without the check a pinch on a trackpad would
      // run the number up while the page zoomed.
      const {field, input, unmount} = mount({defaultValue: 5, step: 1});

      input().dispatchEvent(new FocusEvent("focus"));
      await nextTick();

      input().dispatchEvent(new WheelEvent("wheel", {cancelable: true, ctrlKey: true, deltaY: 10}));

      expect(field().state.numberValue.value).toBe(5);

      unmount();
    });

    it("ignores the wheel when it is turned off", async () => {
      const {field, input, unmount} = mount({
        defaultValue: 5,
        isWheelDisabled: true,
        step: 1,
      });

      input().dispatchEvent(new FocusEvent("focus"));
      await nextTick();
      input().dispatchEvent(new WheelEvent("wheel", {cancelable: true, deltaY: 10}));

      expect(field().state.numberValue.value).toBe(5);

      unmount();
    });
  });

  describe("reporting changes", () => {
    it("reports a step to its owner", () => {
      const onChange = vi.fn();
      const {increment, unmount} = mount({defaultValue: 5, onChange, step: 1});

      pointerPress(increment());

      expect(onChange).toHaveBeenCalledWith(6);

      unmount();
    });

    it("keeps a controlled field at the value its owner holds", async () => {
      const {increment, input, unmount} = mount({step: 1, value: 5});

      pointerPress(increment());
      await nextTick();

      expect(input().value).toBe("5");

      unmount();
    });
  });
});
