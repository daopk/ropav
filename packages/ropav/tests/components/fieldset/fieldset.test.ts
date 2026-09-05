import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";

import FieldsFixture from "./fields-fixtures.vue";
import Fixture from "./fixtures.vue";

const renderFieldset = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });
  const root = result.container.querySelector('[data-slot="fieldset"]');

  if (!root) throw new Error("fieldset not rendered");

  return { ...result, root };
};

const renderFields = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(FieldsFixture, { props });

  return {
    ...result,
    at: (testId: string) =>
      result.container.querySelector<HTMLElement>(`[data-testid='${testId}']`)!,
  };
};

describe("Fieldset", () => {
  describe("structure", () => {
    it("renders every part with its data-slot", () => {
      const { container, root, unmount } = renderFieldset();

      expect(root).toHaveAttribute("data-slot", "fieldset");
      expect(container.querySelector('[data-slot="fieldset-legend"]')).not.toBeNull();
      expect(container.querySelector('[data-slot="fieldset-field-group"]')).not.toBeNull();
      expect(container.querySelector('[data-slot="fieldset-actions"]')).not.toBeNull();

      unmount();
    });

    it("renders real fieldset and legend elements", () => {
      // Not decoration: the browser only cascades `disabled` down from a real `<fieldset>`, and
      // only a `<legend>` names the group to assistive technology.
      const { container, root, unmount } = renderFieldset();

      expect(root.tagName).toBe("FIELDSET");
      expect(container.querySelector('[data-slot="fieldset-legend"]')!.tagName).toBe("LEGEND");

      unmount();
    });

    it("renders the BEM classes of each part", () => {
      const { container, root, unmount } = renderFieldset();

      expect(root).toHaveClass("rp-fieldset");
      expect(container.querySelector('[data-slot="fieldset-legend"]')).toHaveClass(
        "rp-fieldset__legend",
      );
      expect(container.querySelector('[data-slot="fieldset-field-group"]')).toHaveClass(
        "rp-fieldset__field_group",
      );
      expect(container.querySelector('[data-slot="fieldset-actions"]')).toHaveClass(
        "rp-fieldset__actions",
      );

      unmount();
    });

    it("supports a class on every part", () => {
      const { container, root, unmount } = renderFieldset({
        actionsClass: "justify-end",
        class: "w-96",
        groupClass: "space-y-2",
        legendClass: "text-lg",
      });

      expect(root).toHaveClass("rp-fieldset", "w-96");
      expect(container.querySelector('[data-slot="fieldset-legend"]')).toHaveClass("text-lg");
      expect(container.querySelector('[data-slot="fieldset-field-group"]')).toHaveClass(
        "space-y-2",
      );
      expect(container.querySelector('[data-slot="fieldset-actions"]')).toHaveClass("justify-end");

      unmount();
    });

    it("names the group by its legend", () => {
      const { root, unmount } = renderFieldset();

      expect(root).toHaveAccessibleName("Profile");

      unmount();
    });
  });

  describe("disabled", () => {
    it("carries no disabled marks by default", () => {
      const { root, unmount } = renderFieldset();

      expect(root).not.toHaveAttribute("disabled");
      expect(root).not.toHaveAttribute("data-disabled");

      unmount();
    });

    it("sets the native attribute and the data attribute together", () => {
      // The attribute is what the browser cascades from; the data attribute is what the
      // stylesheet reads to dim descendant labels.
      const { root, unmount } = renderFieldset({ disabled: true });

      expect(root).toBeDisabled();
      expect(root).toHaveAttribute("data-disabled", "true");

      unmount();
    });
  });

  describe("disabling the fields inside", () => {
    it("disables a button", () => {
      const { at, unmount } = renderFields({ disabled: true });

      expect(at("button")).toBeDisabled();
      expect(at("button")).toHaveAttribute("data-disabled", "true");

      unmount();
    });

    it("disables a button nested in a button group", () => {
      // The group sits between the fieldset and the button, and a group that claims nothing has
      // to let the fieldset through rather than reporting its buttons as enabled.
      const { at, unmount } = renderFields({ disabled: true });

      expect(at("grouped-button")).toBeDisabled();
      expect(at("grouped-button")).toHaveAttribute("data-disabled", "true");

      unmount();
    });

    it("disables a link", () => {
      const { at, unmount } = renderFields({ disabled: true });

      expect(at("link")).toHaveAttribute("aria-disabled", "true");
      expect(at("link").tagName).toBe("SPAN");

      unmount();
    });

    it("disables a toggle button", () => {
      const { at, unmount } = renderFields({ disabled: true });

      expect(at("toggle-button")).toBeDisabled();
      expect(at("toggle-button")).toHaveAttribute("data-disabled", "true");

      unmount();
    });

    it("disables a toggle button group", () => {
      const { at, unmount } = renderFields({ disabled: true });

      expect(at("toggle-button-group")).toHaveAttribute("data-disabled", "true");
      expect(at("grouped-toggle")).toBeDisabled();

      unmount();
    });

    it("disables a checkbox group", async () => {
      // The group renders as a `<div>`, which the browser's own cascade does not reach — so
      // without the context handed down it would stay live inside a disabled fieldset.
      const { at, container, unmount } = renderFields({ disabled: true });

      await nextTick();

      expect(at("checkbox-group")).toHaveAttribute("data-disabled", "true");
      expect(container.querySelector("input[type='checkbox']")).toBeDisabled();

      unmount();
    });

    it("disables a radio group", async () => {
      const { at, container, unmount } = renderFields({ disabled: true });

      await nextTick();

      expect(at("radio-group")).toHaveAttribute("data-disabled", "true");
      expect(container.querySelector("input[type='radio']")).toBeDisabled();

      unmount();
    });

    it("disables a slider", async () => {
      const { at, container, unmount } = renderFields({ disabled: true });

      await nextTick();

      expect(at("slider")).toHaveAttribute("data-disabled", "true");
      expect(container.querySelector("input[type='range']")).toBeDisabled();

      unmount();
    });

    it("leaves every field alone when the fieldset is not disabled", async () => {
      const { at, container, unmount } = renderFields();

      await nextTick();

      expect(at("button")).not.toBeDisabled();
      expect(at("grouped-button")).not.toBeDisabled();
      expect(at("link")).not.toHaveAttribute("aria-disabled");
      expect(at("toggle-button")).not.toBeDisabled();
      expect(at("toggle-button-group")).not.toHaveAttribute("data-disabled");
      expect(at("checkbox-group")).not.toHaveAttribute("data-disabled");
      expect(at("radio-group")).not.toHaveAttribute("data-disabled");
      expect(at("slider")).not.toHaveAttribute("data-disabled");
      expect(container.querySelector("input[type='range']")).not.toBeDisabled();

      unmount();
    });

    it("lets a field's own prop win over what the fieldset hands down", async () => {
      // What the caller puts on the field beats the context, matching how React merges context
      // props — so the reported state and the styling both come back on.
      const { at, unmount } = renderFields({ disabled: true, fieldIsDisabled: false });

      await nextTick();

      expect(at("button")).not.toHaveAttribute("data-disabled");
      expect(at("toggle-button")).not.toHaveAttribute("data-disabled");
      expect(at("checkbox-group")).not.toHaveAttribute("data-disabled");
      expect(at("radio-group")).not.toHaveAttribute("data-disabled");
      expect(at("slider")).not.toHaveAttribute("data-disabled");
      // A link is a span or an anchor, never a form control, so nothing disables it but itself.
      expect(at("link").tagName).toBe("A");
      expect(at("link")).not.toHaveAttribute("aria-disabled");

      unmount();
    });

    it("cannot undo the browser's own cascade with a prop", async () => {
      // `<fieldset disabled>` disables every form control inside it, and no prop on the field
      // reaches that — React is in the same position, which is why it hands the state down
      // through context as well: without it a button would be unclickable while still
      // reporting itself as enabled.
      const { at, container, unmount } = renderFields({ disabled: true, fieldIsDisabled: false });

      await nextTick();

      expect(at("button")).toBeDisabled();
      expect(container.querySelector("input[type='range']")).toBeDisabled();

      unmount();
    });
  });
});
