import {renderVapor} from "@ropav/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick, reactive} from "vue";

import Fixture from "./fixtures.vue";
import FormFixture from "./form-fixtures.vue";

const renderField = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, {props});
  const root = result.container.querySelector('[data-slot="textfield"]');

  if (!root) throw new Error("field not rendered");

  return {
    ...result,
    control: result.container.querySelector("input, textarea") as
      | HTMLInputElement
      | HTMLTextAreaElement,
    root,
  };
};

const renderForm = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(FormFixture, {props});

  return {
    ...result,
    control: result.container.querySelector("input, textarea") as HTMLInputElement,
    form: result.container.querySelector("form")!,
    submitButton: result.container.querySelector<HTMLButtonElement>("[data-testid='submit']")!,
  };
};

/** Press submit with the form's own navigation suppressed. */
const submit = (form: HTMLFormElement, button: HTMLButtonElement) => {
  const onSubmit = (event: Event) => event.preventDefault();

  form.addEventListener("submit", onSubmit);
  button.click();

  return () => form.removeEventListener("submit", onSubmit);
};

const type = (control: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  control.value = value;
  control.dispatchEvent(new Event("input"));
};

describe("TextField", () => {
  describe("structure", () => {
    it("renders every part with its data-slot", () => {
      const {container, root, unmount} = renderField({
        withDescription: true,
      });

      expect(root).toHaveAttribute("data-slot", "textfield");
      expect(container.querySelector('[data-slot="label"]')).not.toBeNull();
      expect(container.querySelector('[data-slot="input"]')).not.toBeNull();
      expect(container.querySelector('[data-slot="description"]')).not.toBeNull();

      unmount();
    });

    it("renders the BEM classes of each part", () => {
      const {container, root, unmount} = renderField();

      expect(root).toHaveClass("textfield");
      expect(container.querySelector('[data-slot="input"]')).toHaveClass("input", "input--primary");

      unmount();
    });

    it("renders a textarea in place of the input when asked", () => {
      const {container, unmount} = renderField({withTextArea: true});

      expect(container.querySelector('[data-slot="textarea"]')).toHaveClass(
        "textarea",
        "textarea--primary",
      );
      expect(container.querySelector('[data-slot="input"]')).toBeNull();

      unmount();
    });

    it("merges a caller class into the root", () => {
      const {root, unmount} = renderField({class: "mt-2"});

      expect(root).toHaveClass("textfield", "mt-2");

      unmount();
    });

    it("stretches the control when full-width is written as a bare attribute", () => {
      // `full-width` hands the prop an empty string, which only becomes `true` when the prop
      // carries a runtime `Boolean` type — the form every story uses.
      const {container, unmount} = renderField({attributeForm: true});

      expect(container.querySelector('[data-slot="input"]')).toHaveClass("input--full-width");

      unmount();
    });

    it("stretches a textarea when full-width is written as a bare attribute", () => {
      const {container, unmount} = renderField({attributeForm: true, withTextArea: true});

      expect(container.querySelector('[data-slot="textarea"]')).toHaveClass("textarea--full-width");

      unmount();
    });

    it("stretches the field and its control when full width", () => {
      const {container, root, unmount} = renderField({fullWidth: true});

      expect(root).toHaveClass("textfield--full-width");
      // The field's own modifier is what widens the control, through a descendant selector,
      // so the control does not carry a modifier of its own here.
      expect(container.querySelector('[data-slot="input"]')).not.toHaveClass("input--full-width");

      unmount();
    });
  });

  describe("variant", () => {
    it("hands the field's variant down to the control", () => {
      const {container, unmount} = renderField({variant: "secondary"});

      expect(container.querySelector('[data-slot="input"]')).toHaveClass("input--secondary");

      unmount();
    });

    it("hands the field's variant down to a textarea too", () => {
      const {container, unmount} = renderField({variant: "secondary", withTextArea: true});

      expect(container.querySelector('[data-slot="textarea"]')).toHaveClass("textarea--secondary");

      unmount();
    });

    it("lets the control override the field", () => {
      const {container, unmount} = renderField({controlVariant: "secondary", variant: "primary"});

      expect(container.querySelector('[data-slot="input"]')).toHaveClass("input--secondary");

      unmount();
    });
  });

  describe("label wiring", () => {
    it("points the label at the control and the control back at the label", async () => {
      const {container, control, unmount} = renderField();

      await nextTick();

      const label = container.querySelector('[data-slot="label"]')!;

      expect(label).toHaveAttribute("for", control.id);
      expect(control).toHaveAttribute("aria-labelledby", label.id);

      unmount();
    });

    it("exposes the label text as the accessible name", () => {
      const {getByLabelText, unmount} = renderField();

      expect(getByLabelText("Email")).toHaveAttribute("data-slot", "input");

      unmount();
    });

    it("names the control from aria-label when there is no visible label", () => {
      const {control, unmount} = renderField({ariaLabel: "Email address", withLabel: false});

      expect(control).toHaveAttribute("aria-label", "Email address");
      expect(control).not.toHaveAttribute("aria-labelledby");

      unmount();
    });

    it("puts the caller id on the control, which is what the label points at", async () => {
      const {container, control, unmount} = renderField({id: "email"});

      await nextTick();

      expect(control).toHaveAttribute("id", "email");
      expect(container.querySelector('[data-slot="label"]')).toHaveAttribute("for", "email");

      unmount();
    });

    it("keeps the label a direct child of the root", () => {
      // The asterisk comes from `[data-required="true"] > .label`, so a label any deeper
      // would silently stop being marked.
      const {root, unmount} = renderField({isRequired: true});

      expect(root.firstElementChild).toHaveAttribute("data-slot", "label");
      expect(root).toHaveAttribute("data-required", "true");

      unmount();
    });
  });

  describe("help text", () => {
    it("points the control at a description that is rendered", async () => {
      const {container, control, unmount} = renderField({withDescription: true});

      await nextTick();

      const description = container.querySelector('[data-slot="description"]')!;

      expect(control).toHaveAttribute("aria-describedby", description.id);

      unmount();
    });

    it("leaves aria-describedby off when there is no help text", () => {
      const {control, unmount} = renderField();

      expect(control).not.toHaveAttribute("aria-describedby");

      unmount();
    });
  });

  describe("value", () => {
    it("starts empty", () => {
      const {control, unmount} = renderField();

      expect(control.value).toBe("");

      unmount();
    });

    it("supports a default value", () => {
      const {control, unmount} = renderField({defaultValue: "hi@example.com"});

      expect(control.value).toBe("hi@example.com");

      unmount();
    });

    it("calls change with what the user typed", async () => {
      const onChange = vi.fn();
      const {control, unmount} = renderField({onChange});

      type(control, "typed");
      await nextTick();

      expect(onChange).toHaveBeenCalledWith("typed");

      unmount();
    });

    it("leaves a controlled field to its owner", async () => {
      const onChange = vi.fn();
      const {control, unmount} = renderField({onChange, value: "fixed"});

      type(control, "typed");
      await nextTick();

      expect(onChange).toHaveBeenCalledWith("typed");
      // The owner declined, so the text goes back — nothing else would put it back, since a
      // binding whose value did not change is skipped.
      expect(control.value).toBe("fixed");

      unmount();
    });

    it("follows a controlled value its owner accepts", async () => {
      const props = reactive({value: "first"});
      const {control, unmount} = renderField(props);

      props.value = "second";
      await nextTick();

      expect(control.value).toBe("second");

      unmount();
    });
  });

  describe("control attributes", () => {
    it("defaults the control to text without writing the attribute", () => {
      // Vue writes `type` as a DOM property and skips an unchanged value, and `el.type` is
      // already "text". No CSS keys on `[type]`, so this only matters when asserting.
      const {control, unmount} = renderField();

      expect((control as HTMLInputElement).type).toBe("text");
      expect(control).not.toHaveAttribute("type");

      unmount();
    });

    it("writes a type that differs from the default", () => {
      const {control, unmount} = renderField({type: "email"});

      expect(control).toHaveAttribute("type", "email");

      unmount();
    });

    it("passes the field placeholder to the control", () => {
      const {control, unmount} = renderField({placeholder: "you@example.com"});

      expect(control).toHaveAttribute("placeholder", "you@example.com");

      unmount();
    });

    it("lets a placeholder on the control win over the field's", () => {
      const {control, unmount} = renderField({
        controlPlaceholder: "from the control",
        placeholder: "from the field",
      });

      expect(control).toHaveAttribute("placeholder", "from the control");

      unmount();
    });

    it("renders no attribute the caller never asked for", () => {
      // Several of these are reflected DOM properties, so handing the control `undefined`
      // would set the property to its coerced default and render an attribute nobody asked
      // for — `spellcheck="false"` is the one that actually showed up.
      const {control, unmount} = renderField();

      expect(control).not.toHaveAttribute("spellcheck");
      expect(control).not.toHaveAttribute("autocomplete");
      expect(control).not.toHaveAttribute("autocapitalize");
      expect(control).not.toHaveAttribute("inputmode");
      expect(control).not.toHaveAttribute("enterkeyhint");
      expect(control).not.toHaveAttribute("pattern");
      expect(control).not.toHaveAttribute("maxlength");
      expect(control).not.toHaveAttribute("minlength");
      expect(control).not.toHaveAttribute("placeholder");
      expect(control).not.toHaveAttribute("role");

      unmount();
    });

    it("puts the name on the control rather than on the wrapper", () => {
      const {control, root, unmount} = renderField({name: "email"});

      expect(control).toHaveAttribute("name", "email");
      expect(root).not.toHaveAttribute("name");

      unmount();
    });
  });

  describe("tab order", () => {
    // Written even though a native input and textarea are already tabbable: Safari does not
    // focus one unless an explicit tab index says so, which is why react-aria always sets it —
    // `useTextField` picks it up from `useFocusable`.
    it("renders an explicit tab index on the input", () => {
      const {control, unmount} = renderField();

      expect(control).toHaveAttribute("tabindex", "0");

      unmount();
    });

    it("renders an explicit tab index on a textarea", () => {
      const {control, unmount} = renderField({withTextArea: true});

      expect(control).toHaveAttribute("tabindex", "0");

      unmount();
    });

    it("drops the tab index when disabled, so it is not reachable at all", () => {
      const {control, unmount} = renderField({isDisabled: true});

      expect(control.hasAttribute("tabindex")).toBe(false);

      unmount();
    });

    // Read-only is not a factor: only a disabled control leaves the tab order.
    it("keeps the tab index when read only", () => {
      const {control, unmount} = renderField({isReadOnly: true});

      expect(control).toHaveAttribute("tabindex", "0");

      unmount();
    });
  });

  describe("states", () => {
    it("supports isDisabled", () => {
      const {control, root, unmount} = renderField({isDisabled: true});

      expect(root).toHaveAttribute("data-disabled", "true");
      expect(control).toBeDisabled();
      expect(control).toHaveAttribute("data-disabled", "true");

      unmount();
    });

    it("supports isReadOnly", () => {
      const {control, root, unmount} = renderField({isReadOnly: true});

      expect(root).toHaveAttribute("data-readonly", "true");
      expect(control).toHaveAttribute("readonly");

      unmount();
    });

    it("supports isRequired", () => {
      const {control, root, unmount} = renderField({isRequired: true});

      expect(root).toHaveAttribute("data-required", "true");
      expect(control).toBeRequired();

      unmount();
    });

    it("supports isInvalid", () => {
      const {control, root, unmount} = renderField({isInvalid: true});

      expect(root).toHaveAttribute("data-invalid", "true");
      expect(control).toHaveAttribute("aria-invalid", "true");

      unmount();
    });

    it("renders none of the state attributes by default", () => {
      const {control, root, unmount} = renderField();

      expect(root).not.toHaveAttribute("data-disabled");
      expect(root).not.toHaveAttribute("data-invalid");
      expect(root).not.toHaveAttribute("data-readonly");
      expect(root).not.toHaveAttribute("data-required");
      expect(control).not.toHaveAttribute("aria-invalid");

      unmount();
    });
  });

  describe("interaction states", () => {
    it("renders data-hovered while the pointer is over the control", async () => {
      const {control, unmount} = renderField();

      control.dispatchEvent(
        new PointerEvent("pointerenter", {bubbles: true, pointerType: "mouse"}),
      );
      await nextTick();

      expect(control).toHaveAttribute("data-hovered", "true");

      control.dispatchEvent(new PointerEvent("pointerleave", {bubbles: true}));
      await nextTick();

      expect(control).not.toHaveAttribute("data-hovered");

      unmount();
    });

    it("renders data-focused while the control holds focus", async () => {
      const {control, unmount} = renderField();

      control.dispatchEvent(new FocusEvent("focus"));
      await nextTick();

      expect(control).toHaveAttribute("data-focused", "true");

      control.dispatchEvent(new FocusEvent("blur"));
      await nextTick();

      expect(control).not.toHaveAttribute("data-focused");

      unmount();
    });
  });

  describe("forms", () => {
    it("submits the value under its name", () => {
      const {control, form, submitButton, unmount} = renderForm({
        defaultValue: "hi@example.com",
        name: "email",
      });

      const release = submit(form, submitButton);

      expect(new FormData(form).get("email")).toBe("hi@example.com");
      expect(control.value).toBe("hi@example.com");

      release();
      unmount();
    });

    it("goes back to its default when the form is reset", async () => {
      const {control, form, unmount} = renderForm({defaultValue: "default", name: "email"});

      await nextTick();
      type(control, "typed");
      await nextTick();

      expect(control.value).toBe("typed");

      form.reset();
      await nextTick();

      expect(control.value).toBe("default");

      unmount();
    });
  });

  describe("validation", () => {
    it("does not stay invalid once a required field has been filled in", async () => {
      /*
       * The browser's verdict is read inside a post-flush effect, and reading `input.validity`
       * tracks nothing — so for a field with no `validate`, no `isInvalid` and no server errors
       * there is nothing reactive to make that effect run again. The snapshot taken while the
       * field was still empty was what the commit on `change` then revealed, and nothing
       * committed afterwards to clear it: a required field went red *after* being filled in
       * correctly, and stayed red. React never sees this because its effect runs on every
       * render and a keystroke is always a render.
       */
      const {control, root, unmount} = renderField({isRequired: true, name: "email"});

      await nextTick();
      control.value = "hello";
      control.dispatchEvent(new Event("input", {bubbles: true}));
      control.dispatchEvent(new Event("change", {bubbles: true}));
      await nextTick();
      await nextTick();

      expect(control.validity.valid).toBe(true);
      expect(root).not.toHaveAttribute("data-invalid");

      unmount();
    });

    it("blocks the submit while the value is not acceptable", async () => {
      const onSubmit = vi.fn();
      const {form, submitButton, unmount} = renderForm({
        name: "email",
        validate: () => "Too short",
        withFieldError: true,
      });

      await nextTick();
      form.addEventListener("submit", onSubmit);
      submitButton.click();
      await nextTick();

      expect(onSubmit).not.toHaveBeenCalled();

      unmount();
    });

    it("reveals the message on a failed submit", async () => {
      const {container, form, submitButton, unmount} = renderForm({
        name: "email",
        validate: () => "Too short",
        withFieldError: true,
      });

      await nextTick();

      const release = submit(form, submitButton);

      await nextTick();
      await nextTick();

      expect(container.querySelector('[data-slot="field-error"]')).toHaveTextContent("Too short");

      release();
      unmount();
    });

    it("reports the browser's own verdict for a required field", async () => {
      const {control, unmount} = renderForm({isRequired: true, name: "email"});

      await nextTick();

      expect(control.validity.valueMissing).toBe(true);
      expect(control.checkValidity()).toBe(false);

      unmount();
    });

    it("reports a type mismatch the browser found", async () => {
      const {control, unmount} = renderForm({name: "email", type: "email"});

      await nextTick();
      type(control, "not-an-email");
      await nextTick();

      expect(control.validity.typeMismatch).toBe(true);

      unmount();
    });

    it("does not block the submit under aria behaviour", async () => {
      // The browser is not enforcing anything then; the same fact is announced instead.
      const onSubmit = vi.fn((event: Event) => event.preventDefault());
      const {control, form, submitButton, unmount} = renderForm({
        isRequired: true,
        name: "email",
        validationBehavior: "aria",
      });

      await nextTick();
      form.addEventListener("submit", onSubmit);
      submitButton.click();

      expect(onSubmit).toHaveBeenCalledOnce();
      // The attribute the browser enforces stays off; only the announcement is there.
      expect(control).not.toHaveAttribute("required");
      expect(control).toHaveAttribute("aria-required", "true");

      form.removeEventListener("submit", onSubmit);
      unmount();
    });

    it("shows an error the server returned", async () => {
      const {container, unmount} = renderForm({
        name: "email",
        validationErrors: {email: "Already taken"},
        withFieldError: true,
      });

      await nextTick();

      expect(container.querySelector('[data-slot="field-error"]')).toHaveTextContent(
        "Already taken",
      );

      unmount();
    });
  });
});
