import type {FormValidationState} from "@/composables/use-form-validation-state";

import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import Harness from "../fixtures/form-validation-input-harness.vue";

/**
 * `props` is passed by reference rather than spread: `renderVapor` reads each key through a
 * getter, so a `reactive` object handed in keeps driving the component.
 */
const renderField = (props: Record<string, unknown> = {}) => {
  let state!: FormValidationState;
  let input!: HTMLInputElement;

  Object.assign(props, {
    onInputElement: (element: HTMLInputElement) => (input = element),
    onReady: (ready: FormValidationState) => (state = ready),
  });

  const rendered = renderVapor(Harness, {props});
  const at = (testId: string) =>
    rendered.container.querySelector<HTMLElement>(`[data-testid='${testId}']`)!;

  return {...rendered, at, input, state};
};

/** Submit without letting jsdom reach its unimplemented navigation path. */
const submit = (form: HTMLFormElement, onSubmit = (event: Event) => event.preventDefault()) => {
  form.addEventListener("submit", onSubmit);
  form.querySelector<HTMLButtonElement>("[data-testid='submit']")!.click();

  return () => form.removeEventListener("submit", onSubmit);
};

describe("useFormValidation", () => {
  describe("custom validity", () => {
    it("mirrors the field's own errors onto the input", async () => {
      const {input, unmount} = renderField({validate: () => "not acceptable"});

      await nextTick();

      expect(input.validity.customError).toBe(true);
      // jsdom's wording is its own, so only the fact that a message exists is asserted.
      expect(input.validationMessage).not.toBe("");

      unmount();
    });

    it("clears the custom error once the field is acceptable", async () => {
      const {input, unmount} = renderField({validate: () => true});

      await nextTick();

      expect(input.validity.customError).toBe(false);
      expect(input.validity.valid).toBe(true);

      unmount();
    });

    it("falls back to a generic message when the field is invalid by prop alone", async () => {
      const {input, unmount} = renderField({isInvalid: true});

      await nextTick();

      expect(input.validity.customError).toBe(true);

      unmount();
    });

    it("gives the element an empty title, so Firefox does not repeat the message", async () => {
      const {input, unmount} = renderField({validate: () => "nope"});

      await nextTick();

      expect(input.getAttribute("title")).toBe("");

      unmount();
    });

    it("leaves a title the caller already set alone", async () => {
      const {input, unmount} = renderField({title: "mine", validate: () => "nope"});

      await nextTick();

      expect(input.getAttribute("title")).toBe("mine");

      unmount();
    });

    it("does not touch the input under aria behaviour", async () => {
      const {input, unmount} = renderField({
        validate: () => "nope",
        validationBehavior: "aria",
      });

      await nextTick();

      expect(input.validity.customError).toBe(false);

      unmount();
    });

    it("skips a disabled input, which the browser excludes from validation anyway", async () => {
      const {input, unmount} = renderField({isDisabled: true, validate: () => "nope"});

      await nextTick();

      expect(input.validity.customError).toBe(false);
      expect(input.willValidate).toBe(false);

      unmount();
    });

    it("reads the browser's verdict back while the field itself is happy", async () => {
      const {state, unmount} = renderField({isRequired: true});

      await nextTick();
      state.commitValidation();
      await nextTick();

      expect(state.displayValidation.value.validationDetails.valueMissing).toBe(true);

      unmount();
    });
  });

  describe("invalid event", () => {
    it("reveals the error when the form refuses to submit", async () => {
      const {at, state, unmount} = renderField({validate: () => "nope"});

      await nextTick();
      expect(state.displayValidation.value.isInvalid).toBe(false);

      const release = submit(at("form") as HTMLFormElement);

      await nextTick();

      expect(state.displayValidation.value.isInvalid).toBe(true);

      await nextTick();

      expect(at("display-invalid").textContent).toBe("true");

      release();
      unmount();
    });

    it("blocks the submit rather than letting the form go through", async () => {
      const onSubmit = vi.fn((event: Event) => event.preventDefault());
      const {at, unmount} = renderField({validate: () => "nope"});

      await nextTick();
      const release = submit(at("form") as HTMLFormElement, onSubmit);

      expect(onSubmit).not.toHaveBeenCalled();

      release();
      unmount();
    });

    it("suppresses the browser's own error bubble", async () => {
      const {input, unmount} = renderField({validate: () => "nope"});

      await nextTick();

      const event = new Event("invalid", {cancelable: true});

      input.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);

      unmount();
    });

    it("focuses the field when it is the first invalid one", async () => {
      const {at, input, unmount} = renderField({validate: () => "nope"});

      await nextTick();
      const release = submit(at("form") as HTMLFormElement);

      expect(document.activeElement).toBe(input);

      release();
      unmount();
    });

    it("leaves focus alone when an earlier field is the invalid one", async () => {
      const {at, input, unmount} = renderField({
        validate: () => "nope",
        withLeadingInput: true,
      });

      await nextTick();
      const release = submit(at("form") as HTMLFormElement);

      // Nothing focuses the leading input — it owns no handler, and jsdom does not focus an
      // invalid control by itself. The point is that this field declines to steal focus.
      expect(document.activeElement).not.toBe(input);

      release();
      unmount();
    });

    it("prefers a caller-supplied focus handler over focusing the input", async () => {
      const onFocusField = vi.fn();
      const {at, input, unmount} = renderField({onFocusField, validate: () => "nope"});

      await nextTick();
      const release = submit(at("form") as HTMLFormElement);

      expect(onFocusField).toHaveBeenCalledOnce();
      expect(document.activeElement).not.toBe(input);

      release();
      unmount();
    });

    it("keeps a server error the user has not fixed on screen", async () => {
      const {input, state, unmount} = renderField({
        isRequired: true,
        name: "terms",
        validationErrors: {terms: "rejected upstream"},
        withForm: true,
      });

      await nextTick();
      expect(state.displayValidation.value.validationErrors).toEqual(["rejected upstream"]);

      input.dispatchEvent(new Event("invalid", {cancelable: true}));
      await nextTick();

      expect(state.displayValidation.value.validationErrors).toEqual(["rejected upstream"]);

      unmount();
    });
  });

  describe("commit triggers", () => {
    it("commits on change", async () => {
      const {input, state, unmount} = renderField({
        validate: (isSelected: boolean) => (isSelected ? "cannot be on" : true),
      });

      await nextTick();
      input.click();
      await nextTick();
      await nextTick();

      expect(state.displayValidation.value.validationErrors).toEqual(["cannot be on"]);

      unmount();
    });

    it("leaves an untouched field alone on blur", async () => {
      const {input, state, unmount} = renderField({validate: () => "nope"});

      await nextTick();
      input.dispatchEvent(new FocusEvent("blur"));
      await nextTick();

      expect(state.displayValidation.value.isInvalid).toBe(false);

      unmount();
    });

    it("commits on blur when the field asks for it", async () => {
      const {input, state, unmount} = renderField({commitOnBlur: true, validate: () => "nope"});

      await nextTick();
      input.dispatchEvent(new FocusEvent("blur"));
      await nextTick();

      expect(state.displayValidation.value.isInvalid).toBe(true);

      unmount();
    });
  });

  describe("form reset", () => {
    it("clears the displayed error", async () => {
      const {at, state, unmount} = renderField({validate: () => "nope"});

      await nextTick();
      const release = submit(at("form") as HTMLFormElement);

      await nextTick();
      expect(state.displayValidation.value.isInvalid).toBe(true);

      (at("form") as HTMLFormElement).reset();
      await nextTick();

      expect(state.displayValidation.value.isInvalid).toBe(false);

      release();
      unmount();
    });

    it("leaves the error alone when the reset was cancelled", async () => {
      const {at, state, unmount} = renderField({preventReset: true, validate: () => "nope"});
      const form = at("form") as HTMLFormElement;

      await nextTick();
      const release = submit(form);

      await nextTick();

      form.reset();
      await nextTick();

      expect(state.displayValidation.value.isInvalid).toBe(true);

      release();
      unmount();
    });
  });

  describe("teardown", () => {
    it("stops listening once the field is gone", async () => {
      const {input, state, unmount} = renderField({validate: () => "nope"});

      await nextTick();
      unmount();

      input.dispatchEvent(new Event("invalid", {cancelable: true}));
      await nextTick();

      expect(state.displayValidation.value.isInvalid).toBe(false);
    });
  });
});
