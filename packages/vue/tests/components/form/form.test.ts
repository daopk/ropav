import type {FormValidationState} from "@/composables/use-form-validation-state";

import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";

import FormFixture from "./fixtures.vue";

const renderForm = (props: Record<string, unknown> = {}) => {
  const rendered = renderVapor(FormFixture, {props});

  return {...rendered, form: rendered.container.querySelector("form")!};
};

/** Mount a form around a field and hand back the field's live validation state. */
const renderFormWithField = (props: Record<string, unknown> = {}) => {
  let state!: FormValidationState;
  const field = {
    ...((props["field"] as Record<string, unknown>) ?? {}),
    onReady: (ready: FormValidationState) => (state = ready),
  };

  const rendered = renderForm({...props, field});

  return {...rendered, state};
};

describe("Form", () => {
  describe("structure", () => {
    // No `data-slot`, matching React: its form is a thin pass-through to the React Aria one, and
    // that renders none. Pinned so it does not grow one back.
    it("renders a form element with no slot marker of its own", () => {
      const {form, unmount} = renderForm();

      expect(form).not.toBeNull();
      expect(form).not.toHaveAttribute("data-slot");

      unmount();
    });

    it("applies the caller's class", () => {
      const {form, unmount} = renderForm({class: "gap-4"});

      expect(form.classList.contains("gap-4")).toBe(true);

      unmount();
    });
  });

  describe("native validation", () => {
    it("leaves the browser in charge by default", () => {
      const {form, unmount} = renderForm();

      expect(form.noValidate).toBe(false);

      unmount();
    });

    it("keeps the browser in charge when asked for native behaviour", () => {
      const {form, unmount} = renderForm({validationBehavior: "native"});

      expect(form.noValidate).toBe(false);

      unmount();
    });

    it("turns the browser off when the fields report through ARIA instead", () => {
      const {form, unmount} = renderForm({validationBehavior: "aria"});

      expect(form.noValidate).toBe(true);

      unmount();
    });
  });

  describe("native events", () => {
    it("lets a submit listener through to the form element", () => {
      const onSubmit = vi.fn((event: Event) => event.preventDefault());
      const {container, unmount} = renderVapor(FormFixture, {props: {onSubmit}});

      container.querySelector<HTMLButtonElement>("[data-testid='submit']")!.click();

      expect(onSubmit).toHaveBeenCalledOnce();

      unmount();
    });

    it("lets a reset listener through to the form element", () => {
      const onReset = vi.fn();
      const {container, unmount} = renderVapor(FormFixture, {props: {onReset}});

      container.querySelector("form")!.reset();

      expect(onReset).toHaveBeenCalledOnce();

      unmount();
    });
  });

  describe("context", () => {
    it("hands a server error down to the field that submits under that name", () => {
      const {state, unmount} = renderFormWithField({
        field: {name: "email"},
        validationErrors: {email: "already taken"},
      });

      expect(state.displayValidation.value.validationErrors).toEqual(["already taken"]);

      unmount();
    });

    it("keeps another field's error to itself", () => {
      const {state, unmount} = renderFormWithField({
        field: {name: "email"},
        validationErrors: {password: "too short"},
      });

      expect(state.displayValidation.value.isInvalid).toBe(false);

      unmount();
    });

    it("sets the default validation behaviour of the fields inside", () => {
      const {state, unmount} = renderFormWithField({validationBehavior: "aria"});

      expect(state.validationBehavior.value).toBe("aria");

      unmount();
    });

    it("defaults those fields to native", () => {
      const {state, unmount} = renderFormWithField();

      expect(state.validationBehavior.value).toBe("native");

      unmount();
    });

    it("shows a field's own error at once under aria behaviour", () => {
      const {state, unmount} = renderFormWithField({
        field: {validate: () => "not acceptable", value: true},
        validationBehavior: "aria",
      });

      expect(state.displayValidation.value.validationErrors).toEqual(["not acceptable"]);

      unmount();
    });

    it("holds a field's own error back under native behaviour", () => {
      const {state, unmount} = renderFormWithField({
        field: {validate: () => "not acceptable", value: true},
      });

      expect(state.realtimeValidation.value.isInvalid).toBe(true);
      expect(state.displayValidation.value.isInvalid).toBe(false);

      unmount();
    });
  });
});
