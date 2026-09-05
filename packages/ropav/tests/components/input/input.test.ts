import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import { expectResetSource } from "../../harness/form-reset";

import Fixture from "./fixtures.vue";

const render = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });

  return { ...result, control: result.container.querySelector("input")! };
};

const type = async (control: HTMLInputElement, value: string) => {
  control.value = value;
  control.dispatchEvent(new Event("input", { bubbles: true }));
  await nextTick();
};

/**
 * `Input` is the control `TextField` drives, and every fixture in the library used to put it inside
 * one — so the branch both this file and `textarea-root.vue` are built around, where
 * `useTextFieldControlContext()` returns `null`, had never run. Both source files say a bare
 * `<Input>` outside any field is legal; nothing checked it.
 *
 * The stories do render it bare, so axe has been over it. What none of them could show is what it
 * *does*: which attributes reach the element, which states it still reports with no field to ask,
 * and whether the value binds at all.
 */
describe("Input", () => {
  describe("standing on its own", () => {
    it("renders an input carrying the block class", () => {
      const { control, unmount } = render();

      expect(control.tagName).toBe("INPUT");
      expect(control).toHaveAttribute("data-slot", "input");
      expect(control).toHaveClass("rp-input", "rp-input--primary");

      unmount();
    });

    it("takes its variant from its own props, having no field to inherit from", () => {
      const { control, unmount } = render({ fullWidth: true, variant: "secondary" });

      expect(control).toHaveClass("rp-input", "rp-input--secondary", "rp-input--full-width");

      unmount();
    });

    it("merges a caller class", () => {
      const { control, unmount } = render({ class: "w-40" });

      expect(control).toHaveClass("rp-input", "w-40");

      unmount();
    });

    it("takes native attributes by fallthrough", () => {
      const { control, unmount } = render({ required: true, type: "email" });

      // Only `placeholder`, `value`, `variant`, `fullWidth` and `class` are declared props; the
      // types say every other native attribute arrives this way, which nothing had checked.
      expect(control).toHaveAttribute("required");
      expect(control).toHaveAttribute("type", "email");

      unmount();
    });

    it("renders no state a field would have supplied", () => {
      const { control, unmount } = render();

      // Each of these reads `control?.` and so resolves to nothing here. `data-disabled` in
      // particular costs nothing: `input.css` keys the disabled treatment on `:disabled` as well.
      expect(control.hasAttribute("data-disabled")).toBe(false);
      expect(control.hasAttribute("data-invalid")).toBe(false);

      unmount();
    });

    it("is disabled natively, with no field to report it", () => {
      const { control, unmount } = render({ disabled: true });

      expect(control.disabled).toBe(true);
      expect(control.hasAttribute("data-disabled")).toBe(false);

      unmount();
    });

    it("still reports focus with no field behind it", async () => {
      const { control, unmount } = render();

      control.dispatchEvent(new FocusEvent("focus"));
      await nextTick();

      // `useInteractionStates` is the control's own, not the field's, so these hold either way.
      expect(control).toHaveAttribute("data-focused", "true");

      control.dispatchEvent(new FocusEvent("blur"));
      await nextTick();

      expect(control.hasAttribute("data-focused")).toBe(false);

      unmount();
    });

    it("still reports hover with no field behind it", async () => {
      const { control, unmount } = render();

      control.dispatchEvent(
        new PointerEvent("pointerenter", { bubbles: true, pointerType: "mouse" }),
      );
      await nextTick();

      expect(control).toHaveAttribute("data-hovered", "true");

      control.dispatchEvent(
        new PointerEvent("pointerleave", { bubbles: true, pointerType: "mouse" }),
      );
      await nextTick();

      expect(control.hasAttribute("data-hovered")).toBe(false);

      unmount();
    });
  });

  /**
   * The gap that made this worth doing rather than only pinning. A bare control had no value
   * binding at all: `v-model:value` — the house style, and what all 48 other bindings in the
   * library use — rendered the initial text and then silently stopped tracking, because nothing
   * emitted `update:value`. It looked like it worked, which is the worst way for it to fail.
   */
  describe("binding its value", () => {
    it("reports what was typed", async () => {
      const onUpdate = vi.fn();
      const onChange = vi.fn();
      const { control, unmount } = render({ onChange, "onUpdate:value": onUpdate });

      await type(control, "typed");

      expect(onUpdate).toHaveBeenCalledWith("typed");
      expect(onChange).toHaveBeenCalledWith("typed");

      unmount();
    });

    it("follows a value the caller keeps moving", async () => {
      const props = reactive({ value: "one" });
      const { container, unmount } = renderVapor(Fixture, { props });
      const control = container.querySelector("input")!;

      expect(control).toHaveValue("one");

      props.value = "two";
      await nextTick();

      expect(control).toHaveValue("two");

      unmount();
    });

    it("pins the text when the caller owns the value and ignores the change", async () => {
      const { control, unmount } = render({ value: "pinned" });

      expect(control).toHaveValue("pinned");

      await type(control, "typed over");

      // The caller holds `value` and did not move it, so the typing is a rejected edit — and the
      // browser has already moved the text, so something has to put it back.
      expect(control).toHaveValue("pinned");

      unmount();
    });

    it("leaves the text alone when the caller owns nothing", async () => {
      const { control, unmount } = render();

      await type(control, "typed");

      expect(control).toHaveValue("typed");

      unmount();
    });

    it("carries the half a form reset restores from", () => {
      const { control, unmount } = render({ value: "pinned", withForm: true });

      // A Vapor binding writes the property only, which leaves an input with no reset source at
      // all. See `expectResetSource` for why no jsdom test can check the restore itself.
      expectResetSource(control, "pinned");

      unmount();
    });
  });

  describe("inside a field", () => {
    it("takes the field's variant when it sets none of its own", () => {
      const { control, unmount } = render({ fieldVariant: "secondary", inField: true });

      expect(control).toHaveClass("rp-input--secondary");

      unmount();
    });

    it("takes the field's size when it sets none of its own", () => {
      const { control, unmount } = render({ fieldSize: "sm", inField: true });

      expect(control).toHaveClass("rp-input--sm");

      unmount();
    });

    it("lets its own size win over the field's", () => {
      const { control, unmount } = render({ fieldSize: "sm", inField: true, size: "lg" });

      expect(control).toHaveClass("rp-input--lg");
      expect(control).not.toHaveClass("rp-input--sm");

      unmount();
    });

    it("lets its own variant win over the field's", () => {
      const { control, unmount } = render({
        fieldVariant: "secondary",
        inField: true,
        variant: "primary",
      });

      expect(control).toHaveClass("rp-input--primary");

      unmount();
    });

    it("lets its own placeholder win over the field's", () => {
      const { control, unmount } = render({
        fieldPlaceholder: "from the field",
        inField: true,
        placeholder: "from the control",
      });

      expect(control).toHaveAttribute("placeholder", "from the control");

      unmount();
    });

    it("keeps the field's placeholder when it sets none", () => {
      const { control, unmount } = render({ fieldPlaceholder: "from the field", inField: true });

      // Spreading the field's bag blindly would be wrong in the other direction too: an absent
      // control placeholder must not erase the field's.
      expect(control).toHaveAttribute("placeholder", "from the field");

      unmount();
    });

    it("reports the field's disabled and invalid state", () => {
      const { control, unmount } = render({
        inField: true,
        isFieldDisabled: true,
        isFieldInvalid: true,
      });

      expect(control).toHaveAttribute("data-disabled", "true");
      expect(control).toHaveAttribute("data-invalid", "true");

      unmount();
    });

    it("takes the value over from the field when it sets one of its own", async () => {
      const { control, unmount } = render({
        fieldValue: "from the field",
        inField: true,
        value: "from the control",
      });

      await nextTick();

      // Two owners of one value fight, and the control's prop is the one that wins by design.
      expect(control).toHaveValue("from the control");
      expectResetSource(control, "from the control");

      unmount();
    });

    it("leaves the value to the field when it sets none", async () => {
      const { control, unmount } = render({ fieldValue: "from the field", inField: true });

      await nextTick();

      expect(control).toHaveValue("from the field");

      unmount();
    });
  });
});
