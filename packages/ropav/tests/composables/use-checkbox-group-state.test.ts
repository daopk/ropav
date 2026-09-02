import type { CheckboxGroupState } from "@/composables/use-checkbox-group-state";

import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import Host from "../fixtures/checkbox-group-state-host.vue";

const renderGroup = (props: Record<string, unknown> = {}) => {
  let state!: CheckboxGroupState;

  Object.assign(props, { onReady: (ready: CheckboxGroupState) => (state = ready) });

  const rendered = renderVapor(Host, { props });
  const input = (value: string) =>
    rendered.container.querySelector<HTMLInputElement>(`[data-testid='input-${value}']`)!;

  return { ...rendered, input, state };
};

describe("useCheckboxGroupState", () => {
  describe("selection", () => {
    it("starts from the default value when uncontrolled", () => {
      const { state, unmount } = renderGroup({ defaultValue: ["email"] });

      expect(state.value.value).toEqual(["email"]);
      expect(state.isSelected("email")).toBe(true);
      expect(state.isSelected("sms")).toBe(false);

      unmount();
    });

    it("adds a value", () => {
      const { state, unmount } = renderGroup();

      state.addValue("email");

      expect(state.value.value).toEqual(["email"]);

      unmount();
    });

    it("ignores adding a value it already holds", () => {
      const { state, unmount } = renderGroup({ defaultValue: ["email"] });

      state.addValue("email");

      expect(state.value.value).toEqual(["email"]);

      unmount();
    });

    it("removes a value", () => {
      const { state, unmount } = renderGroup({ defaultValue: ["email", "sms"] });

      state.removeValue("email");

      expect(state.value.value).toEqual(["sms"]);

      unmount();
    });

    it("toggles in both directions", () => {
      const { state, unmount } = renderGroup();

      state.toggleValue("email", true);
      expect(state.value.value).toEqual(["email"]);

      state.toggleValue("email", false);
      expect(state.value.value).toEqual([]);

      unmount();
    });

    it("reports every change to the caller", () => {
      const onValueChange = vi.fn();
      const { state, unmount } = renderGroup({ onValueChange });

      state.addValue("email");

      expect(onValueChange).toHaveBeenCalledWith(["email"]);

      unmount();
    });

    it("leaves its own state alone while controlled", async () => {
      const props = reactive({ onValueChange: vi.fn(), value: ["email"] });
      const { state, unmount } = renderGroup(props);

      state.addValue("sms");
      await nextTick();

      // The owner of `value` decides — the group only reports what was asked for.
      expect(state.value.value).toEqual(["email"]);
      expect(props.onValueChange).toHaveBeenCalledWith(["email", "sms"]);

      unmount();
    });

    it("follows a controlled value as it changes", async () => {
      const props = reactive({ value: ["email"] });
      const { state, unmount } = renderGroup(props);

      props.value = ["sms"];
      await nextTick();

      expect(state.value.value).toEqual(["sms"]);

      unmount();
    });
  });

  describe("read-only and disabled", () => {
    it("refuses a change while read-only", () => {
      const { state, unmount } = renderGroup({ isReadOnly: true });

      state.addValue("email");

      expect(state.value.value).toEqual([]);

      unmount();
    });

    it("refuses a change while disabled", () => {
      const { state, unmount } = renderGroup({ defaultValue: ["email"], isDisabled: true });

      state.removeValue("email");

      expect(state.value.value).toEqual(["email"]);

      unmount();
    });
  });

  describe("required", () => {
    it("announces requiredness whatever is selected", () => {
      const { state, unmount } = renderGroup({ defaultValue: ["email"], isRequired: true });

      expect(state.isRequired.value).toBe(true);

      unmount();
    });

    it("asks the items to be required only while nothing is selected", async () => {
      const { state, unmount } = renderGroup({ isRequired: true, values: ["email", "sms"] });

      expect(state.isItemRequired.value).toBe(true);

      state.addValue("email");
      await nextTick();

      expect(state.isItemRequired.value).toBe(false);

      unmount();
    });

    it("asks again once the last selection is cleared", async () => {
      const { state, unmount } = renderGroup({
        defaultValue: ["email"],
        isRequired: true,
        values: ["email", "sms"],
      });

      expect(state.isItemRequired.value).toBe(false);

      state.removeValue("email");
      await nextTick();

      expect(state.isItemRequired.value).toBe(true);

      unmount();
    });

    it("never asks the items when the group is not required", () => {
      const { state, unmount } = renderGroup({ values: ["email"] });

      expect(state.isItemRequired.value).toBe(false);

      unmount();
    });

    it("puts required on every item, so the browser refuses the submit", () => {
      const { input, unmount } = renderGroup({ isRequired: true, values: ["email", "sms"] });

      expect(input("email").required).toBe(true);
      expect(input("sms").required).toBe(true);
      expect(input("email").validity.valueMissing).toBe(true);

      unmount();
    });

    it("drops required off every item at once, not just the selected one", async () => {
      const { input, state, unmount } = renderGroup({ isRequired: true, values: ["email", "sms"] });

      state.addValue("email");
      await nextTick();

      // A leftover `required` on an unchecked sibling would keep the form invalid for good.
      expect(input("email").required).toBe(false);
      expect(input("sms").required).toBe(false);
      expect(input("sms").validity.valid).toBe(true);

      unmount();
    });

    it("blocks a submit while nothing is selected, and lets it through after", async () => {
      const onSubmit = vi.fn((event: Event) => event.preventDefault());
      const { container, state, unmount } = renderGroup({
        isRequired: true,
        values: ["email", "sms"],
      });
      const form = container.querySelector("form")!;
      const press = () =>
        container.querySelector<HTMLButtonElement>("[data-testid='submit']")!.click();

      form.addEventListener("submit", onSubmit);

      press();
      expect(onSubmit).not.toHaveBeenCalled();

      state.addValue("email");
      await nextTick();

      press();
      expect(onSubmit).toHaveBeenCalledOnce();

      unmount();
    });
  });

  describe("native validity", () => {
    it("reads the items' verdict back on commit", async () => {
      const { state, unmount } = renderGroup({ isRequired: true, values: ["email", "sms"] });

      state.itemValidation.commitValidation();
      await nextTick();
      await nextTick();

      expect(state.isInvalid.value).toBe(true);
      expect(state.validation.displayValidation.value.validationDetails.valueMissing).toBe(true);

      unmount();
    });

    it("finds nothing to report once an item is selected", async () => {
      const { state, unmount } = renderGroup({ isRequired: true, values: ["email", "sms"] });

      state.addValue("email");
      await nextTick();
      state.itemValidation.commitValidation();
      await nextTick();
      await nextTick();

      expect(state.isInvalid.value).toBe(false);

      unmount();
    });

    it("skips a disabled item, which the browser excludes anyway", async () => {
      const { state, unmount } = renderGroup({
        disabledValues: ["email", "sms"],
        isRequired: true,
        values: ["email", "sms"],
      });

      state.itemValidation.commitValidation();
      await nextTick();
      await nextTick();

      expect(state.isInvalid.value).toBe(false);

      unmount();
    });

    it("stops reading an item that has gone away", async () => {
      const props = reactive({ isRequired: true, values: ["email", "sms"] });
      const { state, unmount } = renderGroup(props);

      props.values = [];
      await nextTick();

      state.itemValidation.commitValidation();
      await nextTick();
      await nextTick();

      expect(state.isInvalid.value).toBe(false);

      unmount();
    });

    it("ignores what an item pushes up, since the group looks for itself", async () => {
      const { state, unmount } = renderGroup({ values: ["email"] });

      state.itemValidation.updateValidation({
        isInvalid: true,
        validationDetails: {
          badInput: false,
          customError: true,
          patternMismatch: false,
          rangeOverflow: false,
          rangeUnderflow: false,
          stepMismatch: false,
          tooLong: false,
          tooShort: false,
          typeMismatch: false,
          valid: false,
          valueMissing: false,
        },
        validationErrors: ["from an item"],
      });
      state.itemValidation.commitValidation();
      await nextTick();
      await nextTick();

      expect(state.isInvalid.value).toBe(false);

      unmount();
    });
  });

  describe("group validation", () => {
    it("prefers the group's own message over the browser's", async () => {
      const { state, unmount } = renderGroup({
        isRequired: true,
        validate: (value: string[]) => (value.length > 0 ? true : "pick at least one"),
        values: ["email", "sms"],
      });

      state.itemValidation.commitValidation();
      await nextTick();
      await nextTick();

      expect(state.validation.displayValidation.value.validationErrors).toEqual([
        "pick at least one",
      ]);

      unmount();
    });

    it("lets a controlled isInvalid take the group over", () => {
      const { state, unmount } = renderGroup({ isInvalid: true, values: ["email"] });

      expect(state.isInvalid.value).toBe(true);

      unmount();
    });

    it("treats an absent isInvalid as no claim at all", () => {
      const { state, unmount } = renderGroup({ values: ["email"] });

      expect(state.isInvalid.value).toBe(false);
      expect(state.validation.realtimeValidation.value.isInvalid).toBe(false);

      unmount();
    });
  });
});
