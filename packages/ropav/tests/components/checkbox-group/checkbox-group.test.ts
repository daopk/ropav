import {renderVapor} from "@ropav/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick, reactive} from "vue";

import CheckboxGroupFixture from "./fixtures.vue";

const renderGroup = (props: Record<string, unknown> = {}) => {
  const rendered = renderVapor(CheckboxGroupFixture, {props});
  const group = () =>
    rendered.container.querySelector<HTMLElement>("[data-slot='checkbox-group']")!;
  const items = () =>
    Array.from(rendered.container.querySelectorAll<HTMLElement>("[data-slot='checkbox']"));
  const inputs = () => Array.from(rendered.container.querySelectorAll("input"));
  const contents = () =>
    Array.from(rendered.container.querySelectorAll<HTMLElement>("[data-slot='checkbox-content']"));
  const errors = () =>
    Array.from(rendered.container.querySelectorAll<HTMLElement>("[data-slot='field-error']"));

  return {...rendered, contents, errors, group, inputs, items};
};

const clickAndSettle = async (element: HTMLElement) => {
  element.click();
  await nextTick();
};

describe("CheckboxGroup", () => {
  describe("structure", () => {
    it("renders a group carrying its data-slot and BEM class", () => {
      const {group, unmount} = renderGroup();

      expect(group().getAttribute("role")).toBe("group");
      expect(group().classList.contains("checkbox-group")).toBe(true);

      unmount();
    });

    it("renders one checkbox per value", () => {
      const {items, unmount} = renderGroup();

      expect(items()).toHaveLength(3);

      unmount();
    });

    it("renders the variant class", () => {
      const {group, unmount} = renderGroup({variant: "secondary"});

      expect(group().classList.contains("checkbox-group--secondary")).toBe(true);

      unmount();
    });

    it("merges the caller's class", () => {
      const {group, unmount} = renderGroup({class: "gap-2"});

      expect(group().classList.contains("gap-2")).toBe(true);

      unmount();
    });
  });

  describe("labelling", () => {
    it("names itself after a label rendered as a span", async () => {
      const {container, group, unmount} = renderGroup({withLabel: true});

      await nextTick();

      const label = container.querySelector<HTMLElement>("[data-slot='label']")!;

      // A `<label>` implies a labelable control, and a group is not one.
      expect(label.tagName).toBe("SPAN");
      expect(group().getAttribute("aria-labelledby")).toBe(label.id);

      unmount();
    });

    it("describes itself with its own help text", async () => {
      const {container, group, unmount} = renderGroup({withDescription: true});

      await nextTick();

      expect(group().getAttribute("aria-describedby")).toBe(
        container.querySelector("[data-slot='description']")!.id,
      );

      unmount();
    });

    it("never claims aria-invalid, which role=group does not support", async () => {
      const {group, unmount} = renderGroup({isInvalid: true, withFieldError: true});

      await nextTick();

      expect(group().getAttribute("aria-invalid")).toBeNull();
      // The state still reaches assistive technology, through each item's input.
      expect(group().getAttribute("data-invalid")).toBe("true");

      unmount();
    });

    it("points each item at the group's help text", async () => {
      const {container, inputs, unmount} = renderGroup({withDescription: true});

      await nextTick();

      const descriptionId = container.querySelector("[data-slot='description']")!.id;

      for (const input of inputs()) {
        expect(input.getAttribute("aria-describedby")).toContain(descriptionId);
      }

      unmount();
    });

    it("adds the group's error to each item only while the group is invalid", async () => {
      const props = reactive({isInvalid: false, withFieldError: true});
      const {errors, inputs, unmount} = renderGroup(props);

      await nextTick();
      expect(inputs()[0]!.getAttribute("aria-describedby")).toBeNull();

      props.isInvalid = true;
      await nextTick();
      await nextTick();

      expect(inputs()[0]!.getAttribute("aria-describedby")).toBe(errors()[0]!.id);

      unmount();
    });
  });

  describe("state cascade", () => {
    it("gives every item the group's name", () => {
      const {inputs, unmount} = renderGroup({name: "preferences"});

      for (const input of inputs()) expect(input.name).toBe("preferences");

      unmount();
    });

    it("disables every item", () => {
      const {inputs, items, unmount} = renderGroup({isDisabled: true});

      for (const input of inputs()) expect(input.disabled).toBe(true);
      for (const item of items()) expect(item.getAttribute("data-disabled")).toBe("true");

      unmount();
    });

    it("makes every item read-only", async () => {
      const {contents, inputs, unmount} = renderGroup({isReadOnly: true});

      await clickAndSettle(contents()[0]!);

      expect(inputs()[0]!.checked).toBe(false);

      unmount();
    });

    it("hands its variant down to the items", () => {
      const {items, unmount} = renderGroup({variant: "secondary"});

      for (const item of items()) expect(item.classList.contains("checkbox--secondary")).toBe(true);

      unmount();
    });

    it("lets an item name a variant of its own", () => {
      const {items, unmount} = renderGroup({itemVariant: "primary", variant: "secondary"});

      expect(items()[0]!.classList.contains("checkbox--primary")).toBe(true);
      expect(items()[1]!.classList.contains("checkbox--secondary")).toBe(true);

      unmount();
    });

    it("lets an item disable itself while the group is enabled", () => {
      const {inputs, unmount} = renderGroup({itemDisabled: true});

      expect(inputs()[0]!.disabled).toBe(true);
      expect(inputs()[1]!.disabled).toBe(false);

      unmount();
    });
  });

  describe("selection", () => {
    it("ticks the items named in the default value", () => {
      const {inputs, unmount} = renderGroup({defaultValue: ["sms"]});

      expect(inputs().map((input) => input.checked)).toEqual([false, true, false]);

      unmount();
    });

    it("adds a value when an item is clicked", async () => {
      const onChange = vi.fn();
      const {contents, unmount} = renderGroup({onChange});

      await clickAndSettle(contents()[0]!);

      expect(onChange).toHaveBeenCalledWith(["email"]);

      unmount();
    });

    it("collects several values", async () => {
      const onChange = vi.fn();
      const {contents, unmount} = renderGroup({onChange});

      await clickAndSettle(contents()[0]!);
      await clickAndSettle(contents()[2]!);

      expect(onChange).toHaveBeenLastCalledWith(["email", "push"]);

      unmount();
    });

    it("removes a value when an item is unticked", async () => {
      const onChange = vi.fn();
      const {contents, unmount} = renderGroup({defaultValue: ["email", "sms"], onChange});

      await clickAndSettle(contents()[0]!);

      expect(onChange).toHaveBeenCalledWith(["sms"]);

      unmount();
    });

    it("follows a controlled value rather than its own", async () => {
      const props = reactive({onChange: vi.fn(), value: ["email"]});
      const {contents, inputs, unmount} = renderGroup(props);

      await clickAndSettle(contents()[1]!);

      expect(props.onChange).toHaveBeenCalledWith(["email", "sms"]);
      expect(inputs()[1]!.checked).toBe(false);

      props.value = ["email", "sms"];
      await nextTick();

      expect(inputs()[1]!.checked).toBe(true);

      unmount();
    });
  });

  describe("validation", () => {
    it("keeps the error to itself rather than repeating it under every item", async () => {
      const {errors, unmount} = renderGroup({
        isInvalid: true,
        withFieldError: true,
        withItemFieldError: true,
      });

      await nextTick();

      // The item's own `FieldError` is silenced — a group validates on its items' behalf.
      expect(errors()).toHaveLength(1);

      unmount();
    });

    it("shows nothing at all when only an item asks for a FieldError", async () => {
      const {errors, unmount} = renderGroup({isInvalid: true, withItemFieldError: true});

      await nextTick();

      expect(errors()).toHaveLength(0);

      unmount();
    });

    it("marks every item required while nothing is selected", () => {
      const {inputs, unmount} = renderGroup({isRequired: true});

      for (const input of inputs()) expect(input.required).toBe(true);

      unmount();
    });

    it("drops required off every item once one is selected", async () => {
      const {contents, inputs, unmount} = renderGroup({isRequired: true});

      await clickAndSettle(contents()[0]!);

      for (const input of inputs()) expect(input.required).toBe(false);

      unmount();
    });

    it("announces requiredness on the group whatever is selected", async () => {
      const {contents, group, unmount} = renderGroup({isRequired: true});

      expect(group().getAttribute("data-required")).toBe("true");

      await clickAndSettle(contents()[0]!);

      expect(group().getAttribute("data-required")).toBe("true");

      unmount();
    });

    it("blocks the submit until at least one item is selected", async () => {
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

    it("reveals the group's message on a failed submit", async () => {
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

    it("blocks the submit on a rule of its own", async () => {
      const onSubmit = vi.fn((event: Event) => event.preventDefault());
      const {container, contents, unmount} = renderGroup({
        validate: (value: string[]) => (value.length >= 2 ? true : "pick two"),
        withFieldError: true,
        withForm: true,
      });
      const press = () =>
        container.querySelector<HTMLButtonElement>("[data-testid='submit']")!.click();

      container.querySelector("form")!.addEventListener("submit", onSubmit);

      await nextTick();
      press();
      expect(onSubmit).not.toHaveBeenCalled();

      await clickAndSettle(contents()[0]!);
      await clickAndSettle(contents()[1]!);
      await nextTick();
      press();

      expect(onSubmit).toHaveBeenCalledOnce();

      unmount();
    });

    it("shows its own message ahead of the browser's", async () => {
      const {container, errors, unmount} = renderGroup({
        isRequired: true,
        validate: (value: string[]) => (value.length > 0 ? true : "pick at least one"),
        withFieldError: true,
        withForm: true,
      });

      container
        .querySelector("form")!
        .addEventListener("submit", (event) => event.preventDefault());

      await nextTick();
      container.querySelector<HTMLButtonElement>("[data-testid='submit']")!.click();
      await nextTick();
      await nextTick();
      await nextTick();

      expect(errors()[0]?.textContent).toContain("pick at least one");

      unmount();
    });

    it("shows a server error registered under its name", async () => {
      const {errors, unmount} = renderGroup({
        formValidationErrors: {preferences: "rejected upstream"},
        name: "preferences",
        withFieldError: true,
        withForm: true,
      });

      await nextTick();

      expect(errors()[0]?.textContent).toContain("rejected upstream");

      unmount();
    });
  });

  describe("forms", () => {
    it("submits every selected value under the group's name", () => {
      const form = document.createElement("form");

      form.id = "checkbox-group-form";
      document.body.append(form);

      const {unmount} = renderGroup({
        defaultValue: ["email", "push"],
        form: form.id,
        name: "preferences",
      });

      expect(new FormData(form).getAll("preferences")).toEqual(["email", "push"]);

      form.remove();
      unmount();
    });
  });
});
