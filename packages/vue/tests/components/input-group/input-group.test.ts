import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick, reactive} from "vue";

import Fixture from "./fixtures.vue";

const renderGroup = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, {props});
  const group = result.container.querySelector('[data-slot="input-group"]');

  if (!group) throw new Error("group not rendered");

  return {
    ...result,
    control: result.container.querySelector("input, textarea") as
      | HTMLInputElement
      | HTMLTextAreaElement,
    group,
  };
};

const type = (control: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  control.value = value;
  control.dispatchEvent(new Event("input"));
};

describe("InputGroup", () => {
  describe("structure", () => {
    it("renders every part with its data-slot", () => {
      const {container, group, unmount} = renderGroup({withPrefix: true, withSuffix: true});

      expect(group).toHaveAttribute("data-slot", "input-group");
      expect(container.querySelector('[data-slot="input-group-prefix"]')).not.toBeNull();
      expect(container.querySelector('[data-slot="input-group-input"]')).not.toBeNull();
      expect(container.querySelector('[data-slot="input-group-suffix"]')).not.toBeNull();

      unmount();
    });

    it("renders the BEM classes of each part", () => {
      const {container, group, unmount} = renderGroup({withPrefix: true, withSuffix: true});

      expect(group).toHaveClass("input-group", "input-group--primary");
      expect(container.querySelector('[data-slot="input-group-prefix"]')).toHaveClass(
        "input-group__prefix",
      );
      expect(container.querySelector('[data-slot="input-group-input"]')).toHaveClass(
        "input-group__input",
      );
      expect(container.querySelector('[data-slot="input-group-suffix"]')).toHaveClass(
        "input-group__suffix",
      );

      unmount();
    });

    it("renders a textarea on the same class as an input", () => {
      // The stylesheet reaches the textarea through `.input-group__input[data-slot=…textarea]`,
      // so the class has to be the shared one and the slot the specific one.
      const {container, unmount} = renderGroup({withTextArea: true});
      const control = container.querySelector("textarea");

      expect(control).toHaveClass("input-group__input");
      expect(control).toHaveAttribute("data-slot", "input-group-textarea");
      expect(container.querySelector('[data-slot="input-group-input"]')).toBeNull();

      unmount();
    });

    it("supports a class on every part", () => {
      const {group, unmount} = renderGroup({class: "custom-group"});

      expect(group).toHaveClass("input-group", "custom-group");

      unmount();
    });
  });

  describe("role", () => {
    it("reads as a group when it stands on its own", () => {
      const {group, unmount} = renderGroup();

      expect(group).toHaveAttribute("role", "group");

      unmount();
    });

    it("reads as presentational inside a field", () => {
      // The field is what assistive technology reports, so a second grouping around the
      // control would only add noise.
      const {group, unmount} = renderGroup({withField: true});

      expect(group).toHaveAttribute("role", "presentation");

      unmount();
    });
  });

  describe("variant", () => {
    it("supports the secondary variant", () => {
      const {container, group, unmount} = renderGroup({variant: "secondary"});

      expect(group).toHaveClass("input-group--secondary");
      expect(group).not.toHaveClass("input-group--primary");
      // The parts keep the shared classes; the variant only reaches them through the group.
      expect(container.querySelector('[data-slot="input-group-input"]')).toHaveClass(
        "input-group__input",
      );

      unmount();
    });

    it("takes the variant from the field it sits in", () => {
      const {group, unmount} = renderGroup({fieldVariant: "secondary", withField: true});

      expect(group).toHaveClass("input-group--secondary");

      unmount();
    });

    it("prefers its own variant over the field's", () => {
      const {group, unmount} = renderGroup({
        fieldVariant: "secondary",
        variant: "primary",
        withField: true,
      });

      expect(group).toHaveClass("input-group--primary");
      expect(group).not.toHaveClass("input-group--secondary");

      unmount();
    });
  });

  describe("fullWidth", () => {
    it("supports fullWidth", () => {
      const {group, unmount} = renderGroup({fullWidth: true});

      expect(group).toHaveClass("input-group--full-width");

      unmount();
    });

    it("applies fullWidth written as a bare attribute", () => {
      // A boolean prop declared through an imported indexed-access type compiles without a
      // runtime type, and Vue then leaves a valueless attribute as `""` — falsy, so the
      // modifier never lands. The bound form above stays green while that is broken.
      const {group, unmount} = renderGroup({attributeForm: true, withField: true});

      expect(group).toHaveClass("input-group--full-width");

      unmount();
    });

    it("leaves fullWidth off by default", () => {
      const {group, unmount} = renderGroup();

      expect(group).not.toHaveClass("input-group--full-width");

      unmount();
    });
  });

  describe("state from the field", () => {
    it("reports the field's disabled state", () => {
      const {control, group, unmount} = renderGroup({fieldIsDisabled: true, withField: true});

      expect(group).toHaveAttribute("data-disabled", "true");
      expect(control).toBeDisabled();

      unmount();
    });

    it("reports the field's invalid state", () => {
      const {group, unmount} = renderGroup({fieldIsInvalid: true, withField: true});

      expect(group).toHaveAttribute("data-invalid", "true");

      unmount();
    });

    it("prefers its own disabled state over the field's", () => {
      const {group, unmount} = renderGroup({
        fieldIsDisabled: true,
        isDisabled: false,
        withField: true,
      });

      expect(group).not.toHaveAttribute("data-disabled");

      unmount();
    });

    it("supports its own disabled and invalid state with no field around it", () => {
      const {group, unmount} = renderGroup({isDisabled: true, isInvalid: true});

      expect(group).toHaveAttribute("data-disabled", "true");
      expect(group).toHaveAttribute("data-invalid", "true");

      unmount();
    });

    it("never takes readonly from the field", () => {
      // React's field hands the group only a role, an invalid and a disabled flag, so a
      // read-only field leaves no mark on the shell around the control.
      const {group, unmount} = renderGroup({withField: true});

      expect(group).not.toHaveAttribute("data-readonly");

      unmount();
    });

    it("supports its own readonly state", () => {
      const {group, unmount} = renderGroup({isReadOnly: true});

      expect(group).toHaveAttribute("data-readonly", "true");

      unmount();
    });

    it("exposes the resolved state to its slot", () => {
      const {container, unmount} = renderGroup({fieldIsInvalid: true, withField: true});

      // The slot renders the control, so the control being there at all is the proof the slot
      // ran; the flags it receives are asserted through the attributes above.
      expect(container.querySelector('[data-slot="input-group-input"]')).not.toBeNull();

      unmount();
    });
  });

  describe("tab order", () => {
    // Written even though a native input and textarea are already tabbable: Safari does not
    // focus one unless an explicit tab index says so, which is why react-aria always sets it —
    // `useTextField` picks it up from `useFocusable`.
    it("renders an explicit tab index on the input", () => {
      const {control, unmount} = renderGroup({withField: true});

      expect(control).toHaveAttribute("tabindex", "0");

      unmount();
    });

    it("renders an explicit tab index on a textarea", () => {
      const {control, unmount} = renderGroup({withField: true, withTextArea: true});

      expect(control).toHaveAttribute("tabindex", "0");

      unmount();
    });

    it("drops the tab index when the field is disabled", () => {
      const {control, unmount} = renderGroup({fieldIsDisabled: true, withField: true});

      expect(control.hasAttribute("tabindex")).toBe(false);

      unmount();
    });

    // The tab index rides along with the field, so a group standing on its own carries none —
    // which is what React does too, where a bare `Input` never reaches `useTextField`.
    it("writes no tab index without a field around it", () => {
      const {control, unmount} = renderGroup();

      expect(control.hasAttribute("tabindex")).toBe(false);

      unmount();
    });
  });

  describe("hover and focus", () => {
    it("reports hover on the group", async () => {
      const {group, unmount} = renderGroup();

      group.dispatchEvent(new PointerEvent("pointerenter", {bubbles: true, pointerType: "mouse"}));
      await nextTick();
      expect(group).toHaveAttribute("data-hovered", "true");

      group.dispatchEvent(new PointerEvent("pointerleave", {bubbles: true, pointerType: "mouse"}));
      await nextTick();
      expect(group).not.toHaveAttribute("data-hovered");

      unmount();
    });

    it("stops reporting hover once disabled", async () => {
      const {group, unmount} = renderGroup({isDisabled: true});

      group.dispatchEvent(new PointerEvent("pointerenter", {bubbles: true, pointerType: "mouse"}));
      await nextTick();
      expect(group).not.toHaveAttribute("data-hovered");

      unmount();
    });

    it("reports focus reaching anything inside", async () => {
      // Load-bearing, not decoration: the stylesheet suppresses the hover fill while focus is
      // inside, keying on this attribute alongside `:focus-within`.
      const {control, group, unmount} = renderGroup();

      control.focus();
      await nextTick();
      expect(group).toHaveAttribute("data-focus-within", "true");

      control.blur();
      await nextTick();
      expect(group).not.toHaveAttribute("data-focus-within");

      unmount();
    });

    it("keeps reporting focus while it moves between two children", async () => {
      const {container, group, unmount} = renderGroup({withField: true, withSuffixButton: true});
      const control = container.querySelector("input")!;
      const button = container.querySelector<HTMLButtonElement>("[data-testid='suffix-button']")!;

      control.focus();
      await nextTick();
      expect(group).toHaveAttribute("data-focus-within", "true");

      button.focus();
      await nextTick();
      expect(group).toHaveAttribute("data-focus-within", "true");

      unmount();
    });
  });

  describe("click to focus", () => {
    it("moves focus into the control when the shell is clicked", () => {
      const {control, group, unmount} = renderGroup({withPrefix: true});

      (group as HTMLElement).click();
      expect(control).toHaveFocus();

      unmount();
    });

    it("moves focus into the control when a prefix is clicked", () => {
      const {container, control, unmount} = renderGroup({withPrefix: true});

      container.querySelector<HTMLElement>('[data-slot="input-group-prefix"]')!.click();
      expect(control).toHaveFocus();

      unmount();
    });

    it("leaves focus alone when the control itself is clicked", () => {
      const {control, unmount} = renderGroup();
      const focus = vi.spyOn(control, "focus");

      control.click();
      expect(focus).not.toHaveBeenCalled();

      focus.mockRestore();
      unmount();
    });

    it("never pulls focus into a textarea", () => {
      // React queries `input` alone, so a group holding a textarea does not react to a click
      // beside it. Pinned here so it does not drift into being fixed by accident.
      const {control, group, unmount} = renderGroup({withPrefix: true, withTextArea: true});

      (group as HTMLElement).click();
      expect(control).not.toHaveFocus();

      unmount();
    });

    it("finds the control of its own group only", () => {
      const first = renderGroup();
      const second = renderGroup();

      (first.group as HTMLElement).click();
      expect(first.control).toHaveFocus();
      expect(second.control).not.toHaveFocus();

      first.unmount();
      second.unmount();
    });
  });

  describe("value", () => {
    it("shows the value the field holds", () => {
      const {control, unmount} = renderGroup({fieldDefaultValue: "heroui.com", withField: true});

      expect(control).toHaveValue("heroui.com");

      unmount();
    });

    it("reports typing to the field", () => {
      const onChange = vi.fn();
      const {control, unmount} = renderGroup({
        onControlChange: onChange,
        withField: true,
      });

      type(control, "heroui");
      expect(onChange).toHaveBeenCalledWith("heroui");

      unmount();
    });

    it("prefers a placeholder set on the control over the field's", () => {
      const {control, unmount} = renderGroup({
        controlPlaceholder: "your site",
        withField: true,
      });

      expect(control).toHaveAttribute("placeholder", "your site");

      unmount();
    });

    it("lets the control own the value even inside a field", () => {
      const {control, unmount} = renderGroup({
        controlValue: "pinned",
        fieldDefaultValue: "from the field",
        withField: true,
      });

      expect(control).toHaveValue("pinned");

      unmount();
    });

    it("puts back a value its owner keeps unchanged", async () => {
      // The browser has already moved the text by the time the listener runs, and Vapor skips
      // writing `value` when the bound value has not changed — so without an outright write
      // the rejected text would stay on screen.
      const {control, unmount} = renderGroup({controlValue: "pinned"});

      type(control, "typed over it");
      await nextTick();

      expect(control).toHaveValue("pinned");

      unmount();
    });

    it("follows an owner that accepts the change", async () => {
      const props = reactive<Record<string, unknown>>({controlValue: "a"});

      props["onControlChange"] = (next: string) => {
        props["controlValue"] = next;
      };

      const result = renderVapor(Fixture, {props});
      const control = result.container.querySelector("input")!;

      type(control, "ab");
      await nextTick();

      expect(control).toHaveValue("ab");

      result.unmount();
    });

    it("supports a textarea owning its own value", async () => {
      const {control, unmount} = renderGroup({controlValue: "pinned", withTextArea: true});

      expect(control).toHaveValue("pinned");

      type(control, "typed over it");
      await nextTick();
      expect(control).toHaveValue("pinned");

      unmount();
    });
  });

  describe("control state", () => {
    it("reports hover and focus on the control", async () => {
      const {control, unmount} = renderGroup();

      control.dispatchEvent(
        new PointerEvent("pointerenter", {bubbles: true, pointerType: "mouse"}),
      );
      await nextTick();
      expect(control).toHaveAttribute("data-hovered", "true");

      control.dispatchEvent(new FocusEvent("focus"));
      await nextTick();
      expect(control).toHaveAttribute("data-focused", "true");

      unmount();
    });

    it("reports the field's state on the control", () => {
      const {control, unmount} = renderGroup({
        fieldIsDisabled: true,
        withField: true,
      });

      expect(control).toHaveAttribute("data-disabled", "true");

      unmount();
    });
  });
});
