import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import { ColorField } from "@/components/color-field";

import Fixture from "./fixtures.vue";

const renderField = (props: Record<string, unknown> = {}) => renderVapor(Fixture, { props });

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

const input = (container: HTMLElement) =>
  container.querySelector<HTMLInputElement>("[data-slot='color-input-group-input']")!;

const type = (element: HTMLInputElement, value: string) => {
  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
};

const key = (element: HTMLElement, keyName: string) => {
  element.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: keyName }),
  );
};

describe("ColorField", () => {
  describe("structure", () => {
    it("renders the field, the group and the control", () => {
      const { container, unmount } = renderField({ defaultValue: "#0485F7" });

      expect(slot(container, "color-field")).toBeInTheDocument();
      expect(slot(container, "color-input-group")).toBeInTheDocument();
      expect(slot(container, "color-input-group-input")).toBeInTheDocument();

      unmount();
    });

    it("renders a prefix and a suffix when asked", () => {
      const { container, unmount } = renderField({ withPrefix: true, withSuffix: true });

      // Live CSS contracts: `.color-input-group:has([data-slot="color-input-group-prefix"])` is
      // what removes the control's leading radius, so the attribute is the whole mechanism.
      expect(slot(container, "color-input-group-prefix")).toHaveTextContent("P");
      expect(slot(container, "color-input-group-suffix")).toHaveTextContent("S");

      unmount();
    });

    it("marks the group presentational inside a field", () => {
      // The field is what assistive technology reads; a second grouping around the control would
      // only add noise.
      const { container, unmount } = renderField();

      expect(slot(container, "color-input-group")).toHaveAttribute("role", "presentation");

      unmount();
    });

    it("carries the BEM classes the stylesheet keys on", () => {
      const { container, unmount } = renderField({ fullWidth: true, variant: "secondary" });

      expect(slot(container, "color-field")).toHaveClass("color-field", "color-field--full-width");
      expect(slot(container, "color-input-group")).toHaveClass(
        "color-input-group",
        "color-input-group--secondary",
      );

      unmount();
    });

    it("puts a caller's id on the control, on either branch", () => {
      // The control is the field as far as assistive technology is concerned, so an id given to
      // the field belongs on it — and the label's `for` has to follow.
      const { container, unmount } = renderField({ defaultValue: "#0485F7", id: "brand-color" });

      expect(input(container)).toHaveAttribute("id", "brand-color");
      expect(slot(container, "label")).toHaveAttribute("for", "brand-color");
      unmount();

      const { container: channel, unmount: unmountChannel } = renderField({
        channel: "red",
        colorSpace: "rgb",
        defaultValue: "#3B82F6",
        id: "red-channel",
      });

      expect(input(channel)).toHaveAttribute("id", "red-channel");
      unmountChannel();
    });

    it("wires the label both ways", () => {
      // The control points back at the label so a screen reader reads a name, and the label points
      // `for` at the control so a pointer click moves focus into it.
      const { container, unmount } = renderField();
      const label = slot(container, "label");

      expect(input(container)).toHaveAttribute("aria-labelledby", label.id);
      expect(label).toHaveAttribute("for", input(container).id);

      unmount();
    });

    it("points at a description and an error message once they exist", async () => {
      const { container, unmount } = renderField({
        isInvalid: true,
        withDescription: true,
        withFieldError: true,
      });

      // A part has to *claim* its id, so the field only references the slots that really
      // rendered — which is one tick after the field itself.
      await nextTick();

      const described = input(container).getAttribute("aria-describedby") ?? "";

      expect(described).toContain(slot(container, "description").id);
      expect(described).toContain(slot(container, "field-error").id);

      unmount();
    });

    it("references no description when none was rendered", () => {
      // A dangling idref is worse than no attribute: a screen reader reads nothing and the user
      // cannot tell the difference from a bug.
      const { container, unmount } = renderField();

      expect(input(container)).not.toHaveAttribute("aria-describedby");

      unmount();
    });
  });

  describe("the channel it edits", () => {
    it("says hex when no channel was given", () => {
      const { container, unmount } = renderField({ defaultValue: "#0485F7" });

      expect(slot(container, "color-field")).toHaveAttribute("data-channel", "hex");

      unmount();
    });

    it("names the channel it was given", () => {
      const { container, unmount } = renderField({
        channel: "hue",
        colorSpace: "hsl",
        defaultValue: "#7F007F",
      });

      expect(slot(container, "color-field")).toHaveAttribute("data-channel", "hue");

      unmount();
    });

    it("shows the hex value on the hex branch", () => {
      const { container, unmount } = renderField({ defaultValue: "#0485F7" });

      expect(input(container).value).toBe("#0485F7");
      expect(input(container)).toHaveAttribute("role", "textbox");

      unmount();
    });

    it("shows the formatted channel value on the channel branch", () => {
      const { container, unmount } = renderField({
        channel: "hue",
        colorSpace: "hsl",
        defaultValue: "#7F007F",
      });

      expect(input(container).value).toBe("300°");
      expect(input(container)).toHaveAttribute("aria-roledescription", "Number field");

      unmount();
    });

    it("settles the branch when the field is created", async () => {
      // Deliberate, and the reason the two branches live in one component: the field hands its
      // wiring to the control through `provide`, and a provide made one component deeper than the
      // one a caller's slot content was handed to never reaches that content from a VDOM host. So
      // `channel` is read once — React remounts on a change here, and a caller who really needs
      // that writes `:key`, which the next test covers.
      //
      // Both keys are present from the start: `renderVapor` wraps the keys the props object has at
      // mount, so one added later never reaches the component.
      const props = reactive<{ channel?: string; colorSpace?: string; defaultValue: string }>({
        channel: undefined,
        colorSpace: undefined,
        defaultValue: "#7F007F",
      });
      const { container, unmount } = renderField(props);

      expect(input(container).value).toBe("#7F007F");

      props.channel = "hue";
      props.colorSpace = "hsl";
      await nextTick();
      await nextTick();

      expect(input(container).value).toBe("#7F007F");

      unmount();
    });

    it("rebuilds the field when the caller keys it", async () => {
      const props = reactive<{
        channel?: string;
        colorSpace?: string;
        defaultValue: string;
        fieldKey: string;
      }>({
        channel: undefined,
        colorSpace: undefined,
        defaultValue: "#7F007F",
        fieldKey: "hex",
      });
      const { container, unmount } = renderField(props);

      expect(input(container).value).toBe("#7F007F");

      props.channel = "hue";
      props.colorSpace = "hsl";
      props.fieldKey = "hue";
      await nextTick();
      await nextTick();

      expect(input(container).value).toBe("300°");

      unmount();
    });
  });

  describe("the state attributes", () => {
    it("reports disabled on the field, the group and the control", () => {
      const { container, unmount } = renderField({ isDisabled: true });

      expect(slot(container, "color-field")).toHaveAttribute("data-disabled", "true");
      expect(slot(container, "color-input-group")).toHaveAttribute("data-disabled", "true");
      expect(input(container)).toBeDisabled();

      unmount();
    });

    it("reports read-only on the field and the control", () => {
      const { container, unmount } = renderField({ isReadOnly: true });

      expect(slot(container, "color-field")).toHaveAttribute("data-readonly", "true");
      expect(input(container)).toHaveAttribute("readonly");

      unmount();
    });

    it("reports required on the field, where the stylesheet draws the asterisk", () => {
      const { container, unmount } = renderField({ isRequired: true });

      expect(slot(container, "color-field")).toHaveAttribute("data-required", "true");
      expect(input(container)).toBeRequired();

      unmount();
    });

    it("reports invalid on the field, the group and the control", () => {
      const { container, unmount } = renderField({ isInvalid: true, withFieldError: true });

      expect(slot(container, "color-field")).toHaveAttribute("data-invalid", "true");
      expect(slot(container, "color-input-group")).toHaveAttribute("data-invalid", "true");
      expect(input(container)).toHaveAttribute("aria-invalid", "true");

      unmount();
    });

    it("ignores isInvalid on a channel field, exactly as React does", () => {
      // A channel field's validation state is the number field's, and React builds that without
      // isInvalid or validate. Mirrored rather than fixed, so the DOM stays identical — a
      // data-invalid here would style a field React leaves alone.
      const { container, unmount } = renderField({
        channel: "red",
        colorSpace: "rgb",
        defaultValue: "#3B82F6",
        isInvalid: true,
        withFieldError: true,
      });

      expect(slot(container, "color-field")).not.toHaveAttribute("data-invalid");
      expect(input(container)).not.toHaveAttribute("aria-invalid");

      unmount();
    });
  });

  describe("editing", () => {
    it("reports a committed colour", () => {
      const onChange = vi.fn();
      const { container, unmount } = renderField({ defaultValue: "#0485F7", onChange });

      type(input(container), "abc");
      input(container).dispatchEvent(new FocusEvent("blur"));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0]![0].toString("hex")).toBe("#AABBCC");

      unmount();
    });

    it("keeps a rejected character out of the control", async () => {
      const { container, unmount } = renderField({ defaultValue: "#0485F7" });

      type(input(container), "#zz");
      await nextTick();

      expect(input(container).value).toBe("#0485F7");

      unmount();
    });

    it("steps the colour on the arrow keys", async () => {
      const { container, unmount } = renderField({ defaultValue: "#0000FF" });

      key(input(container), "ArrowUp");
      await nextTick();

      expect(input(container).value).toBe("#000100");

      unmount();
    });

    it("edits one channel of the colour on the channel branch", () => {
      const onChange = vi.fn();
      const { container, unmount } = renderField({
        channel: "red",
        colorSpace: "rgb",
        defaultValue: "#3B82F6",
        onChange,
      });

      type(input(container), "255");
      input(container).dispatchEvent(new FocusEvent("blur"));

      expect(onChange.mock.calls[0]![0].toString("hex")).toBe("#FF82F6");

      unmount();
    });

    it("follows a controlled colour", async () => {
      const props = reactive<{ value: string }>({ value: "#0485F7" });
      const { container, unmount } = renderField(props);

      props.value = "#FFCC00";
      await nextTick();

      expect(input(container).value).toBe("#FFCC00");

      unmount();
    });
  });

  describe("what it submits", () => {
    it("submits the hex text from the visible control", () => {
      // No hidden input on this branch: the text the user sees *is* the value.
      const { container, unmount } = renderField({ defaultValue: "#0485F7", name: "brand" });

      expect(input(container)).toHaveAttribute("name", "brand");
      expect(container.querySelector("input[type='hidden']")).toBeNull();

      unmount();
    });

    it("submits a channel value from a hidden input", () => {
      // The visible control carries formatted text — a degree sign is not something a server
      // wants to parse — so the number goes out separately.
      const { container, unmount } = renderField({
        channel: "hue",
        colorSpace: "hsl",
        defaultValue: "#7F007F",
        name: "hue",
      });

      const hidden = container.querySelector<HTMLInputElement>("input[type='hidden']")!;

      expect(input(container)).not.toHaveAttribute("name");
      expect(hidden).toHaveAttribute("name", "hue");
      expect(hidden.value).toBe("300");

      unmount();
    });

    it("submits a percent channel as the parsed fraction", () => {
      // 100% parses to 1, which is what React submits too.
      const { container, unmount } = renderField({
        channel: "saturation",
        colorSpace: "hsl",
        defaultValue: "#7F007F",
        name: "saturation",
      });

      expect(container.querySelector<HTMLInputElement>("input[type='hidden']")!.value).toBe("1");

      unmount();
    });

    it("submits nothing from an empty channel field", () => {
      const { container, unmount } = renderField({
        channel: "red",
        colorSpace: "rgb",
        name: "red",
        value: null,
      });

      expect(container.querySelector<HTMLInputElement>("input[type='hidden']")!.value).toBe("");

      unmount();
    });

    it("renders no hidden input without a name to submit under", () => {
      const { container, unmount } = renderField({
        channel: "red",
        colorSpace: "rgb",
        defaultValue: "#3B82F6",
      });

      expect(container.querySelector("input[type='hidden']")).toBeNull();

      unmount();
    });

    it("points a hidden input at a form it is not nested in", () => {
      const { container, unmount } = renderField({
        channel: "red",
        colorSpace: "rgb",
        defaultValue: "#3B82F6",
        form: "the-form",
        name: "red",
      });

      expect(container.querySelector("input[type='hidden']")).toHaveAttribute("form", "the-form");

      unmount();
    });
  });

  describe("a form reset", () => {
    it("puts the hex field back to its default", async () => {
      const { container, unmount } = renderField({
        defaultValue: "#0485F7",
        name: "color",
        withForm: true,
      });

      await nextTick();
      type(input(container), "#000000");
      input(container).dispatchEvent(new FocusEvent("blur"));
      await nextTick();

      expect(input(container).value).toBe("#000000");

      container.querySelector<HTMLFormElement>("form")!.reset();
      await nextTick();
      await nextTick();

      expect(input(container).value).toBe("#0485F7");

      unmount();
    });

    it("puts a channel field back to its default", async () => {
      const { container, unmount } = renderField({
        channel: "red",
        colorSpace: "rgb",
        defaultValue: "#3B82F6",
        name: "red",
        withForm: true,
      });

      await nextTick();
      type(input(container), "255");
      input(container).dispatchEvent(new FocusEvent("blur"));
      await nextTick();

      expect(input(container).value).toBe("255");

      container.querySelector<HTMLFormElement>("form")!.reset();
      await nextTick();
      await nextTick();

      expect(input(container).value).toBe("59");

      unmount();
    });
  });

  describe("the props it declares", () => {
    it("declares fullWidth as a Boolean prop, so a bare attribute means true", () => {
      // Vue only casts a valueless attribute for a prop it can see is Boolean, and an indexed
      // access into an imported variants type is not something the compiler resolves. Written the
      // other way `<ColorField full-width>` arrives as `""`, no variant matches, and the modifier
      // silently never applies — which neither suite can catch, because both pass a real boolean.
      const props = (ColorField as unknown as { props: Record<string, { type: unknown }> }).props;

      expect(props["fullWidth"]?.type).toBe(Boolean);
    });
  });
});
