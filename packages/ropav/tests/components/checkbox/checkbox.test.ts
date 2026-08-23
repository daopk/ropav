import {renderVapor} from "@ropav/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick, reactive} from "vue";

import {expectCheckedResetSource} from "../../harness/form-reset";

import CheckboxFixture from "./fixtures.vue";
import CheckboxFormFixture from "./form-fixtures.vue";

const renderCheckbox = (props: Record<string, unknown> = {}) =>
  renderVapor(CheckboxFixture, {props});

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

const inputIn = (container: HTMLElement) => container.querySelector("input")!;

const clickAndSettle = async (element: HTMLElement) => {
  element.click();
  await nextTick();
};

/** A form in the document a checkbox can point at, since the checkbox renders outside it. */
let formCounter = 0;

const ownerForm = () => {
  const form = document.createElement("form");

  form.id = `checkbox-form-${++formCounter}`;
  document.body.append(form);

  return form;
};

describe("Checkbox", () => {
  describe("structure", () => {
    it("renders every part with its data-slot", () => {
      const {container, unmount} = renderCheckbox();

      expect(slot(container, "checkbox")).not.toBeNull();
      expect(slot(container, "checkbox-content")).not.toBeNull();
      expect(slot(container, "checkbox-control")).not.toBeNull();
      expect(slot(container, "checkbox-indicator")).not.toBeNull();

      unmount();
    });

    it("renders the BEM classes of each part", () => {
      const {container, unmount} = renderCheckbox();

      expect(slot(container, "checkbox").classList.contains("checkbox")).toBe(true);
      expect(slot(container, "checkbox-content").classList.contains("checkbox__content")).toBe(
        true,
      );
      expect(slot(container, "checkbox-control").classList.contains("checkbox__control")).toBe(
        true,
      );
      expect(slot(container, "checkbox-indicator").classList.contains("checkbox__indicator")).toBe(
        true,
      );

      unmount();
    });

    it("renders the clickable content as a label around a hidden checkbox input", () => {
      const {container, unmount} = renderCheckbox();
      const content = slot(container, "checkbox-content");
      const input = inputIn(container);

      expect(content.tagName).toBe("LABEL");
      expect(input.type).toBe("checkbox");
      expect(content.contains(input)).toBe(true);
      // Hidden from sight but not from the accessibility tree, so it is still the checkbox.
      expect(input.parentElement!.style.clipPath).toBe("inset(50%)");

      unmount();
    });

    it("defaults to the primary variant", () => {
      const {container, unmount} = renderCheckbox();

      expect(slot(container, "checkbox").classList.contains("checkbox--primary")).toBe(true);

      unmount();
    });

    it("renders the secondary variant when asked", () => {
      const {container, unmount} = renderCheckbox({variant: "secondary"});

      expect(slot(container, "checkbox").classList.contains("checkbox--secondary")).toBe(true);

      unmount();
    });

    it("merges the caller's class", () => {
      const {container, unmount} = renderCheckbox({class: "mt-4"});

      expect(slot(container, "checkbox").classList.contains("mt-4")).toBe(true);

      unmount();
    });

    it("hides the indicator from assistive technology", () => {
      const {container, unmount} = renderCheckbox();

      expect(slot(container, "checkbox-indicator").getAttribute("aria-hidden")).toBe("true");

      unmount();
    });
  });

  describe("default indicator", () => {
    it("draws the tick with its stroke hidden while unselected", () => {
      const {container, unmount} = renderCheckbox();
      const checkmark = slot(container, "checkbox-default-indicator--checkmark");

      expect(checkmark).not.toBeNull();
      expect(checkmark.getAttribute("stroke-dashoffset")).toBe("66");

      unmount();
    });

    it("slides the tick into view once selected", () => {
      const {container, unmount} = renderCheckbox({defaultSelected: true});

      expect(
        slot(container, "checkbox-default-indicator--checkmark").getAttribute("stroke-dashoffset"),
      ).toBe("44");

      unmount();
    });

    it("draws a line instead while indeterminate", () => {
      const {container, unmount} = renderCheckbox({isIndeterminate: true});

      expect(slot(container, "checkbox-default-indicator--indeterminate")).not.toBeNull();
      expect(
        container.querySelector("[data-slot='checkbox-default-indicator--checkmark']"),
      ).toBeNull();

      unmount();
    });

    it("steps aside for a mark the caller provides", () => {
      const {container, unmount} = renderCheckbox({withCustomIndicator: true});

      expect(container.querySelector("[data-testid='custom-indicator']")).not.toBeNull();
      expect(
        container.querySelector("[data-slot='checkbox-default-indicator--checkmark']"),
      ).toBeNull();

      unmount();
    });
  });

  describe("selection", () => {
    it("starts unselected", () => {
      const {container, unmount} = renderCheckbox();

      expect(inputIn(container).checked).toBe(false);
      expect(slot(container, "checkbox").getAttribute("data-selected")).toBeNull();

      unmount();
    });

    it("honours defaultSelected while uncontrolled", () => {
      const {container, unmount} = renderCheckbox({defaultSelected: true});

      expect(inputIn(container).checked).toBe(true);
      expect(slot(container, "checkbox").getAttribute("data-selected")).toBe("true");

      unmount();
    });

    it("ticks when the label is clicked", async () => {
      const {container, unmount} = renderCheckbox();

      await clickAndSettle(slot(container, "checkbox-content"));

      expect(inputIn(container).checked).toBe(true);
      expect(slot(container, "checkbox").getAttribute("data-selected")).toBe("true");

      unmount();
    });

    it("reports the change to the caller", async () => {
      const onChange = vi.fn();
      const {container, unmount} = renderCheckbox({onChange});

      await clickAndSettle(slot(container, "checkbox-content"));

      expect(onChange).toHaveBeenCalledWith(true);

      unmount();
    });

    it("follows a controlled value rather than its own", async () => {
      const props = reactive({isSelected: false, onChange: vi.fn()});
      const {container, unmount} = renderCheckbox(props);

      await clickAndSettle(slot(container, "checkbox-content"));

      // The owner of `isSelected` declined, so the input goes back to what it was told.
      expect(props.onChange).toHaveBeenCalledWith(true);
      expect(inputIn(container).checked).toBe(false);

      props.isSelected = true;
      await nextTick();

      expect(inputIn(container).checked).toBe(true);

      unmount();
    });

    it("refuses to change while read-only", async () => {
      const {container, unmount} = renderCheckbox({isReadOnly: true});

      await clickAndSettle(slot(container, "checkbox-content"));

      expect(inputIn(container).checked).toBe(false);
      expect(slot(container, "checkbox").getAttribute("data-readonly")).toBe("true");

      unmount();
    });

    it("cannot be reached at all while disabled", () => {
      const {container, unmount} = renderCheckbox({isDisabled: true});

      expect(inputIn(container).disabled).toBe(true);
      expect(slot(container, "checkbox").getAttribute("data-disabled")).toBe("true");

      unmount();
    });
  });

  describe("indeterminate", () => {
    it("sets the DOM property, which has no attribute behind it", async () => {
      const {container, unmount} = renderCheckbox({isIndeterminate: true});

      await nextTick();

      expect(inputIn(container).indeterminate).toBe(true);
      expect(inputIn(container).hasAttribute("indeterminate")).toBe(false);

      unmount();
    });

    it("publishes the mixed state on the root and the content", async () => {
      const {container, unmount} = renderCheckbox({isIndeterminate: true});

      await nextTick();

      expect(slot(container, "checkbox").getAttribute("data-indeterminate")).toBe("true");
      expect(slot(container, "checkbox-content").getAttribute("data-indeterminate")).toBe("true");

      unmount();
    });

    it("clears the property when the mixed state goes away", async () => {
      const props = reactive({isIndeterminate: true});
      const {container, unmount} = renderCheckbox(props);

      await nextTick();
      expect(inputIn(container).indeterminate).toBe(true);

      props.isIndeterminate = false;
      await nextTick();

      expect(inputIn(container).indeterminate).toBe(false);

      unmount();
    });
  });

  describe("interaction states", () => {
    it("reports hover on the content", async () => {
      const {container, unmount} = renderCheckbox();
      const content = slot(container, "checkbox-content");

      content.dispatchEvent(new PointerEvent("pointerenter", {pointerType: "mouse"}));
      await nextTick();

      expect(content.getAttribute("data-hovered")).toBe("true");

      content.dispatchEvent(new PointerEvent("pointerleave", {pointerType: "mouse"}));
      await nextTick();

      expect(content.getAttribute("data-hovered")).toBeNull();

      unmount();
    });

    it("reports a held Space as a press", async () => {
      const {container, unmount} = renderCheckbox();
      const content = slot(container, "checkbox-content");

      inputIn(container).dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: " "}));
      await nextTick();

      expect(content.getAttribute("data-pressed")).toBe("true");

      inputIn(container).dispatchEvent(new KeyboardEvent("keyup", {bubbles: true, key: " "}));
      await nextTick();

      expect(content.getAttribute("data-pressed")).toBeNull();

      unmount();
    });

    it("ignores a held Space while read-only", async () => {
      const {container, unmount} = renderCheckbox({isReadOnly: true});

      inputIn(container).dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: " "}));
      await nextTick();

      expect(slot(container, "checkbox-content").getAttribute("data-pressed")).toBeNull();

      unmount();
    });
  });

  describe("tab order", () => {
    // Written even though a native input is already tabbable: Safari does not focus one unless
    // an explicit tab index says so, which is why react-aria always sets it — `useToggle` picks
    // it up from `useFocusable`.
    it("renders an explicit tab index on the input", () => {
      const {container, unmount} = renderCheckbox();

      expect(inputIn(container)).toHaveAttribute("tabindex", "0");

      unmount();
    });

    it("drops the tab index when disabled, so it is not reachable at all", () => {
      const {container, unmount} = renderCheckbox({isDisabled: true});

      expect(inputIn(container).hasAttribute("tabindex")).toBe(false);

      unmount();
    });

    // Read-only is not a factor: only a disabled checkbox leaves the tab order.
    it("keeps the tab index when read only", () => {
      const {container, unmount} = renderCheckbox({isReadOnly: true});

      expect(inputIn(container)).toHaveAttribute("tabindex", "0");

      unmount();
    });
  });

  describe("labelling", () => {
    it("puts the accessible name on the input, not the wrapper", () => {
      const {container, unmount} = renderCheckbox({ariaLabel: "Accept terms"});

      expect(inputIn(container).getAttribute("aria-label")).toBe("Accept terms");
      expect(slot(container, "checkbox").getAttribute("aria-label")).toBeNull();

      unmount();
    });

    it("describes the input with the help text nested in the field", async () => {
      const {container, unmount} = renderCheckbox({withDescription: true});

      await nextTick();

      const description = slot(container, "description");

      expect(inputIn(container).getAttribute("aria-describedby")).toBe(description.id);

      unmount();
    });

    it("keeps the caller's own description ids alongside", async () => {
      const {container, unmount} = renderCheckbox({
        ariaDescribedby: "outside-hint",
        withDescription: true,
      });

      await nextTick();

      expect(inputIn(container).getAttribute("aria-describedby")).toContain("outside-hint");
      expect(inputIn(container).getAttribute("aria-describedby")).toContain(
        slot(container, "description").id,
      );

      unmount();
    });
  });

  describe("forms", () => {
    it("submits its name and value while ticked", () => {
      const form = ownerForm();
      const {unmount} = renderCheckbox({
        defaultSelected: true,
        form: form.id,
        name: "terms",
        value: "accepted",
      });

      expect(new FormData(form).get("terms")).toBe("accepted");

      form.remove();
      unmount();
    });

    it("submits nothing while unticked", () => {
      const form = ownerForm();
      const {unmount} = renderCheckbox({form: form.id, name: "terms"});

      expect(new FormData(form).get("terms")).toBeNull();

      form.remove();
      unmount();
    });

    it("starts submitting once it is ticked", async () => {
      const form = ownerForm();
      const {container, unmount} = renderCheckbox({form: form.id, name: "terms"});

      await clickAndSettle(slot(container, "checkbox-content"));

      expect(new FormData(form).get("terms")).toBe("on");

      form.remove();
      unmount();
    });

    it("defaults its submitted value to on", () => {
      const {container, unmount} = renderCheckbox({defaultSelected: true, name: "terms"});

      expect(inputIn(container).value).toBe("on");

      unmount();
    });

    it("carries the checked state a reset restores from", async () => {
      // The test below cannot see this. A reset in jsdom is synchronous, so the post-flush write
      // mirroring the state always lands after it and `checked` reads correct either way; a real
      // browser drains microtasks in between, restores from the half asserted here, and unticks a
      // box the state still calls selected. Red without the fix.
      const {container, unmount} = renderVapor(CheckboxFormFixture, {
        props: {defaultSelected: true, name: "terms"},
      });

      await nextTick();
      expectCheckedResetSource(inputIn(container), true);

      await clickAndSettle(slot(container, "checkbox-content"));

      // In step with the state, not pinned to the default.
      expectCheckedResetSource(inputIn(container), false);

      unmount();
    });

    it("goes back to its default when the form is reset", async () => {
      const {container, unmount} = renderVapor(CheckboxFormFixture, {
        props: {defaultSelected: true, name: "terms"},
      });
      const form = container.querySelector("form")!;

      await clickAndSettle(slot(container, "checkbox-content"));
      expect(inputIn(container).checked).toBe(false);

      form.reset();
      await nextTick();

      expect(inputIn(container).checked).toBe(true);

      unmount();
    });
  });

  describe("validation", () => {
    it("shows a field error as soon as the caller says the value is invalid", async () => {
      const {container, unmount} = renderCheckbox({isInvalid: true, withFieldError: true});

      await nextTick();

      expect(container.querySelector("[data-slot='field-error']")).not.toBeNull();
      expect(slot(container, "checkbox").getAttribute("data-invalid")).toBe("true");
      expect(inputIn(container).getAttribute("aria-invalid")).toBe("true");

      unmount();
    });

    it("makes no claim either way when isInvalid is left out", async () => {
      const {container, unmount} = renderCheckbox({
        validate: () => "not acceptable",
        validationBehavior: "aria",
        withFieldError: true,
      });

      await nextTick();

      // A cast `false` here would pin the field valid and hide this message entirely.
      expect(container.querySelector("[data-slot='field-error']")).not.toBeNull();

      unmount();
    });

    it("keeps a validate message back until the checkbox commits", async () => {
      const {container, unmount} = renderCheckbox({
        validate: (isSelected: boolean) => (isSelected ? true : "must be accepted"),
        withFieldError: true,
      });

      await nextTick();

      expect(inputIn(container).validity.customError).toBe(true);
      expect(container.querySelector("[data-slot='field-error']")).toBeNull();

      unmount();
    });

    it("shows it at once under aria behaviour", async () => {
      const {container, unmount} = renderCheckbox({
        validate: () => "must be accepted",
        validationBehavior: "aria",
        withFieldError: true,
      });

      await nextTick();

      expect(container.querySelector("[data-slot='field-error']")?.textContent).toContain(
        "must be accepted",
      );

      unmount();
    });

    it("lets the caller word the message from what validation reported", async () => {
      const {container, unmount} = renderCheckbox({
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

    it("asks the browser to enforce required under native behaviour", () => {
      const {container, unmount} = renderCheckbox({isRequired: true});

      expect(inputIn(container).required).toBe(true);
      expect(inputIn(container).getAttribute("aria-required")).toBeNull();
      expect(slot(container, "checkbox").getAttribute("data-required")).toBe("true");

      unmount();
    });

    it("announces required instead under aria behaviour", () => {
      const {container, unmount} = renderCheckbox({
        isRequired: true,
        validationBehavior: "aria",
      });

      expect(inputIn(container).required).toBe(false);
      expect(inputIn(container).getAttribute("aria-required")).toBe("true");

      unmount();
    });

    it("reveals the message on a failed submit", async () => {
      const {container, unmount} = renderVapor(CheckboxFormFixture, {
        props: {validate: () => "must be accepted", withFieldError: true},
      });
      const form = container.querySelector("form")!;
      const onSubmit = vi.fn((event: Event) => event.preventDefault());

      form.addEventListener("submit", onSubmit);

      await nextTick();
      container.querySelector<HTMLButtonElement>("[data-testid='submit']")!.click();

      expect(onSubmit).not.toHaveBeenCalled();

      await nextTick();
      await nextTick();

      expect(container.querySelector("[data-slot='field-error']")?.textContent).toContain(
        "must be accepted",
      );

      unmount();
    });

    it("shows a server error registered under its name", async () => {
      const {container, unmount} = renderVapor(CheckboxFormFixture, {
        props: {
          name: "terms",
          validationErrors: {terms: "rejected upstream"},
          withFieldError: true,
        },
      });

      await nextTick();

      expect(container.querySelector("[data-slot='field-error']")?.textContent).toContain(
        "rejected upstream",
      );

      unmount();
    });
  });
});
