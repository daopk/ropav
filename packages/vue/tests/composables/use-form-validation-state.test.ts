import type {FormValidationState, ValidationResult} from "@/composables/use-form-validation-state";

import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {nextTick, reactive, watch} from "vue";

import {
  CUSTOM_VALIDITY_STATE,
  DEFAULT_VALIDATION_RESULT,
  VALID_VALIDITY_STATE,
  isEqualValidation,
} from "@/composables/use-form-validation-state";

import Harness from "../fixtures/form-validation-harness.vue";

/**
 * Mount the harness and hand back the live state alongside the render result.
 *
 * `props` is passed through by reference rather than spread: `renderVapor` reads each key
 * through a getter, so a `reactive` object handed in here keeps driving the component, and
 * copying it would freeze the props at their first values.
 */
const renderState = (props: Record<string, unknown> = {}) => {
  let state!: FormValidationState;

  Object.assign(props, {onReady: (ready: FormValidationState) => (state = ready)});

  return {...renderVapor(Harness, {props}), state};
};

const read = (container: HTMLElement, testId: string) =>
  container.querySelector(`[data-testid='${testId}']`)?.textContent;

const nativeResult = (overrides: Partial<ValidationResult["validationDetails"]>) => ({
  isInvalid: true,
  validationDetails: {...VALID_VALIDITY_STATE, valid: false, ...overrides},
  validationErrors: ["from the browser"],
});

describe("useFormValidationState", () => {
  describe("precedence", () => {
    it("lets a controlled isInvalid shadow every other source", () => {
      const {state, unmount} = renderState({
        isInvalid: true,
        name: "field",
        validate: () => "from validate",
        validationErrors: {field: "from the server"},
        withForm: true,
      });

      expect(state.realtimeValidation.value.isInvalid).toBe(true);
      // A prop cannot carry a message, so the field is invalid with nothing to say.
      expect(state.realtimeValidation.value.validationErrors).toEqual([]);

      unmount();
    });

    it("treats isInvalid false as a claim of validity, not as an absent prop", () => {
      const {state, unmount} = renderState({
        isInvalid: false,
        validate: () => "from validate",
        validationBehavior: "aria",
      });

      expect(state.realtimeValidation.value.isInvalid).toBe(false);
      expect(state.displayValidation.value.isInvalid).toBe(false);

      unmount();
    });

    it("reports a valid validity state for isInvalid false", () => {
      const {state, unmount} = renderState({isInvalid: false});

      expect(state.realtimeValidation.value.validationDetails).toEqual(VALID_VALIDITY_STATE);

      unmount();
    });

    it("marks a prop-driven failure as a custom error", () => {
      const {state, unmount} = renderState({isInvalid: true});

      expect(state.realtimeValidation.value.validationDetails).toEqual(CUSTOM_VALIDITY_STATE);

      unmount();
    });

    it("prefers a server error over validate", () => {
      const {state, unmount} = renderState({
        name: "field",
        validate: () => "from validate",
        validationErrors: {field: "from the server"},
        withForm: true,
      });

      expect(state.realtimeValidation.value.validationErrors).toEqual(["from the server"]);

      unmount();
    });

    it("prefers validate over a builtin result", () => {
      const {state, unmount} = renderState({
        builtinValidation: nativeResult({valueMissing: true}),
        validate: () => "from validate",
      });

      expect(state.realtimeValidation.value.validationErrors).toEqual(["from validate"]);

      unmount();
    });

    it("ignores a builtin result that passes", () => {
      const {state, unmount} = renderState({builtinValidation: DEFAULT_VALIDATION_RESULT});

      expect(state.realtimeValidation.value).toEqual(DEFAULT_VALIDATION_RESULT);

      unmount();
    });
  });

  describe("validate", () => {
    it("accepts a single message", () => {
      const {state, unmount} = renderState({validate: () => "nope", value: true});

      expect(state.realtimeValidation.value.validationErrors).toEqual(["nope"]);

      unmount();
    });

    it("accepts several messages", () => {
      const {state, unmount} = renderState({validate: () => ["one", "two"], value: true});

      expect(state.realtimeValidation.value.validationErrors).toEqual(["one", "two"]);

      unmount();
    });

    it.each([
      ["true", true],
      ["null", null],
      ["undefined", undefined],
      ["an empty array", []],
    ])("treats %s as acceptable", (_label, result) => {
      const {state, unmount} = renderState({validate: () => result, value: true});

      expect(state.realtimeValidation.value.isInvalid).toBe(false);

      unmount();
    });

    it("skips validation entirely when the value is null", () => {
      const {state, unmount} = renderState({validate: () => "never runs", value: null});

      expect(state.realtimeValidation.value.isInvalid).toBe(false);

      unmount();
    });

    it("re-runs when the value changes", async () => {
      const props = reactive({
        validate: (value: boolean) => (value ? true : "must be on"),
        validationBehavior: "aria" as const,
        value: false,
      });
      const {state, unmount} = renderState(props);

      expect(state.realtimeValidation.value.isInvalid).toBe(true);

      props.value = true;
      await nextTick();

      expect(state.realtimeValidation.value.isInvalid).toBe(false);

      unmount();
    });
  });

  describe("validation behavior", () => {
    it("defaults to native with no form above it", () => {
      const {container, state, unmount} = renderState();

      expect(state.validationBehavior.value).toBe("native");
      expect(read(container, "behavior")).toBe("native");

      unmount();
    });

    it("takes the surrounding form's default", () => {
      const {state, unmount} = renderState({formValidationBehavior: "aria", withForm: true});

      expect(state.validationBehavior.value).toBe("aria");

      unmount();
    });

    it("lets the field override the form", () => {
      const {state, unmount} = renderState({
        formValidationBehavior: "aria",
        validationBehavior: "native",
        withForm: true,
      });

      expect(state.validationBehavior.value).toBe("native");

      unmount();
    });
  });

  describe("aria behavior", () => {
    it("displays a validate error with no commit", () => {
      const {state, unmount} = renderState({
        validate: () => "shown at once",
        validationBehavior: "aria",
        value: true,
      });

      expect(state.displayValidation.value.validationErrors).toEqual(["shown at once"]);

      unmount();
    });

    it("reveals an updated validation immediately", async () => {
      const {state, unmount} = renderState({validationBehavior: "aria"});

      state.updateValidation(nativeResult({valueMissing: true}));
      await nextTick();

      expect(state.displayValidation.value.isInvalid).toBe(true);

      unmount();
    });
  });

  describe("native behavior", () => {
    it("hides a validate error until the field commits", async () => {
      const {state, unmount} = renderState({validate: () => "hidden until commit", value: true});

      expect(state.realtimeValidation.value.isInvalid).toBe(true);
      expect(state.displayValidation.value.isInvalid).toBe(false);

      state.commitValidation();
      await nextTick();

      expect(state.displayValidation.value.validationErrors).toEqual(["hidden until commit"]);

      unmount();
    });

    it("defers the commit rather than applying it inline", () => {
      const {state, unmount} = renderState({validate: () => "later", value: true});

      state.commitValidation();

      // Still hidden — the commit reads the value a tick later, once the input it mirrors
      // has settled.
      expect(state.displayValidation.value.isInvalid).toBe(false);

      unmount();
    });

    it("collapses repeated commits in one tick into a single reveal", async () => {
      const {state, unmount} = renderState({validate: () => "once", value: true});
      let reveals = 0;
      const stop = watch(state.displayValidation, () => {
        reveals += 1;
      });

      state.commitValidation();
      state.commitValidation();
      state.commitValidation();
      await nextTick();
      await nextTick();

      expect(state.displayValidation.value.isInvalid).toBe(true);
      expect(reveals).toBe(1);

      stop();
      unmount();
    });

    it("holds an updated validation back until commit", async () => {
      const {state, unmount} = renderState();

      state.updateValidation(nativeResult({valueMissing: true}));
      await nextTick();

      expect(state.displayValidation.value.isInvalid).toBe(false);

      state.commitValidation();
      await nextTick();

      expect(state.displayValidation.value.validationErrors).toEqual(["from the browser"]);

      unmount();
    });
  });

  describe("reset", () => {
    it("puts the displayed state back to valid", async () => {
      const {state, unmount} = renderState({validate: () => "boom", value: true});

      state.commitValidation();
      await nextTick();
      expect(state.displayValidation.value.isInvalid).toBe(true);

      state.resetValidation();
      expect(state.displayValidation.value.isInvalid).toBe(false);

      unmount();
    });

    it("cancels a commit that was already queued", async () => {
      const {state, unmount} = renderState({validate: () => "boom", value: true});

      state.commitValidation();
      state.resetValidation();
      await nextTick();

      expect(state.displayValidation.value.isInvalid).toBe(false);

      unmount();
    });
  });

  describe("server errors", () => {
    it("shows the error registered under the field name", () => {
      const {container, state, unmount} = renderState({
        name: "email",
        validationErrors: {email: "already taken"},
        withForm: true,
      });

      expect(state.displayValidation.value.validationErrors).toEqual(["already taken"]);
      expect(read(container, "display-errors")).toBe("already taken");

      unmount();
    });

    it("accepts several messages for one field", () => {
      const {state, unmount} = renderState({
        name: "email",
        validationErrors: {email: ["too short", "already taken"]},
        withForm: true,
      });

      expect(state.displayValidation.value.validationErrors).toEqual([
        "too short",
        "already taken",
      ]);

      unmount();
    });

    it("gathers the errors of every name a composite field submits under", () => {
      const {state, unmount} = renderState({
        name: ["start", "end"],
        validationErrors: {end: "too late", start: "too early"},
        withForm: true,
      });

      expect(state.displayValidation.value.validationErrors).toEqual(["too early", "too late"]);

      unmount();
    });

    it("ignores errors belonging to another field", () => {
      const {state, unmount} = renderState({
        name: "email",
        validationErrors: {password: "too short"},
        withForm: true,
      });

      expect(state.displayValidation.value.isInvalid).toBe(false);

      unmount();
    });

    it("hides the error once the user acts on the field", async () => {
      const {state, unmount} = renderState({
        name: "email",
        validationErrors: {email: "already taken"},
        withForm: true,
      });

      state.commitValidation();
      await nextTick();

      expect(state.displayValidation.value.isInvalid).toBe(false);

      unmount();
    });

    it("shows them again when the server answers afresh", async () => {
      const props = reactive({
        name: "email",
        validationErrors: {email: "already taken"} as Record<string, string>,
        withForm: true,
      });
      const {state, unmount} = renderState(props);

      state.commitValidation();
      await nextTick();
      expect(state.displayValidation.value.isInvalid).toBe(false);

      // A new object is what marks a new response; mutating the old one would not.
      props.validationErrors = {email: "still taken"};
      await nextTick();

      expect(state.displayValidation.value.validationErrors).toEqual(["still taken"]);

      unmount();
    });

    it("keeps them hidden while the same response is still on screen", async () => {
      const errors = {email: "already taken"};
      const props = reactive({name: "email", validationErrors: errors, withForm: true});
      const {state, unmount} = renderState(props);

      state.commitValidation();
      await nextTick();

      // Same object identity — the user has not been answered again.
      props.validationErrors = errors;
      await nextTick();

      expect(state.displayValidation.value.isInvalid).toBe(false);

      unmount();
    });

    it("ignores a form's errors for a field that submits no name", () => {
      const {state, unmount} = renderState({
        validationErrors: {email: "already taken"},
        withForm: true,
      });

      expect(state.displayValidation.value.isInvalid).toBe(false);

      unmount();
    });
  });

  describe("a state owned from outside", () => {
    it("hands it straight back rather than building one", () => {
      // A picker holds the value and the bounds, so its verdict is the only one that can be
      // right; a second state built here would disagree with it about the same value.
      const owner = renderState({validate: () => "from the owner", value: "x"});
      const borrower = renderState({validationState: owner.state, value: "x"});

      expect(borrower.state).toBe(owner.state);
      borrower.unmount();
      owner.unmount();
    });

    it("ignores every other option it was given", () => {
      const owner = renderState({value: "x"});
      const borrower = renderState({
        isInvalid: true,
        validate: () => "ignored",
        validationState: owner.state,
        value: "x",
      });

      expect(borrower.state.displayValidation.value.isInvalid).toBe(false);
      expect(read(borrower.container, "display-invalid")).toBe("false");
      borrower.unmount();
      owner.unmount();
    });

    it("reports what the owner reveals", async () => {
      const owner = renderState({validate: () => "from the owner", value: "x"});
      const borrower = renderState({validationState: owner.state, value: "x"});

      expect(read(borrower.container, "display-invalid")).toBe("false");

      owner.state.commitValidation();

      // Three ticks: the commit writes a ref, the computed chain settles, then the DOM is written.
      await nextTick();
      await nextTick();
      await nextTick();

      expect(borrower.state.displayValidation.value.isInvalid).toBe(true);
      expect(read(borrower.container, "display-invalid")).toBe("true");
      expect(read(borrower.container, "display-errors")).toBe("from the owner");
      borrower.unmount();
      owner.unmount();
    });
  });

  describe("isEqualValidation", () => {
    it("holds for the same reference", () => {
      expect(isEqualValidation(DEFAULT_VALIDATION_RESULT, DEFAULT_VALIDATION_RESULT)).toBe(true);
    });

    it("holds for an equal but freshly built result", () => {
      expect(
        isEqualValidation(DEFAULT_VALIDATION_RESULT, {
          isInvalid: false,
          validationDetails: {...VALID_VALIDITY_STATE},
          validationErrors: [],
        }),
      ).toBe(true);
    });

    it("fails when the messages differ", () => {
      expect(
        isEqualValidation(
          {isInvalid: true, validationDetails: CUSTOM_VALIDITY_STATE, validationErrors: ["a"]},
          {isInvalid: true, validationDetails: CUSTOM_VALIDITY_STATE, validationErrors: ["b"]},
        ),
      ).toBe(false);
    });

    it("fails when the failing constraint differs", () => {
      expect(
        isEqualValidation(
          {isInvalid: true, validationDetails: CUSTOM_VALIDITY_STATE, validationErrors: []},
          {
            isInvalid: true,
            validationDetails: {...VALID_VALIDITY_STATE, valid: false, valueMissing: true},
            validationErrors: [],
          },
        ),
      ).toBe(false);
    });

    it("fails against nothing at all", () => {
      expect(isEqualValidation(DEFAULT_VALIDATION_RESULT, null)).toBe(false);
    });
  });
});
