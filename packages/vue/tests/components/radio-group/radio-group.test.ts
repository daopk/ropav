import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick, reactive} from "vue";

import RadioGroupFixture from "./fixtures.vue";

const renderGroup = (props: Record<string, unknown> = {}) => {
  const rendered = renderVapor(RadioGroupFixture, {props});
  const group = () => rendered.container.querySelector<HTMLElement>("[data-slot='radio-group']")!;
  const items = () =>
    Array.from(rendered.container.querySelectorAll<HTMLElement>("[data-slot='radio']"));
  const inputs = () => Array.from(rendered.container.querySelectorAll("input"));
  const contents = () =>
    Array.from(rendered.container.querySelectorAll<HTMLElement>("[data-slot='radio-content']"));
  const errors = () =>
    Array.from(rendered.container.querySelectorAll<HTMLElement>("[data-slot='field-error']"));

  return {...rendered, contents, errors, group, inputs, items};
};

const clickAndSettle = async (element: HTMLElement) => {
  element.click();
  await nextTick();
};

/**
 * Point the browser's locale somewhere for the rest of the test.
 *
 * `navigator.language` is read-only, and the shared browser locale is module state, so the event
 * that refreshes it has to be dispatched too.
 */
const stubLanguage = (language: string) => {
  vi.spyOn(navigator, "language", "get").mockReturnValue(language);
  window.dispatchEvent(new Event("languagechange"));
};

const restoreLanguage = () => {
  vi.restoreAllMocks();
  window.dispatchEvent(new Event("languagechange"));
};

const pressKey = async (element: HTMLElement, key: string) => {
  const event = new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key});

  element.dispatchEvent(event);
  await nextTick();

  return event;
};

describe("RadioGroup", () => {
  describe("structure", () => {
    it("renders a radiogroup carrying its data-slot and BEM class", () => {
      const {group, unmount} = renderGroup();

      expect(group().getAttribute("role")).toBe("radiogroup");
      expect(group().classList.contains("radio-group")).toBe(true);

      unmount();
    });

    it("renders one radio per value", () => {
      const {inputs, items, unmount} = renderGroup();

      expect(items()).toHaveLength(3);
      expect(inputs().every((input) => input.type === "radio")).toBe(true);

      unmount();
    });

    it("renders every part with its data-slot", () => {
      const {container, unmount} = renderGroup();

      expect(container.querySelector("[data-slot='radio-content']")).not.toBeNull();
      expect(container.querySelector("[data-slot='radio-control']")).not.toBeNull();
      expect(container.querySelector("[data-slot='radio-indicator']")).not.toBeNull();

      unmount();
    });

    it("leaves the indicator empty, since the stylesheet draws the dot", () => {
      const {container, unmount} = renderGroup();

      // `.radio__indicator:empty::before` is what paints it, so anything inside would hide it.
      expect(container.querySelector("[data-slot='radio-indicator']")!.childElementCount).toBe(0);

      unmount();
    });

    it("steps aside for a mark the caller provides", () => {
      const {container, unmount} = renderGroup({withCustomIndicator: true});

      expect(container.querySelector("[data-testid='custom-indicator']")).not.toBeNull();

      unmount();
    });

    it("renders the variant class", () => {
      const {group, unmount} = renderGroup({variant: "secondary"});

      expect(group().classList.contains("radio-group--secondary")).toBe(true);

      unmount();
    });

    it("defaults to a vertical orientation the stylesheet can select on", () => {
      const {group, unmount} = renderGroup();

      expect(group().getAttribute("data-orientation")).toBe("vertical");
      expect(group().getAttribute("aria-orientation")).toBe("vertical");

      unmount();
    });

    it("lays out horizontally when asked", () => {
      const {group, unmount} = renderGroup({orientation: "horizontal"});

      expect(group().getAttribute("data-orientation")).toBe("horizontal");
      expect(group().getAttribute("aria-orientation")).toBe("horizontal");

      unmount();
    });
  });

  describe("labelling", () => {
    it("names itself after a label rendered as a span", async () => {
      const {container, group, unmount} = renderGroup({withLabel: true});

      await nextTick();

      const label = container.querySelector<HTMLElement>("[data-slot='label']")!;

      expect(label.tagName).toBe("SPAN");
      expect(group().getAttribute("aria-labelledby")).toBe(label.id);

      unmount();
    });

    it("claims aria-invalid, which role=radiogroup does support", async () => {
      const {group, unmount} = renderGroup({isInvalid: true});

      await nextTick();

      expect(group().getAttribute("aria-invalid")).toBe("true");
      expect(group().getAttribute("data-invalid")).toBe("true");

      unmount();
    });

    it("announces requiredness on the group", () => {
      const {group, unmount} = renderGroup({isRequired: true});

      expect(group().getAttribute("aria-required")).toBe("true");
      expect(group().getAttribute("data-required")).toBe("true");

      unmount();
    });

    it("points each radio at the group's help text", async () => {
      const {container, inputs, unmount} = renderGroup({withDescription: true});

      await nextTick();

      const descriptionId = container.querySelector("[data-slot='description']")!.id;

      for (const input of inputs()) {
        expect(input.getAttribute("aria-describedby")).toContain(descriptionId);
      }

      unmount();
    });

    it("keeps a radio's own help text to itself", async () => {
      const {container, inputs, unmount} = renderGroup({withItemDescription: true});

      await nextTick();

      const descriptionId = container.querySelector("[data-slot='description']")!.id;

      expect(inputs()[0]!.getAttribute("aria-describedby")).toContain(descriptionId);
      expect(inputs()[1]!.getAttribute("aria-describedby") ?? "").not.toContain(descriptionId);

      unmount();
    });
  });

  describe("selection", () => {
    it("starts with nothing chosen", () => {
      const {inputs, unmount} = renderGroup();

      expect(inputs().some((input) => input.checked)).toBe(false);

      unmount();
    });

    it("checks the radio named in the default value", () => {
      const {inputs, unmount} = renderGroup({defaultValue: "premium"});

      expect(inputs().map((input) => input.checked)).toEqual([false, true, false]);

      unmount();
    });

    it("chooses a radio when its label is clicked", async () => {
      const onChange = vi.fn();
      const {contents, inputs, unmount} = renderGroup({onChange});

      await clickAndSettle(contents()[1]!);

      expect(onChange).toHaveBeenCalledWith("premium");
      expect(inputs()[1]!.checked).toBe(true);

      unmount();
    });

    it("replaces the selection rather than adding to it", async () => {
      const {contents, inputs, unmount} = renderGroup({defaultValue: "basic"});

      await clickAndSettle(contents()[2]!);

      expect(inputs().map((input) => input.checked)).toEqual([false, false, true]);

      unmount();
    });

    it("follows a controlled value rather than its own", async () => {
      const props = reactive({onChange: vi.fn(), value: "basic"});
      const {contents, inputs, unmount} = renderGroup(props);

      await clickAndSettle(contents()[1]!);

      expect(props.onChange).toHaveBeenCalledWith("premium");
      expect(inputs()[0]!.checked).toBe(true);

      props.value = "premium";
      await nextTick();

      expect(inputs()[1]!.checked).toBe(true);

      unmount();
    });

    it("refuses to change while read-only", async () => {
      const {contents, inputs, unmount} = renderGroup({defaultValue: "basic", isReadOnly: true});

      await clickAndSettle(contents()[1]!);

      expect(inputs()[0]!.checked).toBe(true);
      expect(inputs()[1]!.checked).toBe(false);

      unmount();
    });

    it("disables every radio", () => {
      const {inputs, items, unmount} = renderGroup({isDisabled: true});

      for (const input of inputs()) expect(input.disabled).toBe(true);
      for (const item of items()) expect(item.getAttribute("data-disabled")).toBe("true");

      unmount();
    });

    it("lets one radio disable itself while the rest stay usable", () => {
      const {inputs, unmount} = renderGroup({disabledItems: ["premium"]});

      expect(inputs()[0]!.disabled).toBe(false);
      expect(inputs()[1]!.disabled).toBe(true);

      unmount();
    });
  });

  describe("tab stop", () => {
    it("offers every radio while nothing is chosen and focus has been nowhere", () => {
      const {inputs, unmount} = renderGroup();

      for (const input of inputs()) expect(input.tabIndex).toBe(0);

      unmount();
    });

    it("hands the tab stop to the chosen radio", () => {
      const {inputs, unmount} = renderGroup({defaultValue: "premium"});

      expect(inputs().map((input) => input.tabIndex)).toEqual([-1, 0, -1]);

      unmount();
    });

    it("keeps it on the radio focus last rested on while nothing is chosen", async () => {
      const {inputs, unmount} = renderGroup({isReadOnly: true});

      inputs()[1]!.dispatchEvent(new FocusEvent("focus"));
      await nextTick();

      expect(inputs().map((input) => input.tabIndex)).toEqual([-1, 0, -1]);

      unmount();
    });

    it("leaves a disabled radio out of the tab order entirely", () => {
      const {inputs, unmount} = renderGroup({disabledItems: ["basic"]});

      // React drops the attribute rather than setting `-1`, so a disabled radio carries none.
      expect(inputs()[0]!.hasAttribute("tabindex")).toBe(false);

      unmount();
    });
  });

  describe("arrow keys", () => {
    it("moves the selection to the next radio", async () => {
      const {inputs, unmount} = renderGroup({defaultValue: "basic"});

      inputs()[0]!.focus();
      await pressKey(inputs()[0]!, "ArrowDown");

      expect(inputs()[1]!.checked).toBe(true);
      expect(document.activeElement).toBe(inputs()[1]);

      unmount();
    });

    it("moves back with the opposite arrow", async () => {
      const {inputs, unmount} = renderGroup({defaultValue: "premium"});

      inputs()[1]!.focus();
      await pressKey(inputs()[1]!, "ArrowUp");

      expect(inputs()[0]!.checked).toBe(true);

      unmount();
    });

    it("treats right and left the same as down and up", async () => {
      const {inputs, unmount} = renderGroup({defaultValue: "basic"});

      inputs()[0]!.focus();
      await pressKey(inputs()[0]!, "ArrowRight");
      expect(inputs()[1]!.checked).toBe(true);

      await pressKey(inputs()[1]!, "ArrowLeft");
      expect(inputs()[0]!.checked).toBe(true);

      unmount();
    });

    it("follows the reading direction for left and right", async () => {
      // No provider above the fixture, so the browser's own locale is what answers here.
      stubLanguage("ar-AE");
      const {inputs, unmount} = renderGroup({defaultValue: "basic", orientation: "horizontal"});

      inputs()[0]!.focus();
      await pressKey(inputs()[0]!, "ArrowLeft");
      expect(inputs()[1]!.checked).toBe(true);

      await pressKey(inputs()[1]!, "ArrowRight");
      expect(inputs()[0]!.checked).toBe(true);

      unmount();
      restoreLanguage();
    });

    it("keeps down and up pointing the same way when reading right to left", async () => {
      // Only left and right turn around; the vertical arrows still mean previous and next.
      stubLanguage("ar-AE");
      const {inputs, unmount} = renderGroup({defaultValue: "basic", orientation: "horizontal"});

      inputs()[0]!.focus();
      await pressKey(inputs()[0]!, "ArrowDown");
      expect(inputs()[1]!.checked).toBe(true);

      await pressKey(inputs()[1]!, "ArrowUp");
      expect(inputs()[0]!.checked).toBe(true);

      unmount();
      restoreLanguage();
    });

    it("leaves left and right alone in a vertical group read right to left", async () => {
      // The arrows no longer point along the run of radios, so React Aria does not flip them.
      stubLanguage("ar-AE");
      const {inputs, unmount} = renderGroup({defaultValue: "basic"});

      inputs()[0]!.focus();
      await pressKey(inputs()[0]!, "ArrowRight");
      expect(inputs()[1]!.checked).toBe(true);

      unmount();
      restoreLanguage();
    });

    it("wraps around at the end", async () => {
      const {inputs, unmount} = renderGroup({defaultValue: "team"});

      inputs()[2]!.focus();
      await pressKey(inputs()[2]!, "ArrowDown");

      expect(inputs()[0]!.checked).toBe(true);

      unmount();
    });

    it("wraps around at the start", async () => {
      const {inputs, unmount} = renderGroup({defaultValue: "basic"});

      inputs()[0]!.focus();
      await pressKey(inputs()[0]!, "ArrowUp");

      expect(inputs()[2]!.checked).toBe(true);

      unmount();
    });

    it("steps over a disabled radio", async () => {
      const {inputs, unmount} = renderGroup({defaultValue: "basic", disabledItems: ["premium"]});

      inputs()[0]!.focus();
      await pressKey(inputs()[0]!, "ArrowDown");

      expect(inputs()[2]!.checked).toBe(true);

      unmount();
    });

    it("suppresses the browser's own radio navigation, so nothing moves twice", async () => {
      const {inputs, unmount} = renderGroup({defaultValue: "basic"});

      inputs()[0]!.focus();

      const event = await pressKey(inputs()[0]!, "ArrowDown");

      expect(event.defaultPrevented).toBe(true);

      unmount();
    });

    it("stays put while the group is read-only", async () => {
      const {inputs, unmount} = renderGroup({defaultValue: "basic", isReadOnly: true});

      inputs()[0]!.focus();
      await pressKey(inputs()[0]!, "ArrowDown");

      // Native radios have no read-only state, which is exactly why this is handled here.
      expect(inputs()[0]!.checked).toBe(true);
      expect(inputs()[1]!.checked).toBe(false);

      unmount();
    });

    it("ignores any other key", async () => {
      const {inputs, unmount} = renderGroup({defaultValue: "basic"});

      inputs()[0]!.focus();
      const event = await pressKey(inputs()[0]!, "a");

      expect(event.defaultPrevented).toBe(false);
      expect(inputs()[0]!.checked).toBe(true);

      unmount();
    });
  });

  describe("validation", () => {
    it("answers for a FieldError nested in one of its radios", async () => {
      const {errors, unmount} = renderGroup({
        isInvalid: true,
        withFieldError: true,
        withItemFieldError: true,
      });

      await nextTick();

      // A radio has no validity of its own, so both read the group's — including the nested
      // one, which is what React does too.
      expect(errors()).toHaveLength(2);

      unmount();
    });

    it("marks every radio required, which the browser scopes by name", () => {
      const {inputs, unmount} = renderGroup({isRequired: true});

      for (const input of inputs()) expect(input.required).toBe(true);
      expect(inputs()[0]!.validity.valueMissing).toBe(true);

      unmount();
    });

    it("satisfies the whole group once one radio is chosen", async () => {
      const {contents, inputs, unmount} = renderGroup({isRequired: true});

      await clickAndSettle(contents()[0]!);

      // `required` stays on every radio — unlike a checkbox group, it needs no emulation.
      expect(inputs()[1]!.required).toBe(true);
      expect(inputs()[1]!.validity.valueMissing).toBe(false);

      unmount();
    });

    it("announces requiredness instead under aria behaviour", () => {
      const {group, inputs, unmount} = renderGroup({
        isRequired: true,
        validationBehavior: "aria",
      });

      expect(inputs()[0]!.required).toBe(false);
      expect(group().getAttribute("aria-required")).toBe("true");

      unmount();
    });

    it("blocks the submit until one radio is chosen", async () => {
      const onSubmit = vi.fn((event: Event) => event.preventDefault());
      const {container, contents, unmount} = renderGroup({isRequired: true, withForm: true});
      const press = () =>
        container.querySelector<HTMLButtonElement>("[data-testid='submit']")!.click();

      container.querySelector("form")!.addEventListener("submit", onSubmit);

      await nextTick();
      press();
      expect(onSubmit).not.toHaveBeenCalled();

      await clickAndSettle(contents()[0]!);
      press();

      expect(onSubmit).toHaveBeenCalledOnce();

      unmount();
    });

    it("reveals the message on a failed submit", async () => {
      const {container, errors, unmount} = renderGroup({
        isRequired: true,
        withFieldError: true,
        withForm: true,
      });

      container
        .querySelector("form")!
        .addEventListener("submit", (event) => event.preventDefault());

      await nextTick();
      expect(errors()).toHaveLength(0);

      container.querySelector<HTMLButtonElement>("[data-testid='submit']")!.click();
      await nextTick();
      await nextTick();
      await nextTick();

      expect(errors()).toHaveLength(1);

      unmount();
    });

    it("shows the message at once when a choice fails its own rule", async () => {
      const {contents, errors, unmount} = renderGroup({
        validate: (value: string | null) => (value === "team" ? "not available" : true),
        validationBehavior: "aria",
        withFieldError: true,
      });

      await nextTick();
      await clickAndSettle(contents()[2]!);
      await nextTick();

      expect(errors()[0]?.textContent).toContain("not available");

      unmount();
    });

    it("shows a server error registered under its name", async () => {
      const {errors, unmount} = renderGroup({
        formValidationErrors: {plan: "rejected upstream"},
        name: "plan",
        withFieldError: true,
        withForm: true,
      });

      await nextTick();

      expect(errors()[0]?.textContent).toContain("rejected upstream");

      unmount();
    });
  });

  describe("forms", () => {
    it("submits the chosen value under the group's name", () => {
      const form = document.createElement("form");

      form.id = "radio-group-form";
      document.body.append(form);

      const {unmount} = renderGroup({defaultValue: "premium", form: form.id, name: "plan"});

      expect(new FormData(form).get("plan")).toBe("premium");

      form.remove();
      unmount();
    });

    it("goes back to the group's starting choice when the form is reset", async () => {
      const {container, contents, inputs, unmount} = renderGroup({
        defaultValue: "basic",
        withForm: true,
      });

      await clickAndSettle(contents()[1]!);
      expect(inputs()[1]!.checked).toBe(true);

      container.querySelector("form")!.reset();
      await nextTick();

      expect(inputs()[0]!.checked).toBe(true);

      unmount();
    });
  });
});
