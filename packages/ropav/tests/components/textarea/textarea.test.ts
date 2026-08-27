import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import { expectResetSource } from "../../harness/form-reset";

import Fixture from "./fixtures.vue";

const render = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });

  return { ...result, control: result.container.querySelector("textarea")! };
};

const type = async (control: HTMLTextAreaElement, value: string) => {
  control.value = value;
  control.dispatchEvent(new Event("input", { bubbles: true }));
  await nextTick();
};

/**
 * The `Input` suite next door carries the reasoning; this covers what a textarea does differently.
 *
 * The difference that matters is the reset source: an `<input>` keeps it in a `value` attribute, a
 * `<textarea>` in its child text content, and there is no attribute for the second — so a suite
 * that passes for one says nothing about the other. `expectResetSource` asserts both halves for
 * exactly that reason.
 */
describe("TextArea", () => {
  describe("standing on its own", () => {
    it("renders a textarea carrying the block class", () => {
      const { control, unmount } = render();

      expect(control.tagName).toBe("TEXTAREA");
      expect(control).toHaveAttribute("data-slot", "textarea");
      expect(control).toHaveClass("textarea", "textarea--primary");

      unmount();
    });

    it("takes its variant from its own props, having no field to inherit from", () => {
      const { control, unmount } = render({ fullWidth: true, variant: "secondary" });

      expect(control).toHaveClass("textarea", "textarea--secondary", "textarea--full-width");

      unmount();
    });

    it("takes native attributes by fallthrough", () => {
      const { control, unmount } = render({ required: true, rows: 5 });

      expect(control).toHaveAttribute("required");
      expect(control.rows).toBe(5);

      unmount();
    });

    it("renders no state a field would have supplied", () => {
      const { control, unmount } = render();

      expect(control.hasAttribute("data-disabled")).toBe(false);
      expect(control.hasAttribute("data-invalid")).toBe(false);

      unmount();
    });

    it("still reports focus and hover with no field behind it", async () => {
      const { control, unmount } = render();

      control.dispatchEvent(new FocusEvent("focus"));
      control.dispatchEvent(
        new PointerEvent("pointerenter", { bubbles: true, pointerType: "mouse" }),
      );
      await nextTick();

      expect(control).toHaveAttribute("data-focused", "true");
      expect(control).toHaveAttribute("data-hovered", "true");

      unmount();
    });
  });

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
      const control = container.querySelector("textarea")!;

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

      expect(control).toHaveValue("pinned");

      unmount();
    });

    it("keeps its reset source in its children, where a textarea's lives", () => {
      const { control, unmount } = render({ value: "pinned", withForm: true });

      // `defaultValue` is the one IDL that writes the right half of either element. A textarea has
      // no `value` attribute at all, so an assertion written for an input would pass here while
      // proving nothing.
      expectResetSource(control, "pinned");
      expect(control.hasAttribute("value")).toBe(false);

      unmount();
    });
  });

  describe("inside a field", () => {
    it("takes the field's variant and state", () => {
      const { control, unmount } = render({
        fieldVariant: "secondary",
        inField: true,
        isFieldDisabled: true,
        isFieldInvalid: true,
      });

      expect(control).toHaveClass("textarea--secondary");
      expect(control).toHaveAttribute("data-disabled", "true");
      expect(control).toHaveAttribute("data-invalid", "true");

      unmount();
    });

    it("tells the field it is driving a textarea", async () => {
      const { control, unmount } = render({ inField: true });

      // The field hands back `type` and `pattern` until the control registers, and registration
      // lands a tick after the mount — so both are briefly on the element at first paint. Harmless,
      // since neither means anything on a textarea, but it is why this waits: asserting on the
      // first render would be asserting the transient.
      expect(control.hasAttribute("type")).toBe(true);

      await nextTick();

      // Registering is what drops them, which is the state that matters.
      expect(control.hasAttribute("type")).toBe(false);
      expect(control.hasAttribute("pattern")).toBe(false);

      unmount();
    });

    it("takes the value over from the field when it sets one of its own", async () => {
      const { control, unmount } = render({
        fieldValue: "from the field",
        inField: true,
        value: "from the control",
      });

      await nextTick();

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
