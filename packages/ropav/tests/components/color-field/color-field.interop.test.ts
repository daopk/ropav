import { renderInterop } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { h, nextTick } from "vue";

import { ColorField } from "@/components/color-field";
import {
  ColorInputGroupInput,
  ColorInputGroupPrefix,
  ColorInputGroup,
} from "@/components/color-input-group";
import { Description } from "@/components/description";
import { Label } from "@/components/label";

/**
 * The field mounted the way a consumer mounts it: from a VDOM host, with the parts written in the
 * host and forwarded through the root's slot.
 *
 * The Vapor suite cannot fail on this. Content written in Vapor resolves `inject` against the
 * component that renders it, so a `provide` made anywhere above is found; content written in a
 * VDOM host resolves against the *host*. Everything the control needs — the attributes, the
 * handlers, the element registration, the field ids — arrives through `provide`, so the path every
 * real application uses has to be checked on its own.
 */
const render = (props: Record<string, unknown> = {}) => {
  const result = renderInterop(ColorField, {
    props,
    slots: {
      default: () => [
        h(Label, null, { default: () => "Color" }),
        h(ColorInputGroup, null, {
          default: () => [
            h(ColorInputGroupPrefix, null, { default: () => "P" }),
            h(ColorInputGroupInput),
          ],
        }),
        h(Description, null, { default: () => "Pick one" }),
      ],
    },
  });

  // Scoped to this mount rather than to the document: a failed assertion skips `unmount`, and a
  // document-wide query would then read the previous test's leftovers.
  return {
    ...result,
    find: (slot: string) => result.container.querySelector<HTMLElement>(`[data-slot='${slot}']`),
    input: () =>
      result.container.querySelector<HTMLInputElement>("[data-slot='color-input-group-input']")!,
  };
};

describe("ColorField (interop)", () => {
  it("reaches parts written in a VDOM host", () => {
    const { find, unmount } = render({ defaultValue: "#0485F7" });

    expect(find("color-field")).not.toBeNull();
    expect(find("color-input-group")).not.toBeNull();
    expect(find("color-input-group-prefix")?.textContent).toBe("P");
    unmount();
  });

  it("hands the group's styling to a control written in the host", () => {
    const { input, unmount } = render({ defaultValue: "#0485F7" });

    expect(input()).toHaveClass("color-input-group__input");
    unmount();
  });

  it("hands the field's value and wiring to that control", () => {
    const { find, input, unmount } = render({ defaultValue: "#0485F7" });

    expect(input().value).toBe("#0485F7");
    expect(input()).toHaveAttribute("role", "textbox");
    expect(input()).toHaveAttribute("aria-labelledby", find("label")!.id);
    unmount();
  });

  it("keeps the control's listeners attached through the host", () => {
    // The listeners are the half a `provide` cannot carry by itself: they are wired with `@event`
    // on the part, so a part written in the host has to still find the field to wire them to.
    const onChange = vi.fn();
    const { input, unmount } = render({ defaultValue: "#0485F7", onChange });

    input().value = "abc";
    input().dispatchEvent(new Event("input", { bubbles: true }));
    input().dispatchEvent(new FocusEvent("blur"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]![0].toString("hex")).toBe("#AABBCC");
    unmount();
  });

  it("registers the element the field's own wiring hangs off", async () => {
    // `title=""` only appears once `useFormValidation` has an element to work on, so it is proof
    // that the registration made it back across the host boundary.
    const { input, unmount } = render({ defaultValue: "#0485F7" });

    await nextTick();

    expect(input()).toHaveAttribute("title", "");
    unmount();
  });

  it("carries the description a host wrote into the field's own describedby", async () => {
    const { find, input, unmount } = render({ defaultValue: "#0485F7" });

    await nextTick();

    expect(input()).toHaveAttribute("aria-describedby", find("description")!.id);
    unmount();
  });

  it("does the same on the channel branch", () => {
    const { find, input, unmount } = render({
      channel: "hue",
      colorSpace: "hsl",
      defaultValue: "#7F007F",
    });

    expect(find("color-field")).toHaveAttribute("data-channel", "hue");
    expect(input().value).toBe("300°");
    expect(input()).toHaveAttribute("aria-labelledby", find("label")!.id);
    unmount();
  });
});
