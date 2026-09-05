import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { nextTick, reactive } from "vue";

import { VALID_VALIDITY_STATE } from "@/composables/use-form-validation-state";

import FieldErrorFixture from "./fixtures.vue";

const renderFieldError = (props: Record<string, unknown> = {}) => {
  const rendered = renderVapor(FieldErrorFixture, { props });
  const error = () => rendered.container.querySelector<HTMLElement>("[data-slot='field-error']");
  const field = () => rendered.container.querySelector<HTMLElement>("[data-testid='field']")!;

  return { ...rendered, error, field };
};

describe("FieldError", () => {
  describe("visibility", () => {
    it("renders nothing while the field is valid", () => {
      const { error, unmount } = renderFieldError({ validationErrors: ["never shown"] });

      expect(error()).toBeNull();

      unmount();
    });

    it("renders nothing outside a field at all", () => {
      const { error, unmount } = renderFieldError({ isInvalid: true, withoutField: true });

      expect(error()).toBeNull();

      unmount();
    });

    it("appears once the field turns invalid", async () => {
      const props = reactive({ isInvalid: false, validationErrors: ["too short"] });
      const { error, unmount } = renderFieldError(props);

      expect(error()).toBeNull();

      props.isInvalid = true;
      await nextTick();

      expect(error()).not.toBeNull();

      unmount();
    });

    it("goes away again once the field recovers", async () => {
      const props = reactive({ isInvalid: true, validationErrors: ["too short"] });
      const { error, unmount } = renderFieldError(props);

      expect(error()).not.toBeNull();

      props.isInvalid = false;
      await nextTick();

      expect(error()).toBeNull();

      unmount();
    });
  });

  describe("structure", () => {
    it("renders the BEM class and its data-slot", () => {
      const { error, unmount } = renderFieldError({ isInvalid: true, validationErrors: ["boom"] });

      expect(error()!.classList.contains("rp-field-error")).toBe(true);
      expect(error()!.getAttribute("data-slot")).toBe("field-error");

      unmount();
    });

    it("marks itself visible, which is what the stylesheet expands it on", () => {
      const { error, unmount } = renderFieldError({ isInvalid: true, validationErrors: ["boom"] });

      expect(error()!.getAttribute("data-visible")).toBe("true");

      unmount();
    });

    it("merges the caller's class", () => {
      const { error, unmount } = renderFieldError({
        class: "mt-2",
        isInvalid: true,
        validationErrors: ["boom"],
      });

      expect(error()!.classList.contains("mt-2")).toBe(true);
      expect(error()!.classList.contains("rp-field-error")).toBe(true);

      unmount();
    });
  });

  describe("message", () => {
    it("shows the field's message by default", () => {
      const { error, unmount } = renderFieldError({
        isInvalid: true,
        validationErrors: ["must be accepted"],
      });

      expect(error()!.textContent).toContain("must be accepted");

      unmount();
    });

    it("joins several messages into one description", () => {
      const { error, unmount } = renderFieldError({
        isInvalid: true,
        validationErrors: ["too short", "already taken"],
      });

      expect(error()!.textContent).toContain("too short already taken");

      unmount();
    });

    it("follows the messages as they change", async () => {
      const props = reactive({ isInvalid: true, validationErrors: ["first"] });
      const { error, unmount } = renderFieldError(props);

      expect(error()!.textContent).toContain("first");

      props.validationErrors = ["second"];
      await nextTick();

      expect(error()!.textContent).toContain("second");

      unmount();
    });

    it("lets the caller word the message instead", () => {
      const { error, unmount } = renderFieldError({
        isInvalid: true,
        validationErrors: ["a", "b"],
        withCustomMessage: true,
      });

      expect(error()!.textContent).not.toContain("a b");
      expect(error()!.querySelector("[data-testid='custom']")).not.toBeNull();

      unmount();
    });

    it("hands the caller the messages and the failing constraint", () => {
      const { container, unmount } = renderFieldError({
        isInvalid: true,
        validationDetails: { ...VALID_VALIDITY_STATE, valid: false, valueMissing: true },
        validationErrors: ["a", "b"],
        withCustomMessage: true,
      });

      expect(container.querySelector("[data-testid='custom']")!.textContent).toBe("2 / true");

      unmount();
    });
  });

  describe("field description", () => {
    it("is pointed at by the field while it is on screen", async () => {
      const { error, field, unmount } = renderFieldError({
        isInvalid: true,
        validationErrors: ["boom"],
      });

      const id = error()!.id;

      // The message claims its id while it mounts, so the field's reference to it lands on
      // the following flush rather than in the same render.
      await nextTick();

      expect(id).toBeTruthy();
      expect(field().getAttribute("aria-describedby")).toBe(id);

      unmount();
    });

    it("leaves the field describing nothing while it is valid", () => {
      const { field, unmount } = renderFieldError({ validationErrors: ["boom"] });

      expect(field().getAttribute("aria-describedby")).toBeNull();

      unmount();
    });

    it("releases the id when it stops rendering, so nothing dangles", async () => {
      const props = reactive({ isInvalid: true, validationErrors: ["boom"] });
      const { field, unmount } = renderFieldError(props);

      await nextTick();
      expect(field().getAttribute("aria-describedby")).toBeTruthy();

      props.isInvalid = false;
      await nextTick();

      expect(field().getAttribute("aria-describedby")).toBeNull();

      unmount();
    });
  });
});
