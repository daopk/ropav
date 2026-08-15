import type {SelectFixtureProps} from "./fixtures.types";

import {renderVapor} from "@heroui/testing/helpers/vue";
import {afterEach, describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import Fixture from "./fixtures.vue";

const POINTER = {
  bubbles: true,
  button: 0,
  composed: true,
  height: 1,
  isPrimary: true,
  pointerId: 1,
  pointerType: "mouse",
  width: 1,
} as const;

// There is no global cleanup for vue, and a popover teleported into the body outlives its test
// unless it is taken down by hand — which would leave a second listbox for the next one to find.
const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) cleanups.pop()?.();
});

const render = async (props: SelectFixtureProps & Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, {props});

  cleanups.push(result.unmount);

  // Claims and collection-derived attributes settle post-flush.
  await nextTick();

  const root = result.container.querySelector<HTMLElement>('[data-slot="select"]')!;

  return {
    ...result,
    listbox: () => result.screen.queryByRole("listbox"),
    // The popover is teleported to the body, so it is only reachable through `screen`.
    options: () => result.screen.queryAllByRole("option"),
    root,
    trigger: result.container.querySelector<HTMLElement>('[data-slot="select-trigger"]')!,
    value: result.container.querySelector<HTMLElement>('[data-slot="select-value"]')!,
  };
};

/** A press, on the way down — which is when a picker opens for a mouse. */
const press = (element: Element) => {
  element.dispatchEvent(new PointerEvent("pointerdown", POINTER));
  element.dispatchEvent(new PointerEvent("pointerup", POINTER));
  element.dispatchEvent(new MouseEvent("click", {bubbles: true, button: 0, detail: 1}));
};

const key = (element: Element, name: string) => {
  element.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key: name}));
};

/** Items register a tick after the popover mounts, and focus moves a tick after that. */
const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

describe("Select", () => {
  describe("structure", () => {
    it("exposes the block and every part's data-slot", async () => {
      const {root, trigger, value} = await render();

      expect(root).toHaveAttribute("data-slot", "select");
      expect(root).toHaveClass("select");
      expect(trigger).toHaveClass("select__trigger");
      expect(value).toHaveClass("select__value");
      expect(root.querySelector('[data-slot="select-default-indicator"]')).toHaveClass(
        "select__indicator",
      );
    });

    it("carries the variant and full-width modifiers", async () => {
      const {root, trigger} = await render({fullWidth: true, variant: "secondary"});

      expect(root).toHaveClass("select--secondary");
      expect(root).toHaveClass("select--full-width");
      expect(trigger).toHaveClass("select__trigger--full-width");
    });

    it("keeps a caller's class on every part, beside the BEM one", async () => {
      const {root, trigger, value} = await render({
        indicatorClass: "my-indicator",
        popoverClass: "my-popover",
        rootClass: "my-root",
        triggerClass: "my-trigger",
        valueClass: "my-value",
      });

      // A class that replaced the BEM one, or was dropped on the way, leaves the part unstyled
      // while every other assertion in this file still passes.
      expect(root).toHaveClass("select", "my-root");
      expect(trigger).toHaveClass("select__trigger", "my-trigger");
      expect(value).toHaveClass("select__value", "my-value");
      expect(root.querySelector('[data-slot="select-default-indicator"]')).toHaveClass(
        "select__indicator",
        "my-indicator",
      );

      press(trigger);
      await settle();

      expect(document.querySelector('[data-slot="select-popover"]')).toHaveClass(
        "select__popover",
        "my-popover",
      );
    });

    it("renders no listbox until it is opened", async () => {
      const {listbox} = await render();

      expect(listbox()).toBeNull();
    });
  });

  describe("the value", () => {
    it("shows the placeholder when nothing is chosen", async () => {
      const {value} = await render();

      expect(value).toHaveTextContent("Select one");
      expect(value).toHaveAttribute("data-placeholder", "true");
    });

    it("shows a value it starts with, without ever opening", async () => {
      const {value} = await render({defaultValue: "texas"});

      // Nothing rendered an option, so this can only come from the data.
      expect(value).toHaveTextContent("Texas");
      expect(value).not.toHaveAttribute("data-placeholder");
    });

    it("joins several chosen options the way the locale joins a list", async () => {
      const {value} = await render({
        defaultValue: ["florida", "texas"],
        selectionMode: "multiple",
      });

      expect(value).toHaveTextContent("Florida and Texas");
    });

    it("hands every chosen datum to a slot that renders one node each", async () => {
      const {screen} = await render({
        defaultValue: ["florida", "texas"],
        selectionMode: "multiple",
        withCustomValueList: true,
      });

      expect(screen.queryAllByTestId("value-item").map((node) => node.textContent!.trim())).toEqual(
        ["Florida", "Texas"],
      );
    });

    it("hands the chosen data to its slot", async () => {
      const {screen} = await render({defaultValue: "california", withCustomValue: true});

      expect(screen.getByTestId("custom-value")).toHaveTextContent("california");
    });
  });

  describe("the indicator", () => {
    it("marks the built-in chevron apart from a custom one", async () => {
      const plain = await render();

      expect(plain.root.querySelector('[data-slot="select-default-indicator"]')).not.toBeNull();

      const custom = await render({withCustomIndicator: true});

      expect(custom.root.querySelector('[data-slot="select-indicator"]')).not.toBeNull();
      expect(custom.root.querySelector('[data-slot="select-default-indicator"]')).toBeNull();
    });

    it("turns over while the popover is open", async () => {
      const {root, trigger} = await render();

      const indicator = root.querySelector('[data-slot="select-default-indicator"]')!;

      expect(indicator).not.toHaveAttribute("data-open");

      press(trigger);
      await settle();

      expect(indicator).toHaveAttribute("data-open", "true");
    });
  });

  describe("opening and choosing", () => {
    it("opens on a press and lists every option", async () => {
      const {listbox, options, trigger} = await render();

      press(trigger);
      await settle();

      expect(listbox()).not.toBeNull();
      expect(document.querySelector('[data-slot="select-popover"]')).not.toBeNull();
      expect(options()).toHaveLength(3);
    });

    it("writes the choice, closes, and shows it", async () => {
      const onChange = vi.fn();
      const {listbox, options, trigger, value} = await render({onChange});

      press(trigger);
      await settle();

      options()[1]!.click();
      await settle();

      expect(onChange).toHaveBeenCalledWith("california");
      expect(listbox()).toBeNull();
      expect(value).toHaveTextContent("California");
    });

    it("stays open in multiple mode and gathers the choices", async () => {
      const onChange = vi.fn();
      const {listbox, options, trigger} = await render({onChange, selectionMode: "multiple"});

      press(trigger);
      await settle();

      options()[0]!.click();
      await settle();

      expect(onChange).toHaveBeenLastCalledWith(["florida"]);
      expect(listbox()).not.toBeNull();

      options()[2]!.click();
      await settle();

      expect(onChange).toHaveBeenLastCalledWith(["florida", "texas"]);
    });

    it("opens on ArrowDown and starts on the chosen option", async () => {
      const {options, trigger} = await render({defaultValue: "texas"});

      key(trigger, "ArrowDown");
      await settle();

      expect(options()[2]).toHaveFocus();
    });

    it("reports the open state", async () => {
      const onOpenChange = vi.fn();
      const {root, trigger} = await render({onOpenChange});

      press(trigger);
      await settle();

      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(root).toHaveAttribute("data-open", "true");
    });
  });

  describe("accessibility wiring", () => {
    it("announces that the trigger opens a listbox", async () => {
      const {trigger} = await render();

      expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("names the trigger by its value and then its label", async () => {
      const {root, trigger, value} = await render({withLabel: true});

      const label = root.querySelector('[data-slot="label"]')!;

      expect(trigger).toHaveAttribute("aria-labelledby", `${value.id} ${label.id}`);
    });

    it("renders the label as a span, since the trigger is a composite", async () => {
      const {root} = await render({withLabel: true});

      expect(root.querySelector('[data-slot="label"]')!.tagName).toBe("SPAN");
    });

    it("describes the trigger by its description", async () => {
      const {root, trigger} = await render({withDescription: true});

      const description = root.querySelector('[data-slot="description"]')!;

      expect(trigger).toHaveAttribute("aria-describedby", description.id);
    });

    it("points aria-controls at the listbox it opened", async () => {
      const {listbox, trigger} = await render();

      press(trigger);
      await settle();

      expect(trigger).toHaveAttribute("aria-controls", listbox()!.id);
    });

    it("names the listbox by the same label as the trigger", async () => {
      const {listbox, root, trigger} = await render({withLabel: true});

      press(trigger);
      await settle();

      expect(listbox()).toHaveAttribute(
        "aria-labelledby",
        root.querySelector('[data-slot="label"]')!.id,
      );
    });

    it("leaves the listbox unnamed rather than pointing at nothing", async () => {
      const {listbox, trigger} = await render();

      press(trigger);
      await settle();

      // An idref that names no element is worse than no idref: a screen reader reads the empty
      // name over whatever the element would otherwise have been called.
      expect(listbox()).not.toHaveAttribute("aria-labelledby");
    });
  });

  describe("disabled", () => {
    it("disables the trigger and refuses to open", async () => {
      const onChange = vi.fn();
      const {listbox, root, trigger} = await render({isDisabled: true, onChange});

      expect(trigger).toBeDisabled();
      expect(root).toHaveAttribute("data-disabled", "true");

      press(trigger);
      await settle();

      expect(listbox()).toBeNull();
      expect(onChange).not.toHaveBeenCalled();
    });

    it("keeps a disabled option out of reach", async () => {
      const onChange = vi.fn();
      const {options, trigger} = await render({
        items: [
          {id: "florida", name: "Florida"},
          {id: "california", isDisabled: true, name: "California"},
        ],
        onChange,
      });

      press(trigger);
      await settle();

      options()[1]!.click();
      await settle();

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("validation", () => {
    it("marks itself invalid and shows the field error", async () => {
      const {root, screen} = await render({isInvalid: true, withFieldError: true});

      expect(root).toHaveAttribute("data-invalid", "true");
      expect(screen.getByText("Please choose a state")).toBeInTheDocument();
      expect(root.querySelector('[data-slot="field-error"]')).not.toBeNull();
    });

    it("marks itself required", async () => {
      const {root, trigger} = await render({isRequired: true});

      expect(root).toHaveAttribute("data-required", "true");
      expect(trigger).toHaveAttribute("aria-required", "true");
    });
  });

  describe("the hidden native control", () => {
    it("renders an option per datum, with nothing opened", async () => {
      const {root} = await render({name: "state"});

      const control = root.querySelector<HTMLSelectElement>("select")!;

      expect(control).toHaveAttribute("name", "state");
      expect(control.tabIndex).toBe(-1);
      // The blank leading option plus one per datum.
      expect(control.options).toHaveLength(4);
      expect([...control.options].map((option) => option.value)).toEqual([
        "",
        "florida",
        "california",
        "texas",
      ]);
    });

    it("holds the chosen value, so a form reads it", async () => {
      const {root} = await render({defaultValue: "texas", name: "state"});

      expect(root.querySelector<HTMLSelectElement>("select")!.value).toBe("texas");
    });

    it("takes several values in multiple mode", async () => {
      const {root} = await render({
        defaultValue: ["florida", "texas"],
        name: "state",
        selectionMode: "multiple",
      });

      const control = root.querySelector<HTMLSelectElement>("select")!;

      expect(control.multiple).toBe(true);
      expect([...control.selectedOptions].map((option) => option.value)).toEqual([
        "florida",
        "texas",
      ]);
    });

    it("is hidden from assistive technology and out of the tab order", async () => {
      const {root} = await render({name: "state"});

      const container = root.querySelector('[data-a11y-ignore="aria-hidden-focus"]')!;

      expect(container).toHaveAttribute("aria-hidden", "true");
      expect(container.querySelector("select")!.tabIndex).toBe(-1);
    });
  });
});
