import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import Fixture from "./fixtures.vue";

/*
 * There is no global cleanup for vue, and a popover teleported into the body outlives its test
 * unless it is taken down by hand. Leaving one behind does not merely add a stray listbox: the
 * open overlay leaves `aria-hidden` on everything around it, so the *next* test's listbox is
 * invisible to an accessible query and fails for a reason that has nothing to do with it.
 */
const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) cleanups.pop()?.();
});

const render = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });

  cleanups.push(result.unmount);

  return result;
};

type RenderResult = ReturnType<typeof render>;

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

/** A press, which is what opens a picker — a bare click is not one. */
const press = (element: Element) => {
  element.dispatchEvent(new PointerEvent("pointerdown", POINTER));
  element.dispatchEvent(new PointerEvent("pointerup", POINTER));
  element.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0, detail: 1 }));
};

const keydown = (element: Element, key: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });

  element.dispatchEvent(event);

  return event;
};

/**
 * Let the autocomplete settle.
 *
 * Three ticks: the options register a tick after the popover mounts, the filtered collection
 * settles a tick later, and on the way out the exit is reported as finished a tick after the
 * animation does — which in jsdom, with no animations at all, is immediately.
 */
const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

const triggerOf = (result: RenderResult) =>
  result.container.querySelector<HTMLElement>('[data-slot="autocomplete-trigger"]')!;

const buttonOf = (result: RenderResult) =>
  result.container.querySelector<HTMLButtonElement>('[aria-haspopup="listbox"]')!;

const inputOf = (result: RenderResult) => result.screen.getByRole<HTMLInputElement>("searchbox");

const optionsOf = (result: RenderResult) => [
  ...result.baseElement.querySelectorAll<HTMLElement>('[role="option"]'),
];

const open = async (result: RenderResult) => {
  press(buttonOf(result));
  await settle();

  return result.screen.getByRole("listbox");
};

/** Type into the search field the way a browser does: an edit, then the value. */
const type = async (input: HTMLInputElement, value: string, inputType = "insertText") => {
  input.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, inputType }));
  input.value = value;
  input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType }));
  await settle();
};

describe("Autocomplete", () => {
  describe("structure", () => {
    it("renders a field with a value and an indicator", () => {
      const result = render();
      const root = result.container.querySelector('[data-slot="autocomplete"]')!;

      expect(root).toHaveClass("autocomplete");
      expect(triggerOf(result)).toHaveAttribute("role", "group");
      expect(root.querySelector('[data-slot="autocomplete-value"]')).toBeInTheDocument();
      expect(
        root.querySelector('[data-slot="autocomplete-default-indicator"]'),
      ).toBeInTheDocument();
    });

    it("makes the indicator the button that opens the listbox", () => {
      const result = render();
      const button = buttonOf(result);

      // The group around it holds a value and a clear button, neither of which a keyboard can
      // open a listbox with, so the chevron is the one element in the field that is a tab stop.
      expect(button.tagName).toBe("BUTTON");
      expect(button.querySelector('[data-slot="autocomplete-default-indicator"]')).not.toBeNull();
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(button).toHaveAttribute("type", "button");
    });

    it("shows the placeholder until something is chosen", () => {
      const result = render();
      const value = result.container.querySelector('[data-slot="autocomplete-value"]')!;

      expect(value).toHaveTextContent("Select an animal");
      expect(value).toHaveAttribute("data-placeholder", "true");
    });

    it("renders nothing of the popover while closed", () => {
      const result = render();

      expect(result.screen.queryByRole("listbox")).toBeNull();
      expect(result.screen.queryByRole("searchbox")).toBeNull();
    });

    it("merges a class into each part rather than replacing it", async () => {
      const result = render({
        indicatorClass: "my-indicator",
        rootClass: "my-root",
        triggerClass: "my-trigger",
        valueClass: "my-value",
      });

      expect(result.container.querySelector('[data-slot="autocomplete"]')).toHaveClass(
        "autocomplete",
        "my-root",
      );
      expect(triggerOf(result)).toHaveClass("autocomplete__trigger", "my-trigger");
      expect(result.container.querySelector('[data-slot="autocomplete-value"]')).toHaveClass(
        "autocomplete__value",
        "my-value",
      );
      expect(
        result.container.querySelector('[data-slot="autocomplete-default-indicator"]'),
      ).toHaveClass("autocomplete__indicator", "my-indicator");
    });
  });

  describe("opening", () => {
    it("opens on a press anywhere in the field", async () => {
      const result = render();

      press(triggerOf(result));
      await settle();

      expect(result.screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("opens on a press on the indicator", async () => {
      const result = render();

      await open(result);

      expect(buttonOf(result)).toHaveAttribute("aria-expanded", "true");
    });

    it("opens on ArrowDown on the indicator", async () => {
      const result = render();

      keydown(buttonOf(result), "ArrowDown");
      await settle();

      expect(result.screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("renders every option once open", async () => {
      const result = render();

      await open(result);

      expect(optionsOf(result).map((option) => option.textContent?.trim())).toEqual([
        "Cat",
        "Dog",
        "Elephant",
      ]);
    });

    it("refuses to open with nothing to show", async () => {
      const result = render({ items: [] });

      press(buttonOf(result));
      await settle();

      expect(result.screen.queryByRole("listbox")).toBeNull();
    });

    it("opens with nothing to show when asked to", async () => {
      const result = render({ allowsEmptyCollection: true, items: [] });

      press(buttonOf(result));
      await settle();

      expect(result.screen.getByRole("listbox")).toBeInTheDocument();
    });
  });

  describe("filtering", () => {
    it("puts the caret in the search field when the popover appears", async () => {
      const result = render();

      await open(result);

      expect(inputOf(result)).toHaveFocus();
    });

    it("narrows the options to what was typed", async () => {
      const result = render();

      await open(result);
      await type(inputOf(result), "ca");

      expect(optionsOf(result).map((option) => option.textContent?.trim())).toEqual(["Cat"]);
    });

    it("matches anywhere in the text, not only at the start", async () => {
      const result = render();

      await open(result);
      await type(inputOf(result), "ph");

      expect(optionsOf(result).map((option) => option.textContent?.trim())).toEqual(["Elephant"]);
    });

    it("gives every option back when the text is cleared", async () => {
      const result = render();

      await open(result);
      await type(inputOf(result), "ca");
      await type(inputOf(result), "", "deleteContentBackward");

      expect(optionsOf(result)).toHaveLength(3);
    });

    it("reports what was typed", async () => {
      const onInputChange = vi.fn();
      const result = render({ onInputChange });

      await open(result);
      await type(inputOf(result), "do");

      expect(onInputChange).toHaveBeenCalledWith("do");
    });

    it("shows the empty state when nothing matches", async () => {
      const result = render({ allowsEmptyCollection: true, withEmptyState: true });
      const listbox = await open(result);

      await type(inputOf(result), "zzz");

      expect(optionsOf(result)).toHaveLength(0);
      expect(listbox.querySelector('[data-slot="empty-state"]')).toHaveTextContent(
        "No results found",
      );
    });

    it("filters nothing without a predicate", async () => {
      const result = render({ withFilter: false });

      await open(result);
      await type(inputOf(result), "zzz");

      expect(optionsOf(result)).toHaveLength(3);
    });

    it("leaves the filtering alone when the options are handed over directly", async () => {
      const result = render({ filterItems: [{ id: "dog", name: "Dog" }] });

      await open(result);
      await type(inputOf(result), "cat");

      // The caller narrowed them already, which is the seam an asynchronous search needs.
      expect(optionsOf(result).map((option) => option.textContent?.trim())).toEqual(["Dog"]);
    });

    it("keeps the chosen value in the trigger while the options are narrowed past it", async () => {
      const result = render({ defaultValue: "cat" });

      await open(result);
      await type(inputOf(result), "dog");

      expect(result.container.querySelector('[data-slot="autocomplete-value"]')).toHaveTextContent(
        "Cat",
      );
    });
  });

  describe("virtual focus", () => {
    it("names the focused option from the search field", async () => {
      const result = render();
      const listbox = await open(result);
      const input = inputOf(result);

      keydown(input, "ArrowDown");
      await settle();

      const [first] = optionsOf(result);

      expect(input).toHaveAttribute("aria-activedescendant", first!.id);
      expect(first!.id).toBe(`${listbox.id}-option-cat`);
      // Asserted alongside because the popover places focus of its own when it appears, and that
      // is the half that would take the field's focus away.
      expect(input).toHaveFocus();
    });

    it("rings the focused option and leaves it untabbable", async () => {
      const result = render();

      await open(result);
      keydown(inputOf(result), "ArrowDown");
      await settle();

      const [first] = optionsOf(result);

      expect(first).toHaveAttribute("data-focused", "true");
      expect(first).toHaveAttribute("data-focus-visible", "true");
      expect(first).not.toHaveAttribute("tabindex");
    });

    it("moves the ring onto the first match as soon as text is typed", async () => {
      const result = render();

      await open(result);
      await type(inputOf(result), "d");

      expect(optionsOf(result)[0]).toHaveAttribute("data-focused", "true");
    });

    it("chooses the focused option on Enter", async () => {
      const onChange = vi.fn();
      const result = render({ onChange });

      await open(result);
      keydown(inputOf(result), "ArrowDown");
      await settle();
      keydown(inputOf(result), "Enter");
      await settle();

      expect(onChange).toHaveBeenCalledWith("cat");
    });
  });

  describe("selecting", () => {
    it("chooses an option, shows it and closes", async () => {
      const onChange = vi.fn();
      const result = render({ onChange });

      await open(result);
      optionsOf(result)[1]!.click();
      await settle();

      expect(onChange).toHaveBeenCalledWith("dog");
      expect(result.container.querySelector('[data-slot="autocomplete-value"]')).toHaveTextContent(
        "Dog",
      );
      expect(result.screen.queryByRole("listbox")).toBeNull();
    });

    it("stays open and adds up when several may be chosen", async () => {
      const onChange = vi.fn();
      const result = render({ onChange, selectionMode: "multiple" });

      await open(result);
      optionsOf(result)[0]!.click();
      await settle();
      optionsOf(result)[1]!.click();
      await settle();

      expect(onChange).toHaveBeenLastCalledWith(["cat", "dog"]);
      expect(result.screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("shows several chosen options joined the way the locale joins a list", async () => {
      const result = render({ defaultValue: ["cat", "dog"], selectionMode: "multiple" });

      expect(result.container.querySelector('[data-slot="autocomplete-value"]')).toHaveTextContent(
        "Cat and Dog",
      );
    });

    it("renders the value through its slot when one was handed over", () => {
      const result = render({ defaultValue: "cat", withCustomValue: true });

      expect(result.getByTestId("custom-value")).toHaveTextContent("cat");
    });
  });

  describe("the clear button", () => {
    it("is out of the tab order and hidden while there is nothing to clear", () => {
      const result = render({ withClearButton: true });
      const button = result.container.querySelector('[data-slot="autocomplete-clear-button"]')!;

      expect(button).toHaveAttribute("data-empty", "true");
      expect(button).toHaveAttribute("aria-hidden", "true");
      expect(button).toHaveAttribute("tabindex", "-1");
    });

    it("empties the selection and says so", async () => {
      const onChange = vi.fn();
      const onClear = vi.fn();
      const result = render({
        defaultValue: ["cat"],
        onChange,
        onClear,
        selectionMode: "multiple",
        withClearButton: true,
      });

      result.container
        .querySelector<HTMLElement>('[data-slot="autocomplete-clear-button"]')!
        .click();
      await settle();

      expect(onChange).toHaveBeenCalledWith([]);
      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it("does not open the popover it sits inside the trigger of", async () => {
      const result = render({
        defaultValue: ["cat"],
        selectionMode: "multiple",
        withClearButton: true,
      });

      press(result.container.querySelector('[data-slot="autocomplete-clear-button"]')!);
      await settle();

      expect(result.screen.queryByRole("listbox")).toBeNull();
    });
  });

  describe("disabled", () => {
    it("disables the button and refuses to open", async () => {
      const onChange = vi.fn();
      const result = render({ isDisabled: true, onChange });

      expect(buttonOf(result)).toBeDisabled();

      press(buttonOf(result));
      await settle();

      expect(result.screen.queryByRole("listbox")).toBeNull();
      expect(onChange).not.toHaveBeenCalled();
    });

    it("says so on the root and on the trigger", () => {
      const result = render({ isDisabled: true });

      expect(result.container.querySelector('[data-slot="autocomplete"]')).toHaveAttribute(
        "data-disabled",
        "true",
      );
      expect(triggerOf(result)).toHaveAttribute("data-disabled", "true");
    });

    it("leaves a disabled option unchoosable", async () => {
      const onChange = vi.fn();
      const result = render({ disabledKeys: ["dog"], onChange });

      await open(result);

      expect(optionsOf(result)[1]).toHaveAttribute("data-disabled", "true");

      optionsOf(result)[1]!.click();
      await settle();

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("validation", () => {
    it("says it is invalid and shows the error", () => {
      const result = render({ isInvalid: true, withFieldError: true });

      expect(result.container.querySelector('[data-slot="autocomplete"]')).toHaveAttribute(
        "data-invalid",
        "true",
      );
      expect(result.container.querySelector('[data-slot="field-error"]')).toHaveTextContent(
        "Please choose an animal",
      );
    });

    it("names the field by its label and its value", () => {
      const result = render({ withLabel: true });
      const label = result.container.querySelector('[data-slot="label"]')!;
      const value = result.container.querySelector('[data-slot="autocomplete-value"]')!;

      expect(buttonOf(result).getAttribute("aria-labelledby")).toBe(
        `${value.id} ${label.getAttribute("id")}`,
      );
    });
  });

  describe("a form", () => {
    it("submits the chosen key under its name", () => {
      const result = render({ defaultValue: "dog", name: "animal" });
      const control = result.container.querySelector<HTMLSelectElement>("select")!;

      expect(control.name).toBe("animal");
      expect(control.value).toBe("dog");
    });

    it("marks the starting option as the one a reset goes back to", () => {
      const result = render({ defaultValue: "dog", name: "animal" });
      const control = result.container.querySelector<HTMLSelectElement>("select")!;

      // The reset *source*, not the value after a reset: jsdom restores controls synchronously
      // inside the dispatch, so a mirrored write always lands after and every such assertion
      // passes whether the restore is wired up or not. A native select restores each option's
      // default selectedness, which lives in the `selected` attribute a binding never writes.
      expect(
        [...control.options].filter((option) => option.defaultSelected).map((o) => o.value),
      ).toEqual(["dog"]);
      expect([...control.options].find((o) => o.value === "dog")!.hasAttribute("selected")).toBe(
        true,
      );
    });
  });
});
