import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import { ProgressBarFill, ProgressBarOutput, ProgressBarTrack } from "@/components/progress-bar";

import Fixture from "./fixtures.vue";

const part = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`);

describe("ProgressBar", () => {
  it("exposes progress semantics and the default percentage", async () => {
    const { container, unmount } = renderVapor(Fixture, { props: { value: 60 } });
    const root = part(container, "progress-bar");
    const label = part(container, "label");

    await nextTick();

    expect(root).toHaveAttribute("role", "progressbar");
    expect(root).toHaveAttribute("aria-valuemin", "0");
    expect(root).toHaveAttribute("aria-valuemax", "100");
    expect(root).toHaveAttribute("aria-valuenow", "60");
    expect(root).toHaveAttribute("aria-valuetext", "60%");
    expect(label?.tagName).toBe("SPAN");
    expect(root).toHaveAttribute("aria-labelledby", label?.id);
    expect(part(container, "progress-bar-output")).toHaveTextContent("60%");
    expect(part(container, "progress-bar-fill")?.style.width).toBe("60%");

    unmount();
  });

  it("removes determinate aria and width in indeterminate mode", () => {
    const { container, unmount } = renderVapor(Fixture, {
      props: { isIndeterminate: true, value: 60 },
    });
    const root = part(container, "progress-bar");

    expect(root).not.toHaveAttribute("aria-valuenow");
    expect(root).not.toHaveAttribute("aria-valuetext");
    expect(root).toHaveAttribute("aria-valuemin", "0");
    expect(root).toHaveAttribute("aria-valuemax", "100");
    expect(part(container, "progress-bar-output")?.textContent).toBe("");
    expect(part(container, "progress-bar-fill")?.style.width).toBe("");
    expect(container.querySelector("[data-testid='slot-indeterminate']")).toHaveTextContent("true");
    expect(container.querySelector("[data-testid='slot-percentage']")?.textContent).toBe("");

    unmount();
  });

  it("clamps custom ranges and formats a raw currency value", () => {
    const formatOptions = { currency: "USD", style: "currency" } as const;
    const { container, unmount } = renderVapor(Fixture, {
      props: { formatOptions, maxValue: 1000, minValue: 500, value: 2000 },
    });
    const expected = new Intl.NumberFormat("en-US", formatOptions).format(1000);

    expect(part(container, "progress-bar")).toHaveAttribute("aria-valuenow", "1000");
    expect(part(container, "progress-bar")).toHaveAttribute("aria-valuetext", expected);
    expect(part(container, "progress-bar-fill")?.style.width).toBe("100%");

    unmount();
  });

  it("supports explicit and custom visible value labels", () => {
    const { container, unmount } = renderVapor(Fixture, {
      props: { customOutput: true, value: 4, valueLabel: "4 of 10" },
    });

    expect(part(container, "progress-bar")).toHaveAttribute("aria-valuetext", "4 of 10");
    expect(part(container, "progress-bar-output")).toHaveTextContent("Custom");

    unmount();
  });

  it("combines an explicit aria-label with the visible label", async () => {
    const { container, unmount } = renderVapor(Fixture, {
      props: { ariaLabel: "Transfer status", value: 40 },
    });
    const root = part(container, "progress-bar")!;
    const label = part(container, "label")!;

    await nextTick();

    expect(root).toHaveAttribute("aria-labelledby", `${root.id} ${label.id}`);

    unmount();
  });

  it("combines a visible label with external aria-labelledby ids", async () => {
    const { container, unmount } = renderVapor(Fixture, {
      props: { ariaLabelledby: "ext", value: 40 },
    });
    const root = part(container, "progress-bar")!;
    const label = part(container, "label")!;

    await nextTick();

    expect(root).toHaveAttribute("aria-labelledby", `${label.id} ext`);
    expect(root).toHaveAccessibleName("Loading External");

    unmount();
  });

  it.each(["default", "accent", "success", "warning", "danger"] as const)(
    "applies the %s color modifier",
    (color) => {
      const { container, unmount } = renderVapor(Fixture, { props: { color } });

      expect(part(container, "progress-bar")).toHaveClass(`progress-bar--${color}`);

      unmount();
    },
  );

  it.each(["sm", "md", "lg"] as const)("applies the %s size modifier", (size) => {
    const { container, unmount } = renderVapor(Fixture, { props: { size } });

    expect(part(container, "progress-bar")).toHaveClass(`progress-bar--${size}`);

    unmount();
  });

  it.each([
    ["isAnimated", "progress-bar--animated"],
    ["isStriped", "progress-bar--striped"],
  ] as const)("applies the %s modifier", (prop, expected) => {
    const { container, unmount } = renderVapor(Fixture, { props: { [prop]: true } });

    expect(part(container, "progress-bar")).toHaveClass(expected);

    unmount();
  });

  it("leaves a bar nobody asked to band unbanded", () => {
    const { container, unmount } = renderVapor(Fixture, { props: { value: 60 } });

    expect(part(container, "progress-bar")?.className).not.toMatch(
      /progress-bar--(animated|striped)/,
    );

    unmount();
  });

  it("merges caller classes onto every public part", () => {
    const { container, unmount } = renderVapor(Fixture, {
      props: {
        class: "gap-2",
        fillClass: "rounded-none",
        outputClass: "font-bold",
        trackClass: "h-4",
      },
    });

    expect(part(container, "progress-bar")).toHaveClass("progress-bar", "gap-2");
    expect(part(container, "progress-bar-output")).toHaveClass("progress-bar__output", "font-bold");
    expect(part(container, "progress-bar-track")).toHaveClass("progress-bar__track", "h-4");
    expect(part(container, "progress-bar-fill")).toHaveClass("progress-bar__fill", "rounded-none");

    unmount();
  });

  it("reacts when progress becomes indeterminate", async () => {
    const props = reactive({ isIndeterminate: false, value: 25 });
    const { container, unmount } = renderVapor(Fixture, { props });

    expect(part(container, "progress-bar-fill")?.style.width).toBe("25%");

    props.isIndeterminate = true;
    await nextTick();

    expect(part(container, "progress-bar")).not.toHaveAttribute("aria-valuenow");
    expect(part(container, "progress-bar-fill")?.style.width).toBe("");

    unmount();
  });

  it.each([ProgressBarOutput, ProgressBarTrack, ProgressBarFill])(
    "rejects a compound part rendered outside the root",
    (component) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      expect(() => renderVapor(component)).toThrow(/`ProgressBarContext` was consumed outside/);

      warn.mockRestore();
    },
  );
});
