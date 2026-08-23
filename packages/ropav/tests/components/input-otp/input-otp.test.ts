import {renderVapor} from "@ropav/testing/helpers/vue";
import {afterEach, describe, expect, it, vi} from "vitest";
import {nextTick, reactive} from "vue";

import {expectResetSource} from "../../harness/form-reset";

import Fixture from "./fixtures.vue";

// The props object is handed over as it arrives rather than spread, so a reactive object passed in
// stays reactive and a test can move a prop after mounting.
const renderInputOTP = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, {props});
  const root = result.container.querySelector<HTMLElement>("[data-input-otp-container]");

  if (!root) throw new Error("field not rendered");

  return {
    ...result,
    control: result.container.querySelector("input") as HTMLInputElement,
    groups: [...result.container.querySelectorAll<HTMLElement>('[data-slot="input-otp-group"]')],
    root,
    slotAt: (index: number) =>
      result.container.querySelectorAll<HTMLElement>('[data-slot="input-otp-slot"]')[index]!,
    slots: [...result.container.querySelectorAll<HTMLElement>('[data-slot="input-otp-slot"]')],
  };
};

const type = (control: HTMLInputElement, value: string) => {
  control.value = value;
  control.dispatchEvent(new Event("input"));
};

/**
 * A paste event carrying text.
 *
 * jsdom has no `DataTransfer`, so the payload is attached by hand. What a real clipboard does is
 * covered in the browser suite; this exercises the branch that decides who handles the paste.
 */
const pasteEvent = (text: string) => {
  const event = new Event("paste", {bubbles: true, cancelable: true});

  Object.defineProperty(event, "clipboardData", {value: {getData: () => text}});

  return event;
};

afterEach(() => {
  document.getElementById("input-otp-style")?.remove();
});

describe("InputOTP", () => {
  describe("structure", () => {
    it("renders every part with its data-slot", () => {
      const {container, control, groups, slots, unmount} = renderInputOTP({defaultValue: "1"});

      expect(groups).toHaveLength(2);
      expect(slots).toHaveLength(6);
      expect(container.querySelector('[data-slot="input-otp-separator"]')).not.toBeNull();
      expect(container.querySelector('[data-slot="input-otp-slot-value"]')).not.toBeNull();
      expect(control).toHaveAttribute("data-slot", "input-otp");

      unmount();
    });

    /**
     * The container carries no `data-slot` of its own, and neither does React's: the package this
     * engine comes from spreads unknown props onto the control, so `data-slot="input-otp"` ends up
     * on the hidden control rather than on the box around it.
     */
    it("marks the container with the engine's own attribute", () => {
      const {control, root, unmount} = renderInputOTP();

      expect(root).toHaveAttribute("data-input-otp-container", "true");
      expect(root).not.toHaveAttribute("data-slot");
      expect(control).toHaveAttribute("data-input-otp", "true");

      unmount();
    });

    it("renders the BEM classes of each part", () => {
      const {container, control, groups, root, slotAt, unmount} = renderInputOTP({
        defaultValue: "1",
      });

      expect(root).toHaveClass("input-otp", "input-otp--primary");
      expect(groups[0]).toHaveClass("input-otp__group");
      expect(slotAt(0)).toHaveClass("input-otp__slot");
      expect(container.querySelector('[data-slot="input-otp-slot-value"]')).toHaveClass(
        "input-otp__slot-value",
      );
      expect(container.querySelector('[data-slot="input-otp-separator"]')).toHaveClass(
        "input-otp__separator",
      );
      expect(control).toHaveClass("input-otp__input");

      unmount();
    });

    it("renders the secondary variant on the field itself", () => {
      const {root, unmount} = renderInputOTP({variant: "secondary"});

      expect(root).toHaveClass("input-otp", "input-otp--secondary");

      unmount();
    });

    it("merges a caller class into the field and into the control", () => {
      const {control, root, unmount} = renderInputOTP({class: "w-80", inputClass: "sr-only"});

      expect(root).toHaveClass("input-otp", "w-80");
      expect(control).toHaveClass("input-otp__input", "sr-only");

      unmount();
    });

    it("puts the control under the boxes rather than among them", () => {
      const {control, root, unmount} = renderInputOTP();

      // Last child, so the boxes come first in reading order and the control sits over them.
      expect(root.lastElementChild!.contains(control)).toBe(true);
      expect(control.closest('[data-slot="input-otp-group"]')).toBeNull();

      unmount();
    });
  });

  describe("boxes", () => {
    it("fills a box with the character typed into it", async () => {
      const {control, slotAt, unmount} = renderInputOTP();

      type(control, "12");
      await nextTick();

      expect(slotAt(0)).toHaveTextContent("1");
      expect(slotAt(1)).toHaveTextContent("2");
      expect(slotAt(2)).toHaveTextContent("");

      unmount();
    });

    it("marks a filled box, and only a filled one", async () => {
      const {control, slotAt, unmount} = renderInputOTP();

      type(control, "12");
      await nextTick();

      expect(slotAt(0)).toHaveAttribute("data-filled", "true");
      expect(slotAt(2)).not.toHaveAttribute("data-filled");

      unmount();
    });

    it("marks the box the caret is on", async () => {
      const {control, slotAt, unmount} = renderInputOTP({defaultValue: "1"});

      control.focus();
      control.dispatchEvent(new FocusEvent("focus"));
      await nextTick();

      expect(slotAt(1)).toHaveAttribute("data-active", "true");
      expect(slotAt(0)).not.toHaveAttribute("data-active");

      unmount();
    });

    it("draws a caret in the active box while it is empty", async () => {
      const {container, control, slotAt, unmount} = renderInputOTP({defaultValue: "1"});

      control.focus();
      control.dispatchEvent(new FocusEvent("focus"));
      await nextTick();

      const caret = container.querySelector('[data-slot="input-otp-caret"]');

      expect(caret).not.toBeNull();
      expect(caret).toHaveClass("input-otp__caret");
      expect(slotAt(1).contains(caret)).toBe(true);

      unmount();
    });

    it("draws no caret in a box that already holds a character", async () => {
      const {container, control, unmount} = renderInputOTP({defaultValue: "123456"});

      control.focus();
      control.dispatchEvent(new FocusEvent("focus"));
      await nextTick();

      expect(container.querySelector('[data-slot="input-otp-caret"]')).toBeNull();

      unmount();
    });

    it("leaves a box past the end of the code empty", async () => {
      const {slotAt, unmount} = renderInputOTP({
        defaultValue: "123456",
        withExtraSlot: true,
      });

      await nextTick();

      expect(slotAt(6)).toHaveTextContent("");
      expect(slotAt(6)).not.toHaveAttribute("data-filled");

      unmount();
    });
  });

  describe("state", () => {
    it("takes the disabled state down to every box and to the control", () => {
      const {control, slotAt, unmount} = renderInputOTP({isDisabled: true});

      expect(control).toBeDisabled();
      expect(control).toHaveAttribute("data-disabled", "true");
      expect(slotAt(0)).toHaveAttribute("data-disabled", "true");
      expect(slotAt(5)).toHaveAttribute("data-disabled", "true");

      unmount();
    });

    it("takes the invalid state down to every box and to the control", () => {
      const {control, slotAt, unmount} = renderInputOTP({isInvalid: true});

      expect(control).toHaveAttribute("data-invalid", "true");
      expect(slotAt(0)).toHaveAttribute("data-invalid", "true");

      unmount();
    });

    it("renders neither state by default", () => {
      const {control, slotAt, unmount} = renderInputOTP();

      expect(control).not.toHaveAttribute("data-disabled");
      expect(control).not.toHaveAttribute("data-invalid");
      expect(slotAt(0)).not.toHaveAttribute("data-disabled");
      expect(slotAt(0)).not.toHaveAttribute("data-invalid");

      unmount();
    });

    it("shows a disabled field is not for typing in", () => {
      const {root, unmount} = renderInputOTP({isDisabled: true});

      expect(root.style.cursor).toBe("default");

      unmount();
    });
  });

  describe("validation", () => {
    it("hands its verdict to a nested field error", async () => {
      const {container, unmount} = renderInputOTP({
        isInvalid: true,
        validationErrors: ["That code has expired"],
        withFieldError: true,
      });

      await nextTick();

      expect(container.querySelector('[data-slot="field-error"]')).toHaveTextContent(
        "That code has expired",
      );

      unmount();
    });

    it("renders no error while the code is acceptable", async () => {
      const {container, unmount} = renderInputOTP({withFieldError: true});

      await nextTick();

      expect(container.querySelector('[data-slot="field-error"]')).toBeNull();

      unmount();
    });
  });

  describe("value", () => {
    it("reports what was typed", () => {
      const onChange = vi.fn();
      const {control, unmount} = renderInputOTP({onChange});

      type(control, "123");

      expect(onChange).toHaveBeenCalledWith("123");

      unmount();
    });

    it("reports a full code once", async () => {
      const onComplete = vi.fn();
      const {control, unmount} = renderInputOTP({maxLength: 6, onComplete});

      type(control, "123456");
      await nextTick();

      expect(onComplete).toHaveBeenCalledWith("123456");

      unmount();
    });

    it("follows a value the caller owns", async () => {
      const props = reactive<Record<string, unknown>>({value: "1"});

      props["onChange"] = (next: string) => {
        props["value"] = next;
      };

      const {control, slotAt, unmount} = renderInputOTP(props);

      type(control, "12");
      await nextTick();

      expect(control).toHaveValue("12");
      expect(slotAt(1)).toHaveTextContent("2");

      unmount();
    });

    it("puts the text back when the caller declines the change", async () => {
      const {control, slotAt, unmount} = renderInputOTP({value: "1"});

      type(control, "12");
      await nextTick();

      expect(control).toHaveValue("1");
      expect(slotAt(1)).toHaveTextContent("");

      unmount();
    });
  });

  describe("paste", () => {
    /**
     * The transformer reaches the engine as something to read, not as something to call. Handing
     * the engine a wrapper that forwards to it would make it always look present, and its presence
     * is what decides whether the engine takes the paste over from the browser at all — a wrapper
     * read as a getter also returns nothing, so the transformer would never run either way.
     */
    it("rewrites pasted text through the transformer it was given", () => {
      const {control, unmount} = renderInputOTP({
        pasteTransformer: (pasted: string) => pasted.replace(/\D/g, ""),
      });

      control.dispatchEvent(pasteEvent("1-2 3"));

      expect(control.value).toBe("123");

      unmount();
    });

    it("leaves the paste to the browser when nothing needs rewriting", () => {
      const {control, unmount} = renderInputOTP();
      const event = pasteEvent("123");

      control.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);
      expect(control.value).toBe("");

      unmount();
    });
  });

  describe("the control", () => {
    it("submits under the name it was given", () => {
      const {control, unmount} = renderInputOTP({name: "code"});

      expect(control).toHaveAttribute("name", "code");

      unmount();
    });

    it("carries the id and the description, since it is the field for assistive technology", () => {
      const {control, unmount} = renderInputOTP({
        ariaDescribedby: "hint",
        ariaLabel: "Verification code",
        id: "otp",
      });

      expect(control).toHaveAttribute("id", "otp");
      expect(control).toHaveAttribute("aria-label", "Verification code");
      expect(control).toHaveAttribute("aria-describedby", "hint");

      unmount();
    });

    it("takes only as many characters as the code is long", () => {
      const {control, unmount} = renderInputOTP({maxLength: 4});

      expect(control).toHaveAttribute("maxlength", "4");

      unmount();
    });

    it("hands the pattern to the browser as well as to the engine", () => {
      const {control, unmount} = renderInputOTP({pattern: "^[a-zA-Z]+$"});

      expect(control).toHaveAttribute("pattern", "^[a-zA-Z]+$");

      unmount();
    });

    it("asks the platform for the keyboard the caller wants", () => {
      const {control, unmount} = renderInputOTP({inputMode: "text"});

      expect(control).toHaveAttribute("inputmode", "text");

      unmount();
    });
  });

  describe("a form", () => {
    it("carries the value a reset restores from", async () => {
      const {control, unmount} = renderInputOTP({
        defaultValue: "123",
        name: "code",
        withForm: true,
      });

      await nextTick();
      expectResetSource(control, "123");

      control.value = "456789";
      control.dispatchEvent(new Event("input"));
      await nextTick();

      expectResetSource(control, "456789");

      unmount();
    });

    it("goes back to its default when the form is reset", async () => {
      // Nothing did this before the reset source was written: the field had no `useFormReset` at
      // all, so a reset blanked the input while the state kept the code the boxes were showing,
      // and the form went on submitting an empty string for a field the user could see was filled.
      const {container, control, slotAt, unmount} = renderInputOTP({
        defaultValue: "123",
        name: "code",
        withForm: true,
      });

      await nextTick();

      control.value = "456789";
      control.dispatchEvent(new Event("input"));
      await nextTick();

      expect(slotAt(0).textContent).toBe("4");

      container.querySelector("form")!.reset();
      await nextTick();

      // Both halves: the boxes the user reads, and the input the form submits.
      expect(slotAt(0).textContent).toBe("1");
      expect(control.value).toBe("123");

      unmount();
    });
  });
});
