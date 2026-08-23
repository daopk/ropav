import type {UseTextFieldReturn} from "@/composables/use-text-field";

import {renderVapor} from "@ropav/testing/helpers/vue";
import {afterEach, describe, expect, it, vi} from "vitest";
import {effectScope, nextTick, reactive} from "vue";

import Harness from "../fixtures/text-field-harness.vue";
import {expectResetSource} from "../harness/form-reset";

const cleanups: (() => void)[] = [];

/**
 * Mount the harness and hand back the live field alongside its control.
 *
 * A component rather than a bare `effectScope`, because the composable injects the form
 * context and `inject` outside a component returns `undefined` rather than the default.
 *
 * `props` is passed by reference: `renderVapor` reads each key through a getter, so a
 * `reactive` object handed in here keeps driving the component.
 */
const renderField = (props: Record<string, unknown> = {}) => {
  let field!: UseTextFieldReturn;

  Object.assign(props, {onReady: (ready: UseTextFieldReturn) => (field = ready)});

  const result = renderVapor(Harness, {props});

  cleanups.push(() => result.unmount());

  const control = result.container.querySelector("input, textarea");

  if (!control) throw new Error("control not rendered");

  return {
    ...result,
    control: control as HTMLInputElement | HTMLTextAreaElement,
    field,
    form: result.container.querySelector("form"),
  };
};

/** A claimed slot, standing in for a rendered `Description` or `FieldError`. */
const claim = (claimId: () => string | undefined) => {
  const scope = effectScope();

  cleanups.push(() => scope.stop());

  return {id: scope.run(claimId) as string | undefined, release: () => scope.stop()};
};

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
});

describe("useTextField", () => {
  describe("attributes", () => {
    it("carries no listener, so the whole bag is safe to spread", () => {
      // A listener reaching a vapor element through `v-bind` is re-attached on every render
      // and lost mid-dispatch. Asserting the shape is cheaper than rediscovering that.
      const {field} = renderField();

      const listenerKeys = Object.keys(field.attrs.value).filter((key) => /^on/i.test(key));

      expect(listenerKeys).toEqual([]);
    });

    it("defaults the control to a text input", () => {
      const {control, field} = renderField();

      expect(field.attrs.value["type"]).toBe("text");
      // Vue writes `type` as a DOM property and skips an unchanged value, so the default
      // never reaches the markup as an attribute.
      expect(control.getAttribute("type")).toBeNull();
      expect((control as HTMLInputElement).type).toBe("text");
    });

    it("drops type and pattern once a textarea registers", async () => {
      // Neither is valid on a textarea, and only the element itself can settle which it is.
      const {control, field} = renderField({
        elementType: "textarea",
        pattern: "[0-9]*",
        type: "email",
      });

      await nextTick();

      expect(control.tagName).toBe("TEXTAREA");
      expect(field.attrs.value["type"]).toBeUndefined();
      expect(field.attrs.value["pattern"]).toBeUndefined();
      expect(control.hasAttribute("pattern")).toBe(false);
    });

    it("keeps type and pattern for an input", async () => {
      const {control, field} = renderField({pattern: "[0-9]*", type: "email"});

      await nextTick();

      expect(field.attrs.value["type"]).toBe("email");
      expect(field.attrs.value["pattern"]).toBe("[0-9]*");
      expect(control).toHaveAttribute("pattern", "[0-9]*");
    });

    it("drops an absent key instead of handing it over as undefined", () => {
      // Handing `undefined` on has two failure modes: a reflected DOM property gets set to
      // its coerced default and renders an attribute nobody asked for, and a control merging
      // this bag over its own props has them wiped by keys the field never set.
      const {field} = renderField();

      const undefinedKeys = Object.entries(field.attrs.value)
        .filter(([, value]) => value === undefined)
        .map(([key]) => key);

      expect(undefinedKeys).toEqual([]);
      expect(field.attrs.value).not.toHaveProperty("spellcheck");
      expect(field.attrs.value).not.toHaveProperty("placeholder");
    });

    it("leaves an absent state off rather than rendering it false", () => {
      const {control, field} = renderField();

      expect(field.attrs.value["disabled"]).toBeUndefined();
      expect(field.attrs.value["readonly"]).toBeUndefined();
      expect(field.attrs.value["required"]).toBeUndefined();
      expect(field.attrs.value["aria-invalid"]).toBeUndefined();
      expect(control).not.toHaveAttribute("disabled");
      expect(control).not.toHaveAttribute("aria-invalid");
    });
  });

  describe("required", () => {
    it("renders the attribute the browser enforces under native behaviour", () => {
      const {control, field} = renderField({isRequired: true, validationBehavior: "native"});

      expect(field.attrs.value["required"]).toBe(true);
      expect(field.attrs.value["aria-required"]).toBeUndefined();
      expect(control).toBeRequired();
    });

    it("announces requiredness instead when the browser is not enforcing it", () => {
      const {control, field} = renderField({isRequired: true, validationBehavior: "aria"});

      expect(field.attrs.value["required"]).toBeUndefined();
      expect(field.attrs.value["aria-required"]).toBe(true);
      // The attribute the browser enforces must stay off; only the announcement is there.
      expect(control).not.toHaveAttribute("required");
      expect(control).toHaveAttribute("aria-required", "true");
    });
  });

  describe("label wiring", () => {
    it("points the label at the control and the control back at the label", () => {
      // Both directions are needed: `aria-labelledby` names the control, `for` is what makes
      // a click on the label move focus into it.
      const {field} = renderField();
      const labelId = claim(() => field.fieldIds.claimLabelId()).id;

      expect(field.fieldIds.labelFor.value).toBe(field.inputId.value);
      expect(field.attrs.value["aria-labelledby"]).toBe(labelId);
    });

    it("leaves aria-labelledby off when nothing claimed a label", () => {
      const {field} = renderField();

      expect(field.attrs.value["aria-labelledby"]).toBeUndefined();
    });

    it("takes a caller id for the control, so a label points at that", () => {
      const {control, field} = renderField({id: "email"});

      expect(control).toHaveAttribute("id", "email");
      expect(field.inputId.value).toBe("email");
      expect(field.attrs.value["id"]).toBe("email");
      expect(field.fieldIds.labelFor.value).toBe("email");
    });

    it("joins its own id in front when it has both a name and a chain", () => {
      // Otherwise assistive technology reads the chain instead of the name rather than
      // alongside it.
      const {field} = renderField({ariaLabel: "Email", ariaLabelledby: "hint"});

      expect(field.attrs.value["aria-labelledby"]).toBe(`${field.inputId.value} hint`);
    });

    it("uses the chain as given when there is no name of its own", () => {
      const {field} = renderField({ariaLabelledby: "hint"});

      expect(field.attrs.value["aria-labelledby"]).toBe("hint");
    });
  });

  describe("describedby", () => {
    it("lists only the slots something actually rendered", () => {
      const {field} = renderField();

      expect(field.attrs.value["aria-describedby"]).toBeUndefined();

      const description = claim(() => field.fieldIds.claimDescriptionId());

      expect(field.attrs.value["aria-describedby"]).toBe(description.id);
    });

    it("puts the description before the error message", () => {
      const {field} = renderField();
      const description = claim(() => field.fieldIds.claimDescriptionId());
      const errorMessage = claim(() => field.fieldIds.claimErrorMessageId());

      expect(field.attrs.value["aria-describedby"]).toBe(`${description.id} ${errorMessage.id}`);
    });

    it("appends what the caller described the field with", () => {
      const {field} = renderField({ariaDescribedby: "external"});
      const description = claim(() => field.fieldIds.claimDescriptionId());

      expect(field.attrs.value["aria-describedby"]).toBe(`${description.id} external`);
    });

    it("drops a slot again once its part goes away", () => {
      const {field} = renderField();
      const description = claim(() => field.fieldIds.claimDescriptionId());

      description.release();

      expect(field.attrs.value["aria-describedby"]).toBeUndefined();
    });
  });

  describe("value", () => {
    it("starts empty", () => {
      const {field} = renderField();

      expect(field.value.value).toBe("");
    });

    it("supports a default value", () => {
      const {control, field} = renderField({defaultValue: "hello"});

      expect(field.value.value).toBe("hello");
      expect(control.value).toBe("hello");
    });

    it("reports what the user typed", async () => {
      const onChange = vi.fn();
      const {control, field} = renderField({onChange});

      control.value = "typed";
      control.dispatchEvent(new Event("input"));
      await nextTick();

      expect(field.value.value).toBe("typed");
      expect(onChange).toHaveBeenCalledWith("typed");
    });

    it("puts the text back when a controlled owner declines the change", async () => {
      // The browser has already moved the text, and a binding whose value did not change is
      // skipped, so nothing else would restore it.
      const onChange = vi.fn();
      const {control, field} = renderField({onChange, value: "fixed"});

      control.value = "typed";
      control.dispatchEvent(new Event("input"));
      await nextTick();

      expect(onChange).toHaveBeenCalledWith("typed");
      expect(field.value.value).toBe("fixed");
      expect(control.value).toBe("fixed");
    });

    it("follows a controlled value its owner does accept", async () => {
      const props = reactive({value: "first"});
      const {control, field} = renderField(props);

      expect(field.value.value).toBe("first");

      props.value = "second";
      await nextTick();

      expect(field.value.value).toBe("second");
      expect(control.value).toBe("second");
    });
  });

  describe("form reset", () => {
    it("restores the default value and rewrites the control", async () => {
      // A reset restores the element from its `value` attribute, which the binding never
      // wrote, so state and element would otherwise disagree from then on.
      const {control, field, form} = renderField({defaultValue: "default", withForm: true});

      await nextTick();

      control.value = "typed";
      control.dispatchEvent(new Event("input"));
      await nextTick();

      expect(field.value.value).toBe("typed");

      form!.reset();
      await nextTick();

      expect(field.value.value).toBe("default");
      expect(control.value).toBe("default");
    });

    it("leaves the value alone when a reset is cancelled", async () => {
      const {control, field, form} = renderField({
        cancelReset: true,
        defaultValue: "default",
        withForm: true,
      });

      await nextTick();

      control.value = "typed";
      control.dispatchEvent(new Event("input"));
      await nextTick();

      form!.reset();
      await nextTick();

      expect(field.value.value).toBe("typed");
    });

    it("carries the value a reset restores from, on an input", async () => {
      // The assertion the three tests below cannot make. A reset in jsdom is synchronous, so the
      // post-flush property write always lands after it and their `control.value` check passes
      // whether or not the reset source is written at all. This one goes red without it.
      const {control} = renderField({defaultValue: "default", withForm: true});

      await nextTick();
      expectResetSource(control, "default");

      control.value = "typed";
      control.dispatchEvent(new Event("input"));
      await nextTick();

      // In step with the state, not pinned to the default: whatever order the browser restores in,
      // it restores what the field already holds.
      expectResetSource(control, "typed");
    });

    it("carries the text a reset restores from, on a textarea", async () => {
      // A different mechanism, not a second case of the same one: a textarea has no `value`
      // attribute, so its default lives in its child text content.
      const {control} = renderField({
        defaultValue: "default",
        elementType: "textarea",
        withForm: true,
      });

      await nextTick();
      expectResetSource(control, "default");

      control.value = "typed";
      control.dispatchEvent(new Event("input"));
      await nextTick();

      expectResetSource(control, "typed");
    });

    it("stays out of the way for a field that restores its own value", async () => {
      const {control, field, form} = renderField({
        defaultValue: "default",
        skipFormReset: true,
        withForm: true,
      });

      await nextTick();

      control.value = "typed";
      control.dispatchEvent(new Event("input"));
      await nextTick();

      form!.reset();
      await nextTick();

      expect(field.value.value).toBe("typed");
    });
  });

  describe("validation", () => {
    it("reports a custom verdict as invalid", () => {
      const {control, field} = renderField({
        validate: () => "Too short",
        validationBehavior: "aria",
      });

      expect(field.isInvalid.value).toBe(true);
      expect(control).toHaveAttribute("aria-invalid", "true");
    });

    it("lets a caller pin the field valid, shadowing its own verdict", () => {
      const {field} = renderField({
        isInvalid: false,
        validate: () => "Too short",
        validationBehavior: "aria",
      });

      expect(field.isInvalid.value).toBe(false);
    });

    it("hands the browser the field's own verdict", async () => {
      const {control} = renderField({
        validate: () => "Too short",
        validationBehavior: "native",
      });

      await nextTick();

      expect(control.validationMessage).toBe("Too short");
      expect(control.checkValidity()).toBe(false);
    });

    it("uses a validation state built elsewhere rather than starting a second one", () => {
      // A number field validates the number it parsed, so a state over the text would give
      // the same field two verdicts that disagree.
      const outer = renderField({validate: () => "Outer says no", validationBehavior: "aria"});
      const inner = renderField({validationState: outer.field.validation});

      expect(inner.field.validation).toBe(outer.field.validation);
      expect(inner.field.isInvalid.value).toBe(true);
    });
  });

  describe("focus", () => {
    it("reports focus moving in and out", () => {
      const onFocusChange = vi.fn();
      const {control} = renderField({onFocusChange});

      control.dispatchEvent(new FocusEvent("focus"));

      expect(onFocusChange).toHaveBeenLastCalledWith(true);

      control.dispatchEvent(new FocusEvent("blur"));

      expect(onFocusChange).toHaveBeenLastCalledWith(false);
    });

    it("takes focus when the control first reports itself", async () => {
      const {control} = renderField({autoFocus: true});

      await nextTick();

      expect(document.activeElement).toBe(control);
    });

    it("leaves focus alone without autoFocus", async () => {
      const {control} = renderField();

      await nextTick();

      expect(document.activeElement).not.toBe(control);
    });
  });

  describe("keyboard", () => {
    it("forwards keydown and keyup to the caller", () => {
      const onKeydownForward = vi.fn();
      const onKeyupForward = vi.fn();
      const {control} = renderField({onKeydownForward, onKeyupForward});

      control.dispatchEvent(new KeyboardEvent("keydown", {key: "Enter"}));
      control.dispatchEvent(new KeyboardEvent("keyup", {key: "Enter"}));

      expect(onKeydownForward).toHaveBeenCalledOnce();
      expect(onKeydownForward.mock.calls[0]![0]).toHaveProperty("key", "Enter");
      expect(onKeyupForward).toHaveBeenCalledOnce();
    });
  });
});
