import { CalendarDate } from "@internationalized/date";
import { renderInterop } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { h, nextTick } from "vue";

import {
  DateFieldGroup,
  DateFieldInput,
  DateField,
  DateFieldSegment,
} from "@/components/date-field";
import { Label } from "@/components/label";

/**
 * The field mounted the way a consumer mounts it: from a VDOM host, with the parts written in the
 * host and forwarded through the root's slot.
 *
 * The Vapor suite cannot fail on this. Content written in Vapor resolves `inject` against the
 * component that renders it, so a `provide` made anywhere above is found; content written in a
 * VDOM host resolves against the host. Everything a segment needs — the state, the labelling, the
 * focus manager — arrives through `provide`, so the path every real application uses has to be
 * checked on its own.
 */
const render = (props: Record<string, unknown> = {}, groupProps: Record<string, unknown> = {}) => {
  const result = renderInterop(DateField, {
    props: { locale: "en-US", ...props },
    slots: {
      default: () => [
        h(Label, null, { default: () => "Date" }),
        h(DateFieldGroup, groupProps, {
          default: () =>
            h(DateFieldInput, null, {
              default: ({ segment }: { segment: unknown }) =>
                h(DateFieldSegment, { segment } as never),
            }),
        }),
      ],
    },
  });

  // Scoped to this mount rather than to the document: a failed assertion skips `unmount`, and a
  // document-wide query would then read the previous test's leftovers.
  return {
    ...result,
    find: (slot: string) => result.container.querySelector<HTMLElement>(`[data-slot='${slot}']`),
    segment: (type: string) => result.container.querySelector<HTMLElement>(`[data-type='${type}']`),
  };
};

describe("DateField (interop)", () => {
  it("reaches parts written in a VDOM host", () => {
    const { find, segment, unmount } = render({ defaultValue: new CalendarDate(2026, 6, 5) });

    expect(find("date-input-group")).not.toBeNull();
    expect(find("date-input-group-input")).not.toBeNull();
    expect(segment("month")?.textContent).toBe("6");
    expect(segment("year")?.textContent).toBe("2026");
    unmount();
  });

  it("hands the group's styling to those parts", () => {
    const { find, segment, unmount } = render({}, { variant: "secondary" });

    expect(find("date-input-group")).toHaveClass("date-input-group--secondary");
    expect(find("date-input-group-input")).toHaveClass("date-input-group__input");
    expect(segment("month")).toHaveClass("date-input-group__segment");
    unmount();
  });

  it("hands the labelling down to those parts", () => {
    const { find, segment, unmount } = render();
    const month = segment("month")!;

    expect(month).toHaveAttribute("aria-labelledby", `${month.id} ${find("label")!.id}`);
    unmount();
  });

  it("hands the state down, so a segment steps the value", async () => {
    const { segment, unmount } = render({ defaultValue: new CalendarDate(2026, 6, 5) });

    segment("day")!.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowUp" }),
    );
    await nextTick();

    expect(segment("day")?.textContent).toBe("6");
    unmount();
  });

  it("hands the focus manager down, so an arrow crosses segments", () => {
    const { segment, unmount } = render();

    segment("month")!.focus();
    segment("month")!.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowRight" }),
    );

    expect(document.activeElement).toBe(segment("day"));
    unmount();
  });
});
