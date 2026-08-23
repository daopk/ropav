import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import { MeterFill, MeterOutput, MeterTrack } from "@/components/meter";

import Fixture from "./fixtures.vue";

const part = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`);

describe("Meter", () => {
  it("exposes meter semantics and the default percentage", async () => {
    const { container, unmount } = renderVapor(Fixture, { props: { value: 60 } });
    const root = part(container, "meter");
    const label = part(container, "label");

    await nextTick();

    expect(root).toHaveAttribute("role", "meter progressbar");
    expect(root).toHaveAttribute("aria-valuemin", "0");
    expect(root).toHaveAttribute("aria-valuemax", "100");
    expect(root).toHaveAttribute("aria-valuenow", "60");
    expect(root).toHaveAttribute("aria-valuetext", "60%");
    expect(label?.tagName).toBe("SPAN");
    expect(label).toHaveAttribute("id");
    expect(root).toHaveAttribute("aria-labelledby", label?.id);
    expect(part(container, "meter-output")).toHaveTextContent("60%");
    expect(part(container, "meter-fill")?.style.width).toBe("60%");

    unmount();
  });

  it("clamps values before exposing and measuring them", () => {
    const { container, unmount } = renderVapor(Fixture, {
      props: { maxValue: 80, minValue: 20, value: 100 },
    });

    expect(part(container, "meter")).toHaveAttribute("aria-valuenow", "80");
    expect(part(container, "meter")).toHaveAttribute("aria-valuetext", "100%");
    expect(part(container, "meter-fill")?.style.width).toBe("100%");

    unmount();
  });

  it("formats custom ranges as raw values when a non-percent format is provided", () => {
    const formatOptions = { currency: "USD", style: "currency" } as const;
    const { container, unmount } = renderVapor(Fixture, {
      props: { formatOptions, maxValue: 1000, value: 750 },
    });
    const expected = new Intl.NumberFormat("en-US", formatOptions).format(750);

    expect(part(container, "meter")).toHaveAttribute("aria-valuetext", expected);
    expect(part(container, "meter-output")).toHaveTextContent(expected);
    expect(part(container, "meter-fill")?.style.width).toBe("75%");

    unmount();
  });

  it("uses an explicit value label in aria and output", () => {
    const { container, unmount } = renderVapor(Fixture, {
      props: { value: 4, valueLabel: "4 of 10" },
    });

    expect(part(container, "meter")).toHaveAttribute("aria-valuetext", "4 of 10");
    expect(part(container, "meter-output")).toHaveTextContent("4 of 10");

    unmount();
  });

  it("lets caller output replace the formatted fallback", () => {
    const { container, unmount } = renderVapor(Fixture, {
      props: { customOutput: true, value: 60 },
    });

    expect(part(container, "meter-output")).toHaveTextContent("Custom");
    expect(part(container, "meter-output")).not.toHaveTextContent("60%");

    unmount();
  });

  it("combines an explicit aria-label with the visible label", async () => {
    const { container, unmount } = renderVapor(Fixture, {
      props: { ariaLabel: "Storage usage", value: 45 },
    });
    const root = part(container, "meter")!;
    const label = part(container, "label")!;

    await nextTick();

    expect(root).toHaveAttribute("aria-label", "Storage usage");
    expect(label).toHaveAttribute("id");
    expect(root).toHaveAttribute("aria-labelledby", `${root.id} ${label.id}`);

    unmount();
  });

  it("combines a visible label with external aria-labelledby ids", async () => {
    const { container, unmount } = renderVapor(Fixture, {
      props: { ariaLabelledby: "ext", value: 45 },
    });
    const root = part(container, "meter")!;
    const label = part(container, "label")!;

    await nextTick();

    expect(root).toHaveAttribute("aria-labelledby", `${label.id} ext`);
    expect(root).toHaveAccessibleName("Storage External");

    unmount();
  });

  it("combines aria-label and aria-labelledby without a visible label", () => {
    const { container, unmount } = renderVapor(Fixture, {
      props: { ariaLabel: "Storage usage", ariaLabelledby: "ext", value: 45, withLabel: false },
    });
    const root = part(container, "meter")!;

    expect(part(container, "label")).toBeNull();
    expect(root).toHaveAttribute("aria-labelledby", `${root.id} ext`);

    unmount();
  });

  it("updates label composition when aria-label changes", async () => {
    const props = reactive({ ariaLabel: undefined as string | undefined, value: 45 });
    const { container, unmount } = renderVapor(Fixture, { props });
    const root = part(container, "meter")!;
    const label = part(container, "label")!;

    await nextTick();
    expect(root).toHaveAttribute("aria-labelledby", label.id);

    props.ariaLabel = "Storage usage";
    await nextTick();

    expect(root).toHaveAttribute("aria-label", "Storage usage");
    expect(root).toHaveAttribute("aria-labelledby", `${root.id} ${label.id}`);

    unmount();
  });

  it.each(["default", "accent", "success", "warning", "danger"] as const)(
    "applies the %s color modifier",
    (color) => {
      const { container, unmount } = renderVapor(Fixture, { props: { color } });

      expect(part(container, "meter")).toHaveClass(`meter--${color}`);

      unmount();
    },
  );

  it.each(["sm", "md", "lg"] as const)("applies the %s size modifier", (size) => {
    const { container, unmount } = renderVapor(Fixture, { props: { size } });

    expect(part(container, "meter")).toHaveClass(`meter--${size}`);

    unmount();
  });

  it("merges caller classes and keeps computed width after caller style", () => {
    const { container, unmount } = renderVapor(Fixture, {
      props: {
        class: "gap-2",
        fillClass: "rounded-none",
        outputClass: "font-bold",
        trackClass: "h-4",
        value: 60,
      },
    });

    expect(part(container, "meter")).toHaveClass("meter", "gap-2");
    expect(part(container, "meter-output")).toHaveClass("meter__output", "font-bold");
    expect(part(container, "meter-track")).toHaveClass("meter__track", "h-4");
    expect(part(container, "meter-fill")).toHaveClass("meter__fill", "rounded-none");
    expect(part(container, "meter-fill")?.style.backgroundColor).toBe("red");
    expect(part(container, "meter-fill")?.style.width).toBe("60%");

    unmount();
  });

  it("publishes reactive scoped-slot state", async () => {
    const props = reactive({ value: 25 });
    const { container, unmount } = renderVapor(Fixture, { props });

    expect(container.querySelector("[data-testid='slot-percentage']")).toHaveTextContent("25");
    expect(container.querySelector("[data-testid='slot-value-text']")).toHaveTextContent("25%");

    props.value = 75;
    await nextTick();

    expect(container.querySelector("[data-testid='slot-percentage']")).toHaveTextContent("75");
    expect(part(container, "meter-fill")?.style.width).toBe("75%");

    unmount();
  });

  it.each([MeterOutput, MeterTrack, MeterFill])(
    "rejects a compound part rendered outside the root",
    (component) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      expect(() => renderVapor(component)).toThrow(/`MeterContext` was consumed outside/);

      warn.mockRestore();
    },
  );
});
