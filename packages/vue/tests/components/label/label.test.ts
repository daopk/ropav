import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {nextTick} from "vue";

import Fixture from "./fixtures.vue";

const renderLabel = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, {props});
  const label = result.container.querySelector("label");

  if (!label) throw new Error("label not rendered");

  return {...result, label};
};

describe("Label", () => {
  describe("structure", () => {
    it("renders a label element carrying its data-slot", () => {
      const {label} = renderLabel();

      expect(label.tagName).toBe("LABEL");
      expect(label).toHaveAttribute("data-slot", "label");
      expect(label).toHaveTextContent("Email");
    });

    it("applies the base class", () => {
      const {label} = renderLabel();

      expect(label).toHaveClass("label");
    });

    it("merges a caller class", () => {
      const {label} = renderLabel({class: "mt-2"});

      expect(label).toHaveClass("label", "mt-2");
    });
  });

  describe("variants", () => {
    it("renders no state modifier by default", () => {
      const {label} = renderLabel();

      expect(label.className).toBe("label");
    });

    it("marks a required label", () => {
      const {label} = renderLabel({isRequired: true});

      expect(label).toHaveClass("label--required");
    });

    it("marks a disabled label", () => {
      const {label} = renderLabel({isDisabled: true});

      expect(label).toHaveClass("label--disabled");
    });

    it("marks an invalid label", () => {
      const {label} = renderLabel({isInvalid: true});

      expect(label).toHaveClass("label--invalid");
    });
  });

  describe("field ids", () => {
    it("takes no id when it stands on its own", () => {
      const {label} = renderLabel();

      expect(label).not.toHaveAttribute("id");
    });

    it("claims the id its container points aria-labelledby at", async () => {
      const {container, label} = renderLabel({withFieldIds: true});

      await nextTick();

      const id = label.getAttribute("id");

      expect(id).toBeTruthy();
      // The container's reference has to resolve to this very element, which is the whole
      // point of claiming rather than emitting ids unconditionally.
      expect(container.firstElementChild).toHaveAttribute("data-labelled-by", id!);
    });
  });

  describe("attribute passthrough", () => {
    it("forwards an undeclared attribute onto the label element", () => {
      const {label} = renderLabel({labelFor: "email-input"});

      expect(label).toHaveAttribute("for", "email-input");
    });
  });
});
