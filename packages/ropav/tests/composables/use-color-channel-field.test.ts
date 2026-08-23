import type { UseColorChannelFieldReturn } from "@/composables/use-color-channel-field";

import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import Host from "../fixtures/color-channel-field-host.vue";

const mount = (props: Record<string, unknown> = {}) => {
  let field!: UseColorChannelFieldReturn;

  Object.assign(props, { onReady: (next: UseColorChannelFieldReturn) => (field = next) });

  const result = renderVapor(Host, { props });

  const at = (testId: string) =>
    result.container.querySelector<HTMLElement>(`[data-testid='${testId}']`)!;

  return {
    ...result,
    field: () => field,
    input: () => at("input") as HTMLInputElement,
  };
};

const type = (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event("input"));
};

const press = (element: Element, key: string) => {
  element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }));
};

describe("useColorChannelField", () => {
  describe("the control it renders", () => {
    it("renders the channel's value as formatted text", () => {
      const { input, unmount } = mount({
        channel: "hue",
        colorSpace: "hsl",
        defaultValue: "#7F007F",
      });

      expect(input().type).toBe("text");
      expect(input().value).toBe("300°");

      unmount();
    });

    it("describes itself as a number field", () => {
      const { input, unmount } = mount({ channel: "red", defaultValue: "#3B82F6" });

      expect(input()).toHaveAttribute("aria-roledescription", "Number field");
      expect(input()).toHaveAttribute("inputmode", "numeric");

      unmount();
    });

    it("carries no name of its own", () => {
      // The visible input holds formatted text, which is not what a server wants to parse. The
      // component renders a hidden input for the value instead.
      const { input, unmount } = mount({ channel: "red", defaultValue: "#3B82F6" });

      expect(input()).not.toHaveAttribute("name");

      unmount();
    });
  });

  describe("the name it announces", () => {
    it("falls back to the channel's own name", () => {
      const { input, unmount } = mount({ channel: "alpha", defaultValue: "#3B82F680" });

      expect(input()).toHaveAttribute("aria-label", "Alpha");

      unmount();
    });

    it("names each channel of a colour space", () => {
      const { input: hue, unmount: unmountHue } = mount({
        channel: "hue",
        colorSpace: "hsl",
        defaultValue: "#7F007F",
      });

      expect(hue()).toHaveAttribute("aria-label", "Hue");
      unmountHue();

      const { input: sat, unmount: unmountSat } = mount({
        channel: "saturation",
        colorSpace: "hsl",
        defaultValue: "#7F007F",
      });

      expect(sat()).toHaveAttribute("aria-label", "Saturation");
      unmountSat();
    });

    it("steps aside for a name the caller gave", () => {
      const { input, unmount } = mount({
        ariaLabel: "Red channel",
        channel: "red",
        defaultValue: "#3B82F6",
      });

      expect(input()).toHaveAttribute("aria-label", "Red channel");

      unmount();
    });
  });

  describe("editing", () => {
    it("turns typed text into a colour on blur", () => {
      const onChange = vi.fn();
      const { input, unmount } = mount({ channel: "red", defaultValue: "#3B82F6", onChange });

      type(input(), "255");
      input().dispatchEvent(new FocusEvent("blur"));

      expect(onChange.mock.calls[0]![0].toString("hex")).toBe("#FF82F6");

      unmount();
    });

    it("steps the channel on the arrow keys", () => {
      const { field, input, unmount } = mount({ channel: "red", defaultValue: "#3B82F6" });

      press(input(), "ArrowUp");

      expect(field().state.colorValue.value.getChannelValue("red")).toBe(60);

      unmount();
    });

    it("refuses a character that could never be part of a number", async () => {
      const { input, unmount } = mount({ channel: "red", defaultValue: "#3B82F6" });

      type(input(), "abc");
      await nextTick();

      expect(input().value).toBe("59");

      unmount();
    });

    it("writes a percent channel back out with its sign", async () => {
      const { input, unmount } = mount({
        channel: "saturation",
        colorSpace: "hsl",
        defaultValue: "#7F007F",
      });

      type(input(), "50");
      input().dispatchEvent(new FocusEvent("blur"));
      await nextTick();

      expect(input().value).toBe("50%");

      unmount();
    });
  });

  describe("validation", () => {
    it("writes an empty title so the browser shows no tooltip of its own", async () => {
      // Reached through `useTextField` in React, and the reason the attribute is there at all:
      // Firefox otherwise pops its own validation bubble over the field.
      const { input, unmount } = mount({ channel: "red", defaultValue: "#3B82F6" });

      await nextTick();

      expect(input()).toHaveAttribute("title", "");

      unmount();
    });

    it("uses the required attribute under native behaviour and the aria one otherwise", () => {
      const { input, unmount } = mount({
        channel: "red",
        defaultValue: "#3B82F6",
        isRequired: true,
      });

      expect(input()).toBeRequired();
      unmount();

      const { input: aria, unmount: unmountAria } = mount({
        channel: "red",
        defaultValue: "#3B82F6",
        isRequired: true,
        validationBehavior: "aria",
      });

      expect(aria()).not.toHaveAttribute("required");
      expect(aria()).toHaveAttribute("aria-required", "true");
      unmountAria();
    });
  });

  describe("a form reset", () => {
    it("puts the input itself back when the text never moved", async () => {
      // Same failure mode as every other field here: a real reset restores a control from its
      // `value` *attribute*, which a Vapor binding never writes.
      const { input, unmount } = mount({
        channel: "red",
        defaultValue: "#3B82F6",
        withForm: true,
      });

      await nextTick();

      expect(input().value).toBe("59");

      input().form!.reset();
      await nextTick();
      await nextTick();

      expect(input().value).toBe("59");

      unmount();
    });
  });
});
