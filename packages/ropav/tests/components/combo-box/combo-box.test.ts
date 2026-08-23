import {renderVapor} from "@ropav/testing/helpers/vue";
import {afterEach, describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import {expectResetSource} from "../../harness/form-reset";

import Fixture from "./fixtures.vue";

/*
 * There is no global cleanup for vue, and a popover teleported into the body outlives its test
 * unless it is taken down by hand. Leaving one behind does not merely add a stray listbox: the open
 * overlay leaves `aria-hidden` on everything around it, so the *next* test's listbox is invisible
 * to an accessible query and fails for a reason that has nothing to do with it.
 */
const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) cleanups.pop()?.();
});

const render = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, {props});

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
  element.dispatchEvent(new MouseEvent("click", {bubbles: true, button: 0, detail: 1}));
};

const keydown = (element: Element, key: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key, ...init});

  element.dispatchEvent(event);

  return event;
};

/**
 * Let the combo box settle.
 *
 * Three ticks: the options register a tick after the popover mounts, the collection the state
 * reconciles against settles a tick later, and on the way out the exit is reported as finished a
 * tick after the animation does — which in jsdom, with no animations at all, is immediately.
 */
const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

const inputOf = (result: RenderResult) =>
  result.container.querySelector<HTMLInputElement>('[data-slot="input"]')!;

const triggerOf = (result: RenderResult) =>
  result.container.querySelector<HTMLButtonElement>('[data-slot="combo-box-trigger"]')!;

const optionsOf = (result: RenderResult) => [
  ...result.baseElement.querySelectorAll<HTMLElement>('[role="option"]'),
];

const popoverOf = (result: RenderResult) =>
  result.baseElement.querySelector<HTMLElement>('[data-slot="combo-box-popover"]');

/**
 * Typing, as a browser reports it: the edit is announced before it lands.
 *
 * `beforeinput` is the only event carrying `inputType`, which is what the virtual-focus layer reads
 * to decide whether the ring follows the text — so a bare `input` exercises a path no keystroke
 * ever takes.
 */
const type = async (input: HTMLInputElement, value: string, inputType = "insertText") => {
  input.dispatchEvent(new InputEvent("beforeinput", {bubbles: true, cancelable: true, inputType}));
  input.value = value;
  input.dispatchEvent(new InputEvent("input", {bubbles: true, inputType}));
  await settle();
};

const focus = async (element: HTMLElement) => {
  element.focus();
  element.dispatchEvent(new FocusEvent("focus", {bubbles: false}));
  await settle();
};

const blur = async (element: HTMLElement, relatedTarget: EventTarget | null = null) => {
  element.dispatchEvent(new FocusEvent("blur", {bubbles: false, relatedTarget} as FocusEventInit));
  await settle();
};

const open = async (result: RenderResult) => {
  press(triggerOf(result));
  await settle();
};

describe("ComboBox", () => {
  describe("structure", () => {
    it("exposes a data-slot and its BEM block on every part", async () => {
      const result = render({withLabel: true});

      await open(result);

      const root = result.container.querySelector('[data-slot="combo-box"]')!;
      const group = result.container.querySelector('[data-slot="combo-box-input-group"]')!;

      expect(root.className).toContain("combo-box");
      expect(group.className).toContain("combo-box__input-group");
      expect(triggerOf(result).className).toContain("combo-box__trigger");
      expect(popoverOf(result)!.className).toContain("combo-box__popover");
    });

    it("merges a class of the caller's own rather than replacing the block", () => {
      const result = render({
        inputGroupClass: "my-group",
        popoverClass: "my-popover",
        rootClass: "my-root",
        triggerClass: "my-trigger",
      });

      const root = result.container.querySelector('[data-slot="combo-box"]')!;

      expect(root.className).toContain("combo-box");
      expect(root.className).toContain("my-root");
      expect(triggerOf(result).className).toContain("combo-box__trigger");
      expect(triggerOf(result).className).toContain("my-trigger");
    });

    it("keeps the chevron as the field's next sibling", () => {
      const result = render();

      // The stylesheet reserves room for the chevron with `[data-slot="input"]:has(+ .combo-box__trigger)`,
      // so anything between the two would leave the text running underneath it.
      expect(inputOf(result).nextElementSibling).toBe(triggerOf(result));
    });

    it("keeps the field itself out of the popover", async () => {
      const result = render();

      await open(result);

      // The whole difference from an autocomplete: the field a combo box is typed into stays in
      // place, and the popover holds nothing but the options.
      expect(popoverOf(result)!.querySelector('[data-slot="input"]')).toBeNull();
    });

    it("carries the field's state on the root", async () => {
      const result = render({isRequired: true});
      const root = result.container.querySelector('[data-slot="combo-box"]')!;

      expect(root).toHaveAttribute("data-required", "true");
      expect(root).not.toHaveAttribute("data-open");

      await open(result);

      expect(root).toHaveAttribute("data-open", "true");
    });

    it("takes a glyph of the caller's own", () => {
      const custom = render({withCustomIndicator: true});

      expect(custom.container.querySelector('[data-testid="custom-icon"]')).not.toBeNull();
      // Only the built-in chevron carries the slot the stylesheet sizes and rotates.
      expect(
        custom.container.querySelector('[data-slot="combo-box-trigger-default-icon"]'),
      ).toBeNull();
      expect(
        render().container.querySelector('[data-slot="combo-box-trigger-default-icon"]'),
      ).not.toBeNull();
    });
  });

  describe("the field's wiring", () => {
    it("makes the field itself the combobox", () => {
      const input = inputOf(render());

      expect(input).toHaveAttribute("role", "combobox");
      expect(input).toHaveAttribute("aria-autocomplete", "list");
      expect(input).toHaveAttribute("aria-expanded", "false");
    });

    it("points the field and the chevron at the same listbox while open", async () => {
      const result = render();

      await open(result);

      const listbox = result.screen.getByRole("listbox");

      expect(inputOf(result)).toHaveAttribute("aria-controls", listbox.id);
      expect(triggerOf(result)).toHaveAttribute("aria-controls", listbox.id);
    });

    it("names the field from the label and the listbox from both", async () => {
      const result = render({withLabel: true});

      await open(result);

      const label = result.container.querySelector('[data-slot="label"]')!;
      const listbox = result.screen.getByRole("listbox");

      expect(inputOf(result)).toHaveAttribute("aria-labelledby", label.id);
      expect(listbox).toHaveAttribute("aria-label", "Suggestions");
      expect(listbox).toHaveAttribute("aria-labelledby", `${listbox.id} ${label.id}`);
    });

    it("gives the chevron a name and keeps it out of the tab order", () => {
      const trigger = triggerOf(render({withLabel: true}));

      expect(trigger).toHaveAttribute("aria-label", "Show suggestions");
      expect(trigger).toHaveAttribute("tabindex", "-1");
    });
  });

  describe("opening and choosing", () => {
    it("opens on the chevron and shows every option", async () => {
      const result = render();

      await open(result);

      expect(result.screen.queryByRole("listbox")).not.toBeNull();
      expect(optionsOf(result).map((o) => o.textContent?.trim())).toEqual(["Cat", "Dog", "Panda"]);
    });

    it("chooses the option the arrows landed on and writes its text into the field", async () => {
      const onChange = vi.fn();
      const result = render({onChange});
      const input = inputOf(result);

      await open(result);
      keydown(input, "ArrowDown");
      await settle();
      keydown(input, "Enter");
      await settle();

      expect(onChange).toHaveBeenCalledWith("cat");
      expect(input.value).toBe("Cat");
      expect(result.screen.queryByRole("listbox")).toBeNull();
    });

    it("chooses the option that was pressed", async () => {
      const onChange = vi.fn();
      const result = render({onChange});

      await open(result);
      press(optionsOf(result)[1]!);
      await settle();

      expect(onChange).toHaveBeenCalledWith("dog");
      expect(inputOf(result).value).toBe("Dog");
    });

    it("narrows the options while typing", async () => {
      const result = render();
      const input = inputOf(result);

      await focus(input);
      await type(input, "pa");

      expect(optionsOf(result).map((o) => o.textContent?.trim())).toEqual(["Panda"]);
    });

    it("names the option the arrows landed on without moving the caret", async () => {
      const result = render();
      const input = inputOf(result);

      await open(result);
      await focus(input);
      keydown(input, "ArrowDown");
      await settle();

      const option = optionsOf(result)[0]!;

      expect(input).toHaveAttribute("aria-activedescendant", option.id);
      expect(option).toHaveAttribute("data-focus-visible", "true");
      // The caret never leaves the field, which is what lets typing and choosing go on together.
      expect(document.activeElement).toBe(input);
    });

    it("opens on ArrowDown when it is shut", async () => {
      const result = render({menuTrigger: "manual"});

      await focus(inputOf(result));
      keydown(inputOf(result), "ArrowDown");
      await settle();

      expect(result.screen.queryByRole("listbox")).not.toBeNull();
    });

    it("puts the field back on Escape", async () => {
      const result = render({defaultValue: "dog"});
      const input = inputOf(result);

      await focus(input);
      await type(input, "Do something");
      keydown(input, "Escape");
      await settle();

      expect(input.value).toBe("Dog");
      expect(result.screen.queryByRole("listbox")).toBeNull();
    });

    it("shows the chosen option's text without anything rendered", () => {
      // Nothing has ever opened, so no option exists in the DOM — the data is what answers.
      expect(inputOf(render({defaultValue: "cat"})).value).toBe("Cat");
    });

    it("says nothing matched when the caller asked it to", async () => {
      const result = render({allowsEmptyCollection: true, withEmptyState: true});
      const input = inputOf(result);

      await focus(input);
      await type(input, "zzz");

      expect(optionsOf(result)).toHaveLength(0);
      expect(result.screen.getByText("No results found")).toBeTruthy();
    });
  });

  describe("disabled and read-only", () => {
    it("does not open at all when disabled", async () => {
      const onChange = vi.fn();
      const result = render({isDisabled: true, onChange});

      expect(inputOf(result)).toBeDisabled();
      expect(triggerOf(result)).toBeDisabled();

      await open(result);

      expect(result.screen.queryByRole("listbox")).toBeNull();
      expect(onChange).not.toHaveBeenCalled();
    });

    it("does not open on the arrow keys when read-only", async () => {
      const result = render({isReadOnly: true});

      await focus(inputOf(result));
      keydown(inputOf(result), "ArrowDown");
      await settle();

      expect(result.screen.queryByRole("listbox")).toBeNull();
    });
  });

  describe("several options at once", () => {
    it("shows the chosen options beside the field", () => {
      const result = render({
        defaultValue: ["cat", "dog"],
        selectionMode: "multiple",
        withValue: true,
      });
      const value = result.container.querySelector('[data-slot="combo-box-value"]')!;

      expect(value.textContent?.trim()).toBe("Cat and Dog");
      expect(value).not.toHaveAttribute("data-placeholder");
    });

    it("shows a placeholder when nothing is chosen", () => {
      const result = render({selectionMode: "multiple", withValue: true});
      const value = result.container.querySelector('[data-slot="combo-box-value"]')!;

      expect(value).toHaveAttribute("data-placeholder", "true");
      expect(value.textContent?.trim()).toBe("Nothing chosen");
    });

    it("renders through the slot when the caller wrote one", () => {
      const result = render({
        defaultValue: ["cat", "dog"],
        selectionMode: "multiple",
        withCustomValue: true,
        withValue: true,
      });

      expect(
        result.container.querySelector('[data-testid="custom-value"]')!.textContent?.trim(),
      ).toBe("cat+dog");
    });

    it("keeps the popover open while more are chosen", async () => {
      const result = render({selectionMode: "multiple", withValue: true});

      await open(result);
      press(optionsOf(result)[0]!);
      await settle();

      expect(result.screen.queryByRole("listbox")).not.toBeNull();
    });
  });

  describe("validation", () => {
    it("renders a field error and marks the root invalid", () => {
      const result = render({isInvalid: true, withFieldError: true});

      expect(result.screen.getByText("Please choose an animal")).toBeTruthy();
      expect(result.container.querySelector('[data-slot="field-error"]')).not.toBeNull();
      expect(result.container.querySelector('[data-slot="combo-box"]')).toHaveAttribute(
        "data-invalid",
        "true",
      );
      expect(inputOf(result)).toHaveAttribute("aria-invalid", "true");
    });

    it("describes the field from its description", async () => {
      const result = render({withDescription: true, withLabel: true});

      // The description claims its id as it renders, which is after the field — so the attribute
      // derived from it only settles at the next flush.
      await settle();

      const description = result.container.querySelector('[data-slot="description"]')!;

      expect(inputOf(result).getAttribute("aria-describedby")).toContain(description.id);
    });
  });

  describe("a form", () => {
    it("submits the chosen key from a hidden control beside the field", async () => {
      const result = render({name: "animal", withForm: true});

      await open(result);
      press(optionsOf(result)[1]!);
      await settle();

      const hidden = result.container.querySelector<HTMLInputElement>('input[type="hidden"]')!;

      expect(hidden.name).toBe("animal");
      expect(hidden.value).toBe("dog");
      // The field carries the *text*, which is a different value — so it must not send one too.
      expect(inputOf(result)).not.toHaveAttribute("name");
    });

    it("submits the text itself when the caller asked for it", () => {
      const result = render({
        defaultValue: "cat",
        formValue: "text",
        name: "animal",
        withForm: true,
      });

      expect(result.container.querySelector('input[type="hidden"]')).toBeNull();
      expect(inputOf(result)).toHaveAttribute("name", "animal");
    });

    it("submits the text whenever a value of the caller's own is allowed", () => {
      // There is no key behind text nobody chose, so sending an empty one would be worse than
      // sending what the user actually typed.
      const result = render({allowsCustomValue: true, name: "animal", withForm: true});

      expect(result.container.querySelector('input[type="hidden"]')).toBeNull();
      expect(inputOf(result)).toHaveAttribute("name", "animal");
    });

    it("keeps the field's reset source in step with the chosen option's text", async () => {
      const result = render({defaultValue: "cat", name: "animal", withForm: true});

      await settle();

      /*
       * The *source*, not the value after a reset: jsdom restores a control synchronously inside the
       * dispatch, so a mirror written at post-flush always lands afterwards and every "value after
       * reset" assertion passes whether the source is there or not.
       *
       * Only the field is asserted. The hidden control needs no write of its own — measured, at
       * mount and after a change — because vapor keeps a `type="hidden"` input's attribute in step
       * on its own; see the note in `combo-box-hidden-input.vue`.
       */
      expectResetSource(inputOf(result), "Cat");
    });

    it("puts the chosen key back when the form is reset", async () => {
      const result = render({defaultValue: "cat", name: "animal", withForm: true});
      const form = result.container.querySelector("form")!;

      await open(result);
      press(optionsOf(result)[1]!);
      await settle();
      expect(inputOf(result).value).toBe("Dog");

      form.dispatchEvent(new Event("reset", {bubbles: true, cancelable: true}));
      await settle();

      /*
       * The *state* going back, which is the half a jsdom test can see: the reset listener writes it
       * synchronously, so the text and the hidden control both re-render from it. Restoring the key
       * rather than the element is also what puts the right *number* of hidden controls back — going
       * the other way round would leave a stale set behind.
       */
      expect(inputOf(result).value).toBe("Cat");
      expect(result.container.querySelector<HTMLInputElement>('input[type="hidden"]')!.value).toBe(
        "cat",
      );
    });
  });

  describe("focus", () => {
    it("does not close when focus moves to the chevron", async () => {
      const result = render({menuTrigger: "focus"});

      // Focus is what opens this one, so pressing the chevron afterwards would only close it.
      await focus(inputOf(result));
      expect(result.screen.queryByRole("listbox")).not.toBeNull();

      await blur(inputOf(result), triggerOf(result));

      // Pressing the chevron moves focus through it on the way to the field, so reading that as
      // leaving would close the popover the same press just opened.
      expect(result.screen.queryByRole("listbox")).not.toBeNull();
    });

    it("settles the field and closes when focus leaves for good", async () => {
      const outside = document.createElement("button");

      document.body.append(outside);
      cleanups.push(() => outside.remove());

      const result = render({defaultValue: "cat"});
      const input = inputOf(result);

      await focus(input);
      await type(input, "Ca");
      await blur(input, outside);

      expect(input.value).toBe("Cat");
      expect(result.screen.queryByRole("listbox")).toBeNull();
    });
  });
});
