import type {UseColorFieldReturn} from "@/composables/use-color-field";

import {renderVapor} from "@ropav/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick, reactive} from "vue";

import Host from "../fixtures/color-field-host.vue";

/**
 * Mount the host and hand back the live composable.
 *
 * `props` is passed by reference: `renderVapor` reads each key through a getter, so a `reactive`
 * object handed in here keeps driving the field.
 */
const mount = (props: Record<string, unknown> = {}) => {
  let field!: UseColorFieldReturn;

  Object.assign(props, {onReady: (next: UseColorFieldReturn) => (field = next)});

  const result = renderVapor(Host, {props});

  const at = (testId: string) =>
    result.container.querySelector<HTMLElement>(`[data-testid='${testId}']`)!;

  return {
    ...result,
    field: () => field,
    form: () => at("form") as unknown as HTMLFormElement,
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

describe("useColorField", () => {
  describe("the control it renders", () => {
    it("renders a text input holding the hex value", () => {
      const {input, unmount} = mount({defaultValue: "#0485F7"});

      expect(input().type).toBe("text");
      expect(input().value).toBe("#0485F7");

      unmount();
    });

    it("calls itself a textbox rather than a spin button", () => {
      // The spin button is layered on for its keyboard only. Announcing the role would have a
      // screen reader read the hex out as the integer it is under the hood.
      const {input, unmount} = mount({defaultValue: "#0485F7"});

      expect(input()).toHaveAttribute("role", "textbox");
      expect(input()).not.toHaveAttribute("aria-valuenow");
      expect(input()).not.toHaveAttribute("aria-valuetext");
      expect(input()).not.toHaveAttribute("aria-valuemin");
      expect(input()).not.toHaveAttribute("aria-valuemax");

      unmount();
    });

    it("turns off the browser's own text assistance", () => {
      const {input, unmount} = mount();

      expect(input()).toHaveAttribute("autocomplete", "off");
      expect(input()).toHaveAttribute("autocorrect", "off");
      expect(input()).toHaveAttribute("spellcheck", "false");

      unmount();
    });

    it("asks for no software keyboard of its own", () => {
      // A hex value is letters as much as digits, so a numeric pad would be the wrong keyboard.
      const {input, unmount} = mount();

      expect(input()).not.toHaveAttribute("inputmode");

      unmount();
    });

    it("carries the name it submits under", () => {
      // Unlike the channel branch there is no hidden input: the visible text *is* the value.
      const {input, unmount} = mount({defaultValue: "#0485F7", name: "brand"});

      expect(input()).toHaveAttribute("name", "brand");

      unmount();
    });

    it("stays tabbable, and stops being so once disabled", () => {
      const {input, unmount} = mount();

      expect(input()).toHaveAttribute("tabindex", "0");
      unmount();

      const {input: off, unmount: unmountOff} = mount({isDisabled: true});

      expect(off()).not.toHaveAttribute("tabindex");
      unmountOff();
    });
  });

  describe("the state attributes", () => {
    it("reports disabled both ways", () => {
      const {input, unmount} = mount({isDisabled: true});

      expect(input()).toBeDisabled();
      expect(input()).toHaveAttribute("aria-disabled", "true");

      unmount();
    });

    it("reports read-only both ways", () => {
      const {input, unmount} = mount({isReadOnly: true});

      expect(input()).toHaveAttribute("readonly");
      expect(input()).toHaveAttribute("aria-readonly", "true");

      unmount();
    });

    it("uses the required attribute under native behaviour and the aria one otherwise", () => {
      const {input, unmount} = mount({isRequired: true});

      expect(input()).toBeRequired();
      expect(input()).not.toHaveAttribute("aria-required");
      unmount();

      const {input: aria, unmount: unmountAria} = mount({
        isRequired: true,
        validationBehavior: "aria",
      });

      expect(aria()).not.toHaveAttribute("required");
      expect(aria()).toHaveAttribute("aria-required", "true");
      unmountAria();
    });

    it("reports invalid to assistive technology", () => {
      const {input, unmount} = mount({isInvalid: true});

      expect(input()).toHaveAttribute("aria-invalid", "true");

      unmount();
    });
  });

  describe("typing", () => {
    it("keeps the text as typed without committing it", () => {
      const {field, input, unmount} = mount({defaultValue: "#0485F7"});

      type(input(), "#ff");

      expect(field().state.inputValue.value).toBe("#ff");
      expect(field().state.colorValue.value?.toString("hex")).toBe("#0485F7");

      unmount();
    });

    it("refuses a character that could never be part of a hex value", async () => {
      const {field, input, unmount} = mount({defaultValue: "#0485F7"});

      type(input(), "#zz");
      await nextTick();

      expect(field().state.inputValue.value).toBe("#0485F7");
      // Put back on the element too, not only in the state: the browser has already moved the
      // text by the time the listener runs.
      expect(input().value).toBe("#0485F7");

      unmount();
    });

    it("commits on blur", () => {
      const onChange = vi.fn();
      const {input, unmount} = mount({defaultValue: "#0485F7", onChange});

      type(input(), "abc");
      input().dispatchEvent(new FocusEvent("blur"));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0]![0].toString("hex")).toBe("#AABBCC");
      expect(input().value).toBe("#AABBCC");

      unmount();
    });

    it("normalises the text on blur even when the colour did not move", async () => {
      // The case Vapor cannot handle on its own: the bound value never changed, so nothing would
      // rewrite the element.
      const {input, unmount} = mount({defaultValue: "#0485F7"});

      type(input(), "0485f7");
      input().dispatchEvent(new FocusEvent("blur"));
      await nextTick();

      expect(input().value).toBe("#0485F7");

      unmount();
    });
  });

  describe("the keyboard", () => {
    it("steps the colour on the arrow keys", () => {
      const {field, input, unmount} = mount({defaultValue: "#0000FF"});

      press(input(), "ArrowUp");

      expect(field().state.colorValue.value?.toString("hex")).toBe("#000100");

      press(input(), "ArrowDown");

      expect(field().state.colorValue.value?.toString("hex")).toBe("#0000FF");

      unmount();
    });

    it("jumps to white on End and to black on Home", () => {
      const {field, input, unmount} = mount({defaultValue: "#0485F7"});

      press(input(), "End");

      expect(field().state.colorValue.value?.toString("hex")).toBe("#FFFFFF");

      press(input(), "Home");

      expect(field().state.colorValue.value?.toString("hex")).toBe("#000000");

      unmount();
    });

    it("leaves the arrows alone on a read-only field", () => {
      const {field, input, unmount} = mount({defaultValue: "#0485F7", isReadOnly: true});

      press(input(), "ArrowUp");

      expect(field().state.colorValue.value?.toString("hex")).toBe("#0485F7");

      unmount();
    });

    it("writes the stepped colour onto the element", async () => {
      const {input, unmount} = mount({defaultValue: "#0000FF"});

      press(input(), "ArrowUp");
      await nextTick();

      expect(input().value).toBe("#000100");

      unmount();
    });
  });

  describe("the wheel", () => {
    const wheel = (input: HTMLInputElement, init: WheelEventInit) =>
      input.dispatchEvent(new WheelEvent("wheel", {cancelable: true, ...init}));

    it("steps the colour while focus is inside", async () => {
      const {field, input, unmount} = mount({defaultValue: "#0000FF"});

      input().dispatchEvent(new FocusEvent("focus"));
      await nextTick();
      wheel(input(), {deltaY: 10});

      expect(field().state.colorValue.value?.toString("hex")).toBe("#000100");

      unmount();
    });

    it("ignores the wheel while focus is elsewhere", async () => {
      // Otherwise scrolling a page past a colour field would quietly rewrite it.
      const {field, input, unmount} = mount({defaultValue: "#0000FF"});

      await nextTick();
      wheel(input(), {deltaY: 10});

      expect(field().state.colorValue.value?.toString("hex")).toBe("#0000FF");

      unmount();
    });

    it("ignores the wheel when it is turned off", async () => {
      const {field, input, unmount} = mount({defaultValue: "#0000FF", isWheelDisabled: true});

      input().dispatchEvent(new FocusEvent("focus"));
      await nextTick();
      wheel(input(), {deltaY: 10});

      expect(field().state.colorValue.value?.toString("hex")).toBe("#0000FF");

      unmount();
    });
  });

  describe("a controlled field", () => {
    it("lets the text be typed, then puts it back when the owner declines", async () => {
      // The *colour* is what the owner controls, not the text: refusing keystrokes would make a
      // controlled field impossible to type in. The text only goes back on commit.
      const props = reactive<{value: string}>({value: "#0485F7"});
      const {input, unmount} = mount(props);

      type(input(), "#000000");
      await nextTick();

      expect(input().value).toBe("#000000");

      input().dispatchEvent(new FocusEvent("blur"));
      await nextTick();

      expect(input().value).toBe("#0485F7");

      unmount();
    });

    it("follows the owner's colour", async () => {
      const props = reactive<{value: string}>({value: "#0485F7"});
      const {input, unmount} = mount(props);

      props.value = "#FFCC00";
      await nextTick();

      expect(input().value).toBe("#FFCC00");

      unmount();
    });
  });

  describe("a form reset", () => {
    it("puts the input itself back when the text never moved", async () => {
      // The failure mode worth guarding, and the one a typed-then-reset test cannot see. A real
      // reset blanks the element, because the browser restores a control from its `value`
      // *attribute* and a Vapor binding only ever writes the property. With the state already
      // holding the default, nothing changes and no binding write follows — so the field would
      // sit there empty. And the write has to be a tick out: the `reset` event is dispatched
      // before the browser puts the controls back, so a write from inside the listener is lost.
      const {input, unmount} = mount({defaultValue: "#0485F7", withForm: true});

      await nextTick();

      expect(input().value).toBe("#0485F7");

      input().form!.reset();
      await nextTick();
      await nextTick();

      expect(input().value).toBe("#0485F7");

      unmount();
    });

    it("puts the colour back after the field was edited", async () => {
      // A real reset, not a synthetic `reset` event: the browser restores a control from its
      // `value` *attribute*, which a Vapor binding never writes, so an input with no attribute
      // comes back empty. The write has to happen a tick after the event, because the event is
      // dispatched before the browser puts the controls back.
      const {field, form, input, unmount} = mount({defaultValue: "#0485F7", withForm: true});

      await nextTick();
      type(input(), "#000000");
      input().dispatchEvent(new FocusEvent("blur"));
      await nextTick();

      expect(input().value).toBe("#000000");

      form().reset();
      await nextTick();
      await nextTick();

      expect(field().state.colorValue.value?.toString("hex")).toBe("#0485F7");
      expect(input().value).toBe("#0485F7");

      unmount();
    });
  });
});
