import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import Fixture from "./fixtures.vue";

const renderNumberField = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, {props: {locale: "en-US", ...props}});
  const root = result.container.querySelector('[data-slot="number-field"]');

  if (!root) throw new Error("field not rendered");

  const slot = (name: string) =>
    result.container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

  return {
    ...result,
    decrement: () => slot("number-field-decrement-button") as HTMLButtonElement,
    group: () => slot("number-field-group"),
    increment: () => slot("number-field-increment-button") as HTMLButtonElement,
    input: () => slot("number-field-input") as HTMLInputElement,
    root,
    slot,
  };
};

const pointerPress = (button: HTMLElement) => {
  button.dispatchEvent(
    new PointerEvent("pointerdown", {bubbles: true, cancelable: true, pointerType: "mouse"}),
  );
  button.dispatchEvent(
    new PointerEvent("pointerup", {bubbles: true, cancelable: true, pointerType: "mouse"}),
  );
};

const type = (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event("input"));
};

describe("NumberField", () => {
  describe("structure", () => {
    it("renders every part with its data-slot", () => {
      const {root, slot, unmount} = renderNumberField({withDescription: true});

      expect(root).toHaveAttribute("data-slot", "number-field");
      expect(slot("label")).not.toBeNull();
      expect(slot("number-field-group")).not.toBeNull();
      expect(slot("number-field-decrement-button")).not.toBeNull();
      expect(slot("number-field-input")).not.toBeNull();
      expect(slot("number-field-increment-button")).not.toBeNull();
      expect(slot("description")).not.toBeNull();

      unmount();
    });

    it("renders the BEM classes of each part", () => {
      const {decrement, group, increment, input, root, unmount} = renderNumberField();

      expect(root).toHaveClass("number-field", "number-field--primary");
      expect(group()).toHaveClass("number-field__group");
      expect(input()).toHaveClass("number-field__input");
      expect(increment()).toHaveClass("number-field__increment-button");
      expect(decrement()).toHaveClass("number-field__decrement-button");

      unmount();
    });

    it("styles the steppers as steppers, not as buttons", () => {
      // The stylesheet builds these from scratch rather than on top of `.button`, so picking up
      // the button class would fight it.
      const {decrement, increment, unmount} = renderNumberField();

      expect(increment()).not.toHaveClass("button");
      expect(decrement()).not.toHaveClass("button");

      unmount();
    });

    it("renders the built-in glyph in each stepper", () => {
      const {decrement, increment, unmount} = renderNumberField();

      expect(
        increment().querySelector('[data-slot="number-field-increment-button-icon"]'),
      ).not.toBeNull();
      expect(
        decrement().querySelector('[data-slot="number-field-decrement-button-icon"]'),
      ).not.toBeNull();

      unmount();
    });

    it("supports custom content in each stepper", () => {
      const {container, decrement, increment, unmount} = renderNumberField({customIcons: true});

      expect(container.querySelector("[data-testid='custom-increment']")).not.toBeNull();
      expect(container.querySelector("[data-testid='custom-decrement']")).not.toBeNull();
      expect(
        increment().querySelector('[data-slot="number-field-increment-button-icon"]'),
      ).toBeNull();
      expect(
        decrement().querySelector('[data-slot="number-field-decrement-button-icon"]'),
      ).toBeNull();

      unmount();
    });

    it("supports a class on the root", () => {
      const {root, unmount} = renderNumberField({class: "w-40"});

      expect(root).toHaveClass("number-field", "w-40");

      unmount();
    });
  });

  describe("the slot attribute the layout depends on", () => {
    it("renders slot=increment and slot=decrement on the steppers", () => {
      // `.number-field__group:has([slot="decrement"])` is what gives the group its columns, so
      // losing either attribute collapses the layout without any other symptom.
      const {decrement, increment, unmount} = renderNumberField();

      expect(increment()).toHaveAttribute("slot", "increment");
      expect(decrement()).toHaveAttribute("slot", "decrement");

      unmount();
    });

    it("finds the slot attribute from the group, as the stylesheet does", () => {
      const {group, unmount} = renderNumberField();

      expect(group().querySelector('[slot="increment"]')).not.toBeNull();
      expect(group().querySelector('[slot="decrement"]')).not.toBeNull();

      unmount();
    });

    it("leaves the attribute out when a stepper is not rendered", () => {
      const {group, unmount} = renderNumberField({withDecrement: false});

      expect(group().querySelector('[slot="decrement"]')).toBeNull();
      expect(group().querySelector('[slot="increment"]')).not.toBeNull();

      unmount();
    });

    it("keeps the slot attribute alongside the aria wiring", () => {
      const {increment, unmount} = renderNumberField();

      expect(increment()).toHaveAttribute("slot", "increment");
      expect(increment()).toHaveAttribute("aria-controls");
      expect(increment()).toHaveAttribute("aria-label");

      unmount();
    });
  });

  describe("the control", () => {
    it("renders a text input with the number formatted", () => {
      const {input, unmount} = renderNumberField({
        defaultValue: 1234.5,
        formatOptions: {currency: "USD", style: "currency"},
      });

      expect(input().type).toBe("text");
      expect(input()).toHaveValue("$1,234.50");

      unmount();
    });

    it("points the label at the control", () => {
      const {input, slot, unmount} = renderNumberField();

      expect(slot("label")).toHaveAttribute("for", input().id);

      unmount();
    });

    it("names the steppers after the field's own label", () => {
      const {decrement, increment, unmount} = renderNumberField();

      expect(increment()).toHaveAttribute("aria-labelledby");
      expect(increment()).toHaveAttribute("aria-label", "Increase");
      expect(decrement()).toHaveAttribute("aria-label", "Decrease");

      unmount();
    });

    it("names the steppers after an accessible name given directly", () => {
      const {decrement, increment, unmount} = renderNumberField({withLabel: false});

      expect(increment()).toHaveAttribute("aria-label", "Increase Quantity");
      expect(decrement()).toHaveAttribute("aria-label", "Decrease Quantity");

      unmount();
    });

    it("supports a name of its own on each stepper", () => {
      const {decrement, increment, unmount} = renderNumberField({
        decrementAriaLabel: "Fewer",
        incrementAriaLabel: "More",
      });

      expect(increment()).toHaveAttribute("aria-label", "More");
      expect(decrement()).toHaveAttribute("aria-label", "Fewer");

      unmount();
    });
  });

  describe("submitting", () => {
    it("submits the number, not the formatted text", () => {
      // The visible input carries a currency symbol and grouping separators, which is not what a
      // server wants to parse — so a hidden input carries the number itself.
      const {container, unmount} = renderNumberField({
        defaultValue: 1234.5,
        formatOptions: {currency: "USD", style: "currency"},
        name: "price",
      });
      const hidden = container.querySelector<HTMLInputElement>("input[type='hidden']")!;

      expect(hidden.name).toBe("price");
      expect(hidden.value).toBe("1234.5");

      unmount();
    });

    it("keeps the name off the visible input", () => {
      const {input, unmount} = renderNumberField({defaultValue: 5, name: "price"});

      expect(input()).not.toHaveAttribute("name");

      unmount();
    });

    it("submits nothing when there is no number", () => {
      const {container, unmount} = renderNumberField({name: "price"});
      const hidden = container.querySelector<HTMLInputElement>("input[type='hidden']")!;

      expect(hidden.value).toBe("");

      unmount();
    });

    it("renders no hidden input when the field has no name", () => {
      const {container, unmount} = renderNumberField({defaultValue: 5});

      expect(container.querySelector("input[type='hidden']")).toBeNull();

      unmount();
    });

    it("follows the number as it changes", async () => {
      const {container, increment, unmount} = renderNumberField({
        defaultValue: 5,
        name: "price",
        step: 1,
      });

      pointerPress(increment());
      await nextTick();

      expect(container.querySelector<HTMLInputElement>("input[type='hidden']")!.value).toBe("6");

      unmount();
    });
  });

  describe("stepping", () => {
    it("steps the value from the buttons", async () => {
      const {increment, input, unmount} = renderNumberField({defaultValue: 5, step: 1});

      pointerPress(increment());
      await nextTick();

      expect(input()).toHaveValue("6");

      unmount();
    });

    it("steps down from the decrement button", async () => {
      const {decrement, input, unmount} = renderNumberField({defaultValue: 5, step: 1});

      pointerPress(decrement());
      await nextTick();

      expect(input()).toHaveValue("4");

      unmount();
    });

    it("hands focus to the input when a mouse presses a stepper", () => {
      // So typing continues where the user is looking, rather than on a button.
      const {increment, input, unmount} = renderNumberField({defaultValue: 5, step: 1});

      increment().dispatchEvent(
        new PointerEvent("pointerdown", {bubbles: true, cancelable: true, pointerType: "mouse"}),
      );

      expect(input()).toHaveFocus();

      unmount();
    });

    it("keeps focus on the button for a touch", () => {
      // Otherwise the software keyboard slides up over the button being tapped.
      const {increment, input, unmount} = renderNumberField({defaultValue: 5, step: 1});

      increment().dispatchEvent(
        new PointerEvent("pointerdown", {bubbles: true, cancelable: true, pointerType: "touch"}),
      );

      expect(input()).not.toHaveFocus();

      unmount();
    });

    it("reports the press so the stylesheet can scale the button", async () => {
      const {increment, unmount} = renderNumberField({defaultValue: 5, step: 1});

      increment().dispatchEvent(
        new PointerEvent("pointerdown", {bubbles: true, cancelable: true, pointerType: "mouse"}),
      );
      await nextTick();

      expect(increment()).toHaveAttribute("data-pressed", "true");

      unmount();
    });

    it("disables the stepper that has nowhere left to go", async () => {
      const {decrement, increment, unmount} = renderNumberField({
        defaultValue: 10,
        maxValue: 10,
        minValue: 0,
        step: 1,
      });

      await nextTick();

      expect(increment()).toBeDisabled();
      expect(increment()).toHaveAttribute("data-disabled", "true");
      expect(decrement()).not.toBeDisabled();

      unmount();
    });
  });

  describe("state", () => {
    it("reports disabled on the root, the group, the control and the steppers", async () => {
      const {decrement, group, increment, input, root, unmount} = renderNumberField({
        isDisabled: true,
      });

      await nextTick();

      expect(root).toHaveAttribute("data-disabled", "true");
      expect(group()).toHaveAttribute("data-disabled", "true");
      expect(input()).toBeDisabled();
      expect(increment()).toBeDisabled();
      expect(decrement()).toBeDisabled();

      unmount();
    });

    it("reports invalid on the root, the group and the control", async () => {
      const {group, input, root, unmount} = renderNumberField({isInvalid: true});

      await nextTick();

      expect(root).toHaveAttribute("data-invalid", "true");
      expect(group()).toHaveAttribute("data-invalid", "true");
      expect(input()).toHaveAttribute("aria-invalid", "true");

      unmount();
    });

    it("reports readonly on the root and the control", () => {
      const {group, input, root, unmount} = renderNumberField({isReadOnly: true});

      expect(root).toHaveAttribute("data-readonly", "true");
      expect(input()).toHaveAttribute("readonly");
      // The group takes no read-only mark, matching what React's field hands its group.
      expect(group()).not.toHaveAttribute("data-readonly");

      unmount();
    });

    it("reports required on the root, where the asterisk is drawn from", () => {
      const {root, unmount} = renderNumberField({isRequired: true});

      expect(root).toHaveAttribute("data-required", "true");

      unmount();
    });

    it("reports focus reaching anything in the group", async () => {
      // Load-bearing: the stylesheet suppresses the hover fill while focus is inside.
      const {group, input, unmount} = renderNumberField();

      input().dispatchEvent(new FocusEvent("focus"));
      await nextTick();

      expect(group()).toHaveAttribute("data-focus-within", "true");

      unmount();
    });

    it("reports hover on the group", async () => {
      const {group, unmount} = renderNumberField();

      group().dispatchEvent(
        new PointerEvent("pointerenter", {bubbles: true, pointerType: "mouse"}),
      );
      await nextTick();

      expect(group()).toHaveAttribute("data-hovered", "true");

      unmount();
    });
  });

  describe("variant and fullWidth", () => {
    it("supports the secondary variant", () => {
      const {root, unmount} = renderNumberField({variant: "secondary"});

      expect(root).toHaveClass("number-field--secondary");

      unmount();
    });

    it("supports fullWidth on the root and the group", () => {
      const {group, root, unmount} = renderNumberField({fullWidth: true});

      expect(root).toHaveClass("number-field--full-width");
      expect(group()).toHaveClass("number-field__group--full-width");

      unmount();
    });

    it("applies fullWidth written as a bare attribute", () => {
      // A boolean prop declared through an imported indexed-access type compiles without a
      // runtime type, and Vue then leaves a valueless attribute as `""` — falsy, so the modifier
      // never lands. The bound form above stays green while that is broken.
      const {group, root, unmount} = renderNumberField({attributeForm: true});

      expect(root).toHaveClass("number-field--full-width");
      expect(group()).toHaveClass("number-field__group--full-width");

      unmount();
    });
  });

  describe("typing", () => {
    it("normalises the text when focus leaves", async () => {
      const {input, unmount} = renderNumberField({
        formatOptions: {currency: "USD", style: "currency"},
      });

      type(input(), "1234.5");
      input().dispatchEvent(new FocusEvent("blur"));
      await nextTick();

      expect(input()).toHaveValue("$1,234.50");

      unmount();
    });

    it("reports the number to its owner", () => {
      const onChange = vi.fn();
      const {increment, unmount} = renderNumberField({defaultValue: 5, onChange, step: 1});

      pointerPress(increment());

      expect(onChange).toHaveBeenCalledWith(6);

      unmount();
    });

    it("keeps a controlled field at the value its owner holds", async () => {
      const {increment, input, unmount} = renderNumberField({step: 1, value: 5});

      pointerPress(increment());
      await nextTick();

      expect(input()).toHaveValue("5");

      unmount();
    });
  });

  describe("validation", () => {
    it("shows the message a validate function returns", async () => {
      const {input, root, slot, unmount} = renderNumberField({
        validate: (value: number) => (value < 3 ? "Too small" : true),
        validationBehavior: "aria",
        withFieldError: true,
      });

      // Validation sees the committed number, not the text being typed — the two are held apart
      // on purpose, so a half-finished entry is not called invalid while the user is mid-word.
      type(input(), "2");
      await nextTick();
      expect(root).not.toHaveAttribute("data-invalid");

      input().dispatchEvent(new FocusEvent("blur"));
      await nextTick();

      expect(root).toHaveAttribute("data-invalid", "true");
      expect(slot("field-error")).toHaveTextContent("Too small");

      unmount();
    });
  });
});
