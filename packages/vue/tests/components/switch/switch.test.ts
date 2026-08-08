import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick, reactive} from "vue";

import SwitchFixture from "./fixtures.vue";
import SwitchFormFixture from "./form-fixtures.vue";

const renderSwitch = (props: Record<string, unknown> = {}) => renderVapor(SwitchFixture, {props});

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

const inputIn = (container: HTMLElement) => container.querySelector("input")!;

/** Give a form an id and hand it back, so a switch rendered outside it can point at it. */
let formCounter = 0;

const formId = (form: HTMLFormElement) => {
  form.id = `form-${++formCounter}`;

  return form.id;
};

const clickAndSettle = async (element: HTMLElement) => {
  element.click();
  await nextTick();
};

describe("Switch", () => {
  describe("structure", () => {
    it("renders every part with its data-slot", () => {
      const {container, unmount} = renderSwitch();

      expect(slot(container, "switch")).not.toBeNull();
      expect(slot(container, "switch-content")).not.toBeNull();
      expect(slot(container, "switch-control")).not.toBeNull();
      expect(slot(container, "switch-thumb")).not.toBeNull();

      unmount();
    });

    it("renders the BEM classes of each part", () => {
      const {container, unmount} = renderSwitch();

      expect(slot(container, "switch").classList.contains("switch")).toBe(true);
      expect(slot(container, "switch-content").classList.contains("switch__content")).toBe(true);
      expect(slot(container, "switch-control").classList.contains("switch__control")).toBe(true);
      expect(slot(container, "switch-thumb").classList.contains("switch__thumb")).toBe(true);

      unmount();
    });

    it("renders the clickable content as a label around a hidden switch input", () => {
      const {container, unmount} = renderSwitch();
      const content = slot(container, "switch-content");
      const input = inputIn(container);

      expect(content.tagName).toBe("LABEL");
      expect(input.type).toBe("checkbox");
      expect(input.getAttribute("role")).toBe("switch");
      expect(content.contains(input)).toBe(true);
      // Hidden by styles rather than by `hidden`, so the input keeps its place in the tab
      // order and stays announced.
      expect(input.parentElement?.style.clipPath).toBe("inset(50%)");

      unmount();
    });

    it("renders the icon passed to the thumb", () => {
      const {getByTestId, unmount} = renderSwitch({withIcon: true});

      expect(getByTestId("thumb-icon")).toBeInTheDocument();

      unmount();
    });

    it("puts the accessible name on the input rather than on the wrapper", () => {
      const {container, unmount} = renderSwitch({ariaLabel: "Enable notifications"});

      expect(inputIn(container).getAttribute("aria-label")).toBe("Enable notifications");
      expect(slot(container, "switch").hasAttribute("aria-label")).toBe(false);

      unmount();
    });

    it("exposes the label text as the accessible name", () => {
      const {getByRole, unmount} = renderSwitch();

      expect(getByRole("switch", {name: "Enable notifications"})).toBeInTheDocument();

      unmount();
    });

    it("maps size to the block modifier", () => {
      for (const size of ["sm", "md", "lg"] as const) {
        const {container, unmount} = renderSwitch({size});

        expect(slot(container, "switch").classList.contains(`switch--${size}`)).toBe(true);

        unmount();
      }
    });

    it("merges a caller class into the root", () => {
      const {container, unmount} = renderSwitch({class: "custom-class"});

      expect(slot(container, "switch").classList.contains("custom-class")).toBe(true);
      expect(slot(container, "switch").classList.contains("switch")).toBe(true);

      unmount();
    });
  });

  describe("selection", () => {
    it("starts off", () => {
      const {container, unmount} = renderSwitch();

      expect(inputIn(container).checked).toBe(false);
      expect(slot(container, "switch").hasAttribute("data-selected")).toBe(false);

      unmount();
    });

    it("supports defaultSelected", () => {
      const {container, unmount} = renderSwitch({defaultSelected: true});

      expect(inputIn(container).checked).toBe(true);
      expect(slot(container, "switch").getAttribute("data-selected")).toBe("true");
      expect(slot(container, "switch-content").getAttribute("data-selected")).toBe("true");

      unmount();
    });

    it("toggles when the label is clicked", async () => {
      const {container, unmount} = renderSwitch();

      await clickAndSettle(slot(container, "switch-content"));

      expect(inputIn(container).checked).toBe(true);
      expect(slot(container, "switch").getAttribute("data-selected")).toBe("true");

      await clickAndSettle(slot(container, "switch-content"));

      expect(inputIn(container).checked).toBe(false);
      expect(slot(container, "switch").hasAttribute("data-selected")).toBe(false);

      unmount();
    });

    it("toggles when the input itself is clicked", async () => {
      const {container, unmount} = renderSwitch();

      await clickAndSettle(inputIn(container));

      expect(slot(container, "switch").getAttribute("data-selected")).toBe("true");

      unmount();
    });

    it("calls change with the new value", async () => {
      const onChange = vi.fn();
      const {container, unmount} = renderSwitch({onChange});

      await clickAndSettle(slot(container, "switch-content"));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith(true);

      unmount();
    });

    it("leaves a controlled switch to its owner", async () => {
      const onChange = vi.fn();
      const props = reactive({isSelected: false, onChange});
      const {container, unmount} = renderVapor(SwitchFixture, {props});

      await clickAndSettle(slot(container, "switch-content"));

      expect(onChange).toHaveBeenLastCalledWith(true);
      // The owner declined the change, so both the state and the input stay put.
      expect(inputIn(container).checked).toBe(false);
      expect(slot(container, "switch").hasAttribute("data-selected")).toBe(false);

      props.isSelected = true;
      await nextTick();

      expect(inputIn(container).checked).toBe(true);
      expect(slot(container, "switch").getAttribute("data-selected")).toBe("true");

      unmount();
    });
  });

  describe("states", () => {
    it("supports isDisabled", async () => {
      const onChange = vi.fn();
      const {container, unmount} = renderSwitch({isDisabled: true, onChange});

      expect(inputIn(container).disabled).toBe(true);
      expect(slot(container, "switch").getAttribute("data-disabled")).toBe("true");
      expect(slot(container, "switch-content").getAttribute("data-disabled")).toBe("true");

      await clickAndSettle(slot(container, "switch-content"));

      expect(onChange).not.toHaveBeenCalled();
      expect(inputIn(container).checked).toBe(false);

      unmount();
    });

    it("supports isReadOnly", async () => {
      const onChange = vi.fn();
      const {container, unmount} = renderSwitch({isReadOnly: true, onChange});

      expect(inputIn(container).getAttribute("aria-readonly")).toBe("true");
      // Focusable, unlike a disabled switch — the value can be read, just not changed.
      expect(inputIn(container).disabled).toBe(false);

      await clickAndSettle(slot(container, "switch-content"));

      expect(onChange).not.toHaveBeenCalled();
      expect(inputIn(container).checked).toBe(false);

      unmount();
    });

    it("supports isInvalid", () => {
      const {container, unmount} = renderSwitch({isInvalid: true});

      expect(inputIn(container).getAttribute("aria-invalid")).toBe("true");
      expect(slot(container, "switch").getAttribute("data-invalid")).toBe("true");

      unmount();
    });

    it("supports isRequired", () => {
      const {container, unmount} = renderSwitch({isRequired: true});

      expect(inputIn(container).required).toBe(true);
      expect(slot(container, "switch").getAttribute("data-required")).toBe("true");

      unmount();
    });
  });

  describe("interaction states", () => {
    it("renders data-hovered while the pointer is over the content", async () => {
      const {container, unmount} = renderSwitch();
      const content = slot(container, "switch-content");

      content.dispatchEvent(new PointerEvent("pointerenter", {pointerType: "mouse"}));
      await nextTick();

      expect(content.getAttribute("data-hovered")).toBe("true");

      content.dispatchEvent(new PointerEvent("pointerleave", {pointerType: "mouse"}));
      await nextTick();

      expect(content.hasAttribute("data-hovered")).toBe(false);

      unmount();
    });

    it("renders data-pressed while the pointer is down", async () => {
      const {container, unmount} = renderSwitch();
      const content = slot(container, "switch-content");

      content.dispatchEvent(new PointerEvent("pointerdown", {bubbles: true, button: 0}));
      await nextTick();

      expect(content.getAttribute("data-pressed")).toBe("true");

      window.dispatchEvent(new PointerEvent("pointerup"));
      await nextTick();

      expect(content.hasAttribute("data-pressed")).toBe(false);

      unmount();
    });

    it("renders data-pressed while Space is held", async () => {
      const {container, unmount} = renderSwitch();
      const content = slot(container, "switch-content");
      const input = inputIn(container);

      input.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: " "}));
      await nextTick();

      expect(content.getAttribute("data-pressed")).toBe("true");

      input.dispatchEvent(new KeyboardEvent("keyup", {bubbles: true, key: " "}));
      await nextTick();

      expect(content.hasAttribute("data-pressed")).toBe(false);

      unmount();
    });

    it("renders data-focused while the input holds focus", async () => {
      const {container, unmount} = renderSwitch();
      const content = slot(container, "switch-content");

      inputIn(container).focus();
      await nextTick();

      expect(content.getAttribute("data-focused")).toBe("true");

      inputIn(container).blur();
      await nextTick();

      expect(content.hasAttribute("data-focused")).toBe(false);

      unmount();
    });
  });

  describe("tab order", () => {
    // Written even though a native input is already tabbable: Safari does not focus one unless
    // an explicit tab index says so, which is why react-aria always sets it — `useToggle` picks
    // it up from `useFocusable`.
    it("renders an explicit tab index on the input", () => {
      const {container, unmount} = renderSwitch();

      expect(inputIn(container)).toHaveAttribute("tabindex", "0");

      unmount();
    });

    it("drops the tab index when disabled, so it is not reachable at all", () => {
      const {container, unmount} = renderSwitch({isDisabled: true});

      expect(inputIn(container).hasAttribute("tabindex")).toBe(false);

      unmount();
    });

    // Read-only is not a factor: the input stays focusable, since only a disabled switch gets
    // the `disabled` attribute.
    it("keeps the tab index when read only", () => {
      const {container, unmount} = renderSwitch({isReadOnly: true});

      expect(inputIn(container)).toHaveAttribute("tabindex", "0");

      unmount();
    });
  });

  describe("help text", () => {
    it("points the input at a description that is rendered", async () => {
      const {container, unmount} = renderSwitch({withDescription: true});
      const description = slot(container, "description");

      // The description claims its id as it mounts, so the input picks it up on the
      // following flush — before paint, but after the first render.
      await nextTick();

      expect(description.id).not.toBe("");
      expect(inputIn(container).getAttribute("aria-describedby")).toBe(description.id);

      unmount();
    });

    it("leaves aria-describedby off when there is no help text", () => {
      const {container, unmount} = renderSwitch();

      expect(inputIn(container).hasAttribute("aria-describedby")).toBe(false);

      unmount();
    });
  });

  describe("forms", () => {
    it("submits the name and value of a switch that is on", () => {
      const form = document.createElement("form");

      document.body.append(form);

      const {container, unmount} = renderSwitch({
        defaultSelected: true,
        form: formId(form),
        name: "notifications",
      });

      expect(inputIn(container).form).toBe(form);
      expect(new FormData(form).get("notifications")).toBe("on");

      unmount();
      form.remove();
    });

    it("submits nothing for a switch that is off", () => {
      const form = document.createElement("form");

      document.body.append(form);

      const {unmount} = renderSwitch({form: formId(form), name: "notifications"});

      expect(new FormData(form).get("notifications")).toBeNull();

      unmount();
      form.remove();
    });

    it("submits a caller value in place of the native one", () => {
      const {container, unmount} = renderSwitch({
        defaultSelected: true,
        name: "notifications",
        value: "enabled",
      });

      expect(inputIn(container).value).toBe("enabled");

      unmount();
    });

    it("leaves the input at the native on when no value is given", () => {
      const {container, unmount} = renderSwitch({name: "notifications"});

      expect(inputIn(container).value).toBe("on");

      unmount();
    });

    it("goes back to its default when the form is reset", async () => {
      const form = document.createElement("form");

      document.body.append(form);

      const {container, unmount} = renderSwitch({
        defaultSelected: true,
        form: formId(form),
        name: "notifications",
      });

      await clickAndSettle(slot(container, "switch-content"));
      expect(inputIn(container).checked).toBe(false);

      form.reset();
      await nextTick();

      expect(inputIn(container).checked).toBe(true);
      expect(slot(container, "switch").getAttribute("data-selected")).toBe("true");

      unmount();
      form.remove();
    });
  });
});

describe("Switch validation", () => {
  const renderInForm = (props: Record<string, unknown> = {}) => {
    const rendered = renderVapor(SwitchFormFixture, {props});
    const at = (testId: string) =>
      rendered.container.querySelector<HTMLElement>(`[data-testid='${testId}']`)!;
    const error = () => rendered.container.querySelector<HTMLElement>("[data-slot='field-error']");

    return {...rendered, at, error};
  };

  /** Press submit with the form's own navigation suppressed. */
  const submit = (container: HTMLElement) => {
    const form = container.querySelector("form")!;
    const onSubmit = (event: Event) => event.preventDefault();

    form.addEventListener("submit", onSubmit);
    container.querySelector<HTMLButtonElement>("[data-testid='submit']")!.click();

    return () => form.removeEventListener("submit", onSubmit);
  };

  describe("prop-driven", () => {
    it("shows a field error as soon as the caller says the value is invalid", async () => {
      const {container, unmount} = renderSwitch({isInvalid: true, withFieldError: true});

      await nextTick();

      expect(container.querySelector("[data-slot='field-error']")).not.toBeNull();

      unmount();
    });

    it("leaves the switch alone when no claim is made either way", async () => {
      const {container, unmount} = renderSwitch({withFieldError: true});

      await nextTick();

      expect(slot(container, "switch").getAttribute("data-invalid")).toBeNull();
      expect(container.querySelector("[data-slot='field-error']")).toBeNull();

      unmount();
    });
  });

  describe("validate", () => {
    it("keeps the message back until the switch commits", async () => {
      const {container, unmount} = renderSwitch({
        validate: (isSelected: boolean) => (isSelected ? true : "must be on"),
        withFieldError: true,
      });

      await nextTick();

      // The browser already knows — that is what blocks the submit — but the user does not.
      expect(inputIn(container).validity.customError).toBe(true);
      expect(container.querySelector("[data-slot='field-error']")).toBeNull();

      unmount();
    });

    it("shows the message at once under aria behaviour", async () => {
      const {container, unmount} = renderSwitch({
        validate: () => "not acceptable",
        validationBehavior: "aria",
        withFieldError: true,
      });

      await nextTick();

      expect(container.querySelector("[data-slot='field-error']")?.textContent).toContain(
        "not acceptable",
      );

      unmount();
    });

    it("describes the switch with the message it shows", async () => {
      const {container, unmount} = renderSwitch({
        validate: () => "not acceptable",
        validationBehavior: "aria",
        withFieldError: true,
      });

      await nextTick();
      await nextTick();

      const error = container.querySelector("[data-slot='field-error']")!;

      expect(inputIn(container).getAttribute("aria-describedby")).toBe(error.id);

      unmount();
    });

    it("clears the message once the value becomes acceptable", async () => {
      const {container, unmount} = renderSwitch({
        validate: (isSelected: boolean) => (isSelected ? true : "must be on"),
        validationBehavior: "aria",
        withFieldError: true,
      });

      await nextTick();
      expect(container.querySelector("[data-slot='field-error']")).not.toBeNull();

      await clickAndSettle(slot(container, "switch-content"));
      await nextTick();

      expect(container.querySelector("[data-slot='field-error']")).toBeNull();

      unmount();
    });

    it("lets the caller word the message from what validation reported", async () => {
      const {container, unmount} = renderSwitch({
        validate: () => ["too soon", "and wrong"],
        validationBehavior: "aria",
        withCustomError: true,
      });

      await nextTick();

      expect(container.querySelector("[data-testid='custom-error']")?.textContent).toBe(
        "2 problem(s)",
      );

      unmount();
    });
  });

  describe("required", () => {
    it("asks the browser to enforce it under native behaviour", () => {
      const {container, unmount} = renderSwitch({isRequired: true});

      expect(inputIn(container).required).toBe(true);
      expect(inputIn(container).getAttribute("aria-required")).toBeNull();

      unmount();
    });

    it("announces it instead under aria behaviour", () => {
      const {container, unmount} = renderSwitch({
        isRequired: true,
        validationBehavior: "aria",
      });

      expect(inputIn(container).required).toBe(false);
      expect(inputIn(container).getAttribute("aria-required")).toBe("true");

      unmount();
    });
  });

  describe("inside a form", () => {
    it("blocks the submit while the value is not acceptable", async () => {
      const onSubmit = vi.fn((event: Event) => event.preventDefault());
      const {container, unmount} = renderInForm({validate: () => "no"});

      await nextTick();
      container.querySelector("form")!.addEventListener("submit", onSubmit);
      container.querySelector<HTMLButtonElement>("[data-testid='submit']")!.click();

      expect(onSubmit).not.toHaveBeenCalled();

      unmount();
    });

    it("reveals the message on a failed submit", async () => {
      const {container, error, unmount} = renderInForm({
        validate: () => "must be on",
        withFieldError: true,
      });

      await nextTick();
      expect(error()).toBeNull();

      const release = submit(container);

      await nextTick();
      await nextTick();

      expect(error()?.textContent).toContain("must be on");

      release();
      unmount();
    });

    it("takes its validation behaviour from the form", async () => {
      const {error, unmount} = renderInForm({
        validate: () => "shown at once",
        validationBehavior: "aria",
        withFieldError: true,
      });

      await nextTick();

      expect(error()?.textContent).toContain("shown at once");

      unmount();
    });

    it("shows a server error registered under its name", async () => {
      const {error, unmount} = renderInForm({
        name: "notifications",
        validationErrors: {notifications: "rejected upstream"},
        withFieldError: true,
      });

      await nextTick();

      expect(error()?.textContent).toContain("rejected upstream");

      unmount();
    });

    it("hides the server error once the user acts on the switch", async () => {
      const {container, error, unmount} = renderInForm({
        name: "notifications",
        validationErrors: {notifications: "rejected upstream"},
        withFieldError: true,
      });

      await nextTick();
      expect(error()).not.toBeNull();

      await clickAndSettle(slot(container, "switch-content"));
      await nextTick();

      expect(error()).toBeNull();

      unmount();
    });

    it("clears a revealed message when the form is reset", async () => {
      const {container, error, unmount} = renderInForm({
        validate: () => "must be on",
        withFieldError: true,
      });

      await nextTick();
      const release = submit(container);

      await nextTick();
      await nextTick();
      expect(error()).not.toBeNull();

      container.querySelector("form")!.reset();
      await nextTick();

      expect(error()).toBeNull();

      release();
      unmount();
    });
  });
});
