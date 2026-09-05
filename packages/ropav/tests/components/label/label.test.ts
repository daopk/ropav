import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";

import Fixture from "./fixtures.vue";

const renderLabel = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });
  const label = result.container.querySelector('[data-slot="label"]');

  if (!label) throw new Error("label not rendered");

  return { ...result, label };
};

describe("Label", () => {
  describe("structure", () => {
    it("renders a label element carrying its data-slot", () => {
      const { label } = renderLabel();

      expect(label.tagName).toBe("LABEL");
      expect(label).toHaveAttribute("data-slot", "label");
      expect(label).toHaveTextContent("Email");
    });

    it("applies the base class", () => {
      const { label } = renderLabel();

      expect(label).toHaveClass("rp-label");
    });

    it("merges a caller class", () => {
      const { label } = renderLabel({ class: "mt-2" });

      expect(label).toHaveClass("rp-label", "mt-2");
    });
  });

  describe("variants", () => {
    it("renders no state modifier by default", () => {
      const { label } = renderLabel();

      expect(label.className).toBe("rp-label");
    });

    it("marks a required label", () => {
      const { label } = renderLabel({ isRequired: true });

      expect(label).toHaveClass("rp-label--required");
    });

    it("marks a disabled label", () => {
      const { label } = renderLabel({ isDisabled: true });

      expect(label).toHaveClass("rp-label--disabled");
    });

    it("marks an invalid label", () => {
      const { label } = renderLabel({ isInvalid: true });

      expect(label).toHaveClass("rp-label--invalid");
    });

    it("applies the modifiers when the props are written as bare attributes", () => {
      // `<Label is-required>` hands the prop an empty string, which only becomes `true` when
      // the prop carries a runtime `Boolean` type. Declaring the type through the variants
      // type instead leaves it untyped, and the modifier silently never applies.
      const { label } = renderLabel({ attributeForm: true });

      expect(label).toHaveClass("rp-label--disabled", "rp-label--invalid", "rp-label--required");
    });
  });

  describe("field ids", () => {
    it("takes no id when it stands on its own", () => {
      const { label } = renderLabel();

      expect(label).not.toHaveAttribute("id");
    });

    it("renders a span when the field's label names a composite", async () => {
      // `label` implies a labelable form control to point at, which a tag group has none of.
      const { label } = renderLabel({ labelElementType: "span", withFieldIds: true });

      expect(label.tagName).toBe("SPAN");
    });

    it("takes no id from a container that does not reference a label", async () => {
      // A collection item names itself from its content, so handing out an id would add an
      // attribute nothing points at.
      const { label } = renderLabel({ slots: ["description"], withFieldIds: true });

      await nextTick();

      expect(label).not.toHaveAttribute("id");
    });

    it("claims the id its container points aria-labelledby at", async () => {
      const { container, label } = renderLabel({ withFieldIds: true });

      await nextTick();

      const id = label.getAttribute("id");

      expect(id).toBeTruthy();
      // The container's reference has to resolve to this very element, which is the whole
      // point of claiming rather than emitting ids unconditionally.
      expect(container.firstElementChild).toHaveAttribute("data-labelled-by", id!);
    });
  });

  describe("control id", () => {
    it("points for at the control its container named", () => {
      // `aria-labelledby` is what names the control for assistive technology, but only `for`
      // makes a pointer click on the label move focus into it.
      const { label } = renderLabel({ controlId: "email-input", withFieldIds: true });

      expect(label).toHaveAttribute("for", "email-input");
    });

    it("renders no for when its container names no control", () => {
      // A checkbox keeps its input inside the label, and a composite has no single control
      // to point at, so neither hands one out. This is every container that existed before.
      const { label } = renderLabel({ withFieldIds: true });

      expect(label).not.toHaveAttribute("for");
    });

    it("renders no for when it stands on its own", () => {
      const { label } = renderLabel();

      expect(label).not.toHaveAttribute("for");
    });

    it("leaves for off a label rendered as a span", async () => {
      // Only a real `label` can carry `for`, so a composite's `span` must not grow one even
      // when a control id is on offer.
      const { label } = renderLabel({
        controlId: "email-input",
        labelElementType: "span",
        withFieldIds: true,
      });

      expect(label.tagName).toBe("SPAN");
      expect(label).not.toHaveAttribute("for");
    });

    it("claims its own id and points for at the control at the same time", async () => {
      // The two directions are independent and both have to be rendered.
      const { container, label } = renderLabel({ controlId: "email-input", withFieldIds: true });

      await nextTick();

      const id = label.getAttribute("id");

      expect(id).toBeTruthy();
      expect(container.firstElementChild).toHaveAttribute("data-labelled-by", id!);
      expect(label).toHaveAttribute("for", "email-input");
    });
  });

  describe("attribute passthrough", () => {
    it("forwards an undeclared attribute onto the label element", () => {
      const { label } = renderLabel({ labelFor: "email-input" });

      expect(label).toHaveAttribute("for", "email-input");
    });

    it("lets a caller for win over the one the container offers", () => {
      // Attribute fallthrough beats a binding declared in the template, which is the same
      // precedence already relied on for a close button's `aria-label`.
      const { label } = renderLabel({
        controlId: "from-container",
        labelFor: "from-caller",
        withFieldIds: true,
      });

      expect(label).toHaveAttribute("for", "from-caller");
    });
  });
});
