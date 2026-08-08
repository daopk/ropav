import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick, reactive} from "vue";

import Fixture from "./fixtures.vue";

const renderSearchField = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, {props});
  const root = result.container.querySelector('[data-slot="search-field"]');

  if (!root) throw new Error("field not rendered");

  return {
    ...result,
    clearButton: result.container.querySelector<HTMLButtonElement>(
      '[data-slot="search-field-clear-button"]',
    )!,
    control: result.container.querySelector("input") as HTMLInputElement,
    group: result.container.querySelector('[data-slot="search-field-group"]')!,
    root,
  };
};

const type = (control: HTMLInputElement, value: string) => {
  control.value = value;
  control.dispatchEvent(new Event("input"));
};

const press = (control: HTMLElement, key: string) => {
  const event = new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key});

  control.dispatchEvent(event);

  return event;
};

describe("SearchField", () => {
  describe("structure", () => {
    it("renders every part with its data-slot", () => {
      const {container, root, unmount} = renderSearchField({withDescription: true});

      expect(root).toHaveAttribute("data-slot", "search-field");
      expect(container.querySelector('[data-slot="label"]')).not.toBeNull();
      expect(container.querySelector('[data-slot="search-field-group"]')).not.toBeNull();
      expect(container.querySelector('[data-slot="search-field-search-icon"]')).not.toBeNull();
      expect(container.querySelector('[data-slot="search-field-input"]')).not.toBeNull();
      expect(container.querySelector('[data-slot="search-field-clear-button"]')).not.toBeNull();
      expect(container.querySelector('[data-slot="description"]')).not.toBeNull();

      unmount();
    });

    it("renders the BEM classes of each part", () => {
      const {container, group, root, unmount} = renderSearchField();

      expect(root).toHaveClass("search-field", "search-field--primary");
      expect(group).toHaveClass("search-field__group");
      expect(container.querySelector('[data-slot="search-field-search-icon"]')).toHaveClass(
        "search-field__search-icon",
      );
      expect(container.querySelector('[data-slot="search-field-input"]')).toHaveClass(
        "search-field__input",
      );
      expect(container.querySelector('[data-slot="search-field-clear-button"]')).toHaveClass(
        "close-button",
        "search-field__clear-button",
      );

      unmount();
    });

    it("renders the clear button as a close button", () => {
      // The stylesheet reaches the icon through `.search-field__clear-button
      // [data-slot="close-button-icon"]`, so the markup underneath has to be a close button's.
      const {clearButton, unmount} = renderSearchField();

      expect(clearButton.tagName).toBe("BUTTON");
      expect(clearButton).toHaveAttribute("data-slot", "search-field-clear-button");
      expect(clearButton.querySelector('[data-slot="close-button-icon"]')).not.toBeNull();

      unmount();
    });

    it("renders slot=clear on the clear button", () => {
      // A live CSS contract: `.search-field__group:has([slot="clear"])` is what strips the
      // trailing radius and padding off the control.
      const {clearButton, group, unmount} = renderSearchField();

      expect(clearButton).toHaveAttribute("slot", "clear");
      expect(group.querySelector('[slot="clear"]')).toBe(clearButton);

      unmount();
    });

    it("renders the group as a group rather than presentational", () => {
      // Unlike the group inside a text field: a search field hands its group no role, so the
      // group reports itself.
      const {group, unmount} = renderSearchField();

      expect(group).toHaveAttribute("role", "group");

      unmount();
    });

    it("supports a class on the root", () => {
      const {root, unmount} = renderSearchField({class: "custom-field"});

      expect(root).toHaveClass("search-field", "custom-field");

      unmount();
    });
  });

  describe("control", () => {
    it("renders type=search by default", () => {
      const {control, unmount} = renderSearchField();

      expect(control).toHaveAttribute("type", "search");

      unmount();
    });

    it("supports another type", () => {
      // Read off the property, not the attribute: Vue writes `type` as a DOM property and
      // skips it when it already matches, and an input's own default is `text` — so asking for
      // `text` renders no attribute at all. The same reason `type="submit"` never appears on a
      // button.
      const {control, unmount} = renderSearchField({type: "text"});

      expect(control.type).toBe("text");
      expect(control).not.toHaveAttribute("type");

      unmount();
    });

    it("points the label at the control", () => {
      const {container, control, unmount} = renderSearchField();

      expect(container.querySelector('[data-slot="label"]')).toHaveAttribute("for", control.id);

      unmount();
    });

    it("prefers a placeholder set on the control over the field's", () => {
      const {control, unmount} = renderSearchField({
        controlPlaceholder: "find things",
        placeholder: "search",
      });

      expect(control).toHaveAttribute("placeholder", "find things");

      unmount();
    });
  });

  describe("variant and fullWidth", () => {
    it("supports the secondary variant", () => {
      const {group, root, unmount} = renderSearchField({variant: "secondary"});

      expect(root).toHaveClass("search-field--secondary");
      // The variant lives on the root; the stylesheet reaches the group through it.
      expect(group).toHaveClass("search-field__group");
      expect(group).not.toHaveClass("search-field--secondary");

      unmount();
    });

    it("supports fullWidth on the root and on the group", () => {
      const {group, root, unmount} = renderSearchField({fullWidth: true});

      expect(root).toHaveClass("search-field--full-width");
      expect(group).toHaveClass("search-field__group--full-width");

      unmount();
    });

    it("applies fullWidth written as a bare attribute", () => {
      // A boolean prop declared through an imported indexed-access type compiles without a
      // runtime type, and Vue then leaves a valueless attribute as `""` — falsy, so the
      // modifier never lands. The bound form above stays green while that is broken.
      const {group, root, unmount} = renderSearchField({attributeForm: true});

      expect(root).toHaveClass("search-field--full-width");
      expect(group).toHaveClass("search-field__group--full-width");

      unmount();
    });
  });

  describe("empty state", () => {
    it("reports the field as empty while there is nothing to clear", () => {
      // `data-empty` is what hides the clear button, so it has to sit on the root the
      // stylesheet selects from.
      const {root, unmount} = renderSearchField();

      expect(root).toHaveAttribute("data-empty", "true");

      unmount();
    });

    it("stops reporting empty once there is a value", async () => {
      const {control, root, unmount} = renderSearchField();

      type(control, "shoes");
      await nextTick();

      expect(root).not.toHaveAttribute("data-empty");

      unmount();
    });

    it("starts out not empty with a default value", () => {
      const {root, unmount} = renderSearchField({defaultValue: "shoes"});

      expect(root).not.toHaveAttribute("data-empty");

      unmount();
    });
  });

  describe("clearing", () => {
    it("empties the field when the clear button is pressed", async () => {
      const onClear = vi.fn();
      const {clearButton, control, root, unmount} = renderSearchField({
        defaultValue: "shoes",
        onClear,
      });

      clearButton.click();
      await nextTick();

      expect(control).toHaveValue("");
      expect(root).toHaveAttribute("data-empty", "true");
      expect(onClear).toHaveBeenCalledTimes(1);

      unmount();
    });

    it("reports the cleared value as a change", async () => {
      const onChange = vi.fn();
      const {clearButton, unmount} = renderSearchField({defaultValue: "shoes", onChange});

      clearButton.click();
      await nextTick();

      expect(onChange).toHaveBeenCalledWith("");

      unmount();
    });

    it("empties the field on Escape", async () => {
      const onClear = vi.fn();
      const {control, unmount} = renderSearchField({defaultValue: "shoes", onClear});

      const event = press(control, "Escape");

      await nextTick();

      expect(control).toHaveValue("");
      expect(onClear).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);

      unmount();
    });

    it("lets Escape through on an already empty field", () => {
      // A dialog around the field still has to close on the first press, so an empty field
      // must not swallow the key.
      const onClear = vi.fn();
      const {control, unmount} = renderSearchField({onClear});

      const event = press(control, "Escape");

      expect(event.defaultPrevented).toBe(false);
      expect(onClear).not.toHaveBeenCalled();

      unmount();
    });

    it("empties a field whose value was written straight onto the control", () => {
      // The element is checked as well as the state, for a caller that set the value on the
      // control rather than through the field.
      const {control, unmount} = renderSearchField();

      control.value = "typed past the state";

      const event = press(control, "Escape");

      expect(event.defaultPrevented).toBe(true);
      expect(control).toHaveValue("");

      unmount();
    });

    it("does nothing when the field is disabled", () => {
      const onClear = vi.fn();
      const {clearButton, control, unmount} = renderSearchField({
        defaultValue: "shoes",
        isDisabled: true,
        onClear,
      });

      press(control, "Escape");
      clearButton.click();

      expect(control).toHaveValue("shoes");
      expect(onClear).not.toHaveBeenCalled();

      unmount();
    });

    it("does nothing when the field is read-only", () => {
      const onClear = vi.fn();
      const {clearButton, control, unmount} = renderSearchField({
        defaultValue: "shoes",
        isReadOnly: true,
        onClear,
      });

      press(control, "Escape");
      clearButton.click();

      expect(control).toHaveValue("shoes");
      expect(onClear).not.toHaveBeenCalled();

      unmount();
    });
  });

  describe("clear button wiring", () => {
    it("names the clear button for what it does", () => {
      // The name comes from the field rather than from the close button's own default, which
      // says "Close".
      const {clearButton, unmount} = renderSearchField();

      expect(clearButton).toHaveAccessibleName("Clear search");

      unmount();
    });

    it("keeps the clear button out of the tab order", () => {
      // Escape does the same job from the keyboard, and a tab stop that only appears once
      // there is text would shift the tab order as the user types.
      const {clearButton, unmount} = renderSearchField();

      expect(clearButton).toHaveAttribute("tabindex", "-1");

      unmount();
    });

    it("disables the clear button along with the field", () => {
      const {clearButton, unmount} = renderSearchField({isDisabled: true});

      expect(clearButton).toBeDisabled();
      expect(clearButton).toHaveAttribute("data-disabled", "true");

      unmount();
    });

    it("drops the tabindex once the clear button is disabled", () => {
      // `disabled` already takes the button out of the tab order, so the explicit `-1` has
      // nothing left to do. Matched to react-aria's DOM rather than to its source.
      const {clearButton, unmount} = renderSearchField({isDisabled: true});

      expect(clearButton).not.toHaveAttribute("tabindex");

      unmount();
    });

    it("disables the clear button on a read-only field", () => {
      const {clearButton, unmount} = renderSearchField({isReadOnly: true});

      expect(clearButton).toBeDisabled();

      unmount();
    });

    it("hands focus back to the control on the way down", async () => {
      // On the way down rather than on click, so touching the clear button never takes focus
      // off the input and folds the on-screen keyboard away.
      const {clearButton, control, unmount} = renderSearchField({defaultValue: "shoes"});

      clearButton.dispatchEvent(
        new PointerEvent("pointerdown", {bubbles: true, cancelable: true, pointerType: "mouse"}),
      );
      await nextTick();

      expect(control).toHaveFocus();

      unmount();
    });
  });

  describe("submitting", () => {
    it("reports Enter as a submit and keeps it off the form", () => {
      const onSubmit = vi.fn();
      const {control, unmount} = renderSearchField({defaultValue: "shoes", onSubmit});

      const event = press(control, "Enter");

      expect(onSubmit).toHaveBeenCalledWith("shoes");
      expect(event.defaultPrevented).toBe(true);

      unmount();
    });

    it("leaves Enter to the form when nothing listens for a submit", () => {
      const {control, unmount} = renderSearchField({defaultValue: "shoes"});

      const event = press(control, "Enter");

      expect(event.defaultPrevented).toBe(false);

      unmount();
    });
  });

  describe("state", () => {
    it("reports disabled on the root, the group and the control", () => {
      const {control, group, root, unmount} = renderSearchField({isDisabled: true});

      expect(root).toHaveAttribute("data-disabled", "true");
      expect(group).toHaveAttribute("data-disabled", "true");
      expect(control).toBeDisabled();

      unmount();
    });

    it("reports invalid on the root, the group and the control", () => {
      const {control, group, root, unmount} = renderSearchField({isInvalid: true});

      expect(root).toHaveAttribute("data-invalid", "true");
      expect(group).toHaveAttribute("data-invalid", "true");
      expect(control).toHaveAttribute("aria-invalid", "true");

      unmount();
    });

    it("reports readonly on the root only", () => {
      // React's field hands the group no read-only flag, so the shell carries no mark.
      const {control, group, root, unmount} = renderSearchField({isReadOnly: true});

      expect(root).toHaveAttribute("data-readonly", "true");
      expect(group).not.toHaveAttribute("data-readonly");
      expect(control).toHaveAttribute("readonly");

      unmount();
    });

    it("reports required on the root, where the asterisk is drawn from", () => {
      const {root, unmount} = renderSearchField({isRequired: true});

      expect(root).toHaveAttribute("data-required", "true");

      unmount();
    });

    it("reports hover and focus on the group", async () => {
      const {control, group, unmount} = renderSearchField();

      group.dispatchEvent(new PointerEvent("pointerenter", {bubbles: true, pointerType: "mouse"}));
      await nextTick();
      expect(group).toHaveAttribute("data-hovered", "true");

      control.focus();
      await nextTick();
      expect(group).toHaveAttribute("data-focus-within", "true");

      unmount();
    });
  });

  describe("value", () => {
    it("reports typing", () => {
      const onChange = vi.fn();
      const {control, unmount} = renderSearchField({onChange});

      type(control, "shoes");

      expect(onChange).toHaveBeenCalledWith("shoes");

      unmount();
    });

    it("keeps a controlled field at the value its owner allows", async () => {
      const {control, unmount} = renderSearchField({value: "pinned"});

      type(control, "typed over it");
      await nextTick();

      expect(control).toHaveValue("pinned");

      unmount();
    });

    it("lets the control own the value, taking it over from the field", async () => {
      const {control, unmount} = renderSearchField({
        controlValue: "pinned",
        defaultValue: "from the field",
      });

      expect(control).toHaveValue("pinned");

      type(control, "typed over it");
      await nextTick();

      expect(control).toHaveValue("pinned");

      unmount();
    });

    it("follows an owner that accepts the change", async () => {
      const props = reactive<Record<string, unknown>>({value: "a"});

      props["onChange"] = (next: string) => {
        props["value"] = next;
      };

      const result = renderVapor(Fixture, {props});
      const control = result.container.querySelector("input")!;

      type(control, "ab");
      await nextTick();

      expect(control).toHaveValue("ab");

      result.unmount();
    });
  });

  describe("validation", () => {
    it("shows the message a validate function returns", async () => {
      // `aria` behaviour, because under `native` the message is held back until a submit is
      // attempted — that path is covered where a form is involved.
      const {container, control, root, unmount} = renderSearchField({
        validate: (value: string) => (value.length < 3 ? "Too short" : true),
        validationBehavior: "aria",
        withFieldError: true,
      });

      type(control, "ab");
      await nextTick();

      expect(root).toHaveAttribute("data-invalid", "true");
      expect(container.querySelector('[data-slot="field-error"]')).toHaveTextContent("Too short");

      unmount();
    });

    it("clears the message once the value passes", async () => {
      const {container, control, root, unmount} = renderSearchField({
        validate: (value: string) => (value.length < 3 ? "Too short" : true),
        validationBehavior: "aria",
        withFieldError: true,
      });

      type(control, "ab");
      await nextTick();
      type(control, "abc");
      await nextTick();

      expect(root).not.toHaveAttribute("data-invalid");
      // The message element leaves the DOM rather than staying behind empty, which is what
      // keeps `aria-describedby` from pointing at nothing.
      expect(container.querySelector('[data-slot="field-error"]')).toBeNull();

      unmount();
    });
  });

  describe("custom content", () => {
    it("renders a custom search icon in place of the built-in one", () => {
      // React clones the class and the slot onto the caller's element; a vapor slot cannot be
      // inspected, so the caller writes them. The default branch is untouched.
      const {container, unmount} = renderSearchField({customSearchIcon: true});

      expect(container.querySelector("[data-testid='custom-search']")).not.toBeNull();
      expect(container.querySelectorAll('[data-slot="search-field-search-icon"]')).toHaveLength(1);

      unmount();
    });

    it("renders custom content inside the clear button", () => {
      const {clearButton, container, unmount} = renderSearchField({customClearIcon: true});

      expect(container.querySelector("[data-testid='custom-clear']")).not.toBeNull();
      expect(clearButton.querySelector('[data-slot="close-button-icon"]')).toBeNull();

      unmount();
    });

    it("leaves the search icon out when it is not rendered", () => {
      const {container, unmount} = renderSearchField({withSearchIcon: false});

      expect(container.querySelector('[data-slot="search-field-search-icon"]')).toBeNull();

      unmount();
    });

    it("leaves the clear button out when it is not rendered", () => {
      const {group, unmount} = renderSearchField({withClearButton: false});

      expect(group.querySelector('[slot="clear"]')).toBeNull();

      unmount();
    });
  });
});
