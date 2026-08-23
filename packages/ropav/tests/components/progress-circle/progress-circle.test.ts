import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import {
  ProgressCircleFillCircle,
  ProgressCircleTrack,
  ProgressCircleTrackCircle,
} from "@/components/progress-circle";
import {
  CENTER,
  CIRCUMFERENCE,
  RADIUS,
  ROTATION,
  STROKE_WIDTH,
  VIEW_BOX,
} from "@/components/progress-circle/progress-circle.constants";

import Fixture from "./fixtures.vue";

const part = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`);

describe("ProgressCircle", () => {
  it("uses a nested visible label as its accessible name", async () => {
    const { container, unmount } = renderVapor(Fixture, { props: { value: 60, withLabel: true } });
    const root = part(container, "progress-circle");
    const label = part(container, "label");

    await nextTick();

    expect(label?.tagName).toBe("SPAN");
    expect(label).toHaveAttribute("id");
    expect(root).toHaveAttribute("aria-labelledby", label?.id);

    unmount();
  });

  it("combines an explicit aria-label with the visible label", async () => {
    const { container, unmount } = renderVapor(Fixture, {
      props: { ariaLabel: "Upload status", value: 60, withLabel: true },
    });
    const root = part(container, "progress-circle")!;
    const label = part(container, "label")!;

    await nextTick();

    expect(root).toHaveAttribute("aria-labelledby", `${root.id} ${label.id}`);

    unmount();
  });

  it("combines a visible label with external aria-labelledby ids", async () => {
    const { container, unmount } = renderVapor(Fixture, {
      props: { ariaLabelledby: "ext", value: 60, withLabel: true },
    });
    const root = part(container, "progress-circle")!;
    const label = part(container, "label")!;

    await nextTick();

    expect(root).toHaveAttribute("aria-labelledby", `${label.id} ext`);
    expect(root).toHaveAccessibleName("Loading External");

    unmount();
  });

  it("renders progress semantics and the exact SVG geometry", () => {
    const { container, unmount } = renderVapor(Fixture, {
      props: { ariaLabel: "Loading", value: 60 },
    });
    const root = part(container, "progress-circle");
    const track = part(container, "progress-circle-track");
    const trackCircle = part(container, "progress-circle-track-circle");
    const fillCircle = part(container, "progress-circle-fill-circle");

    expect(root).toHaveAttribute("role", "progressbar");
    expect(root).toHaveAttribute("aria-label", "Loading");
    expect(root).toHaveAttribute("aria-valuenow", "60");
    expect(root).toHaveAttribute("aria-valuetext", "60%");
    expect(track?.tagName).toBe("svg");
    expect(track).toHaveAttribute("viewBox", VIEW_BOX);
    expect(trackCircle?.tagName).toBe("circle");
    expect(trackCircle).toHaveAttribute("cx", String(CENTER));
    expect(trackCircle).toHaveAttribute("cy", String(CENTER));
    expect(trackCircle).toHaveAttribute("r", String(RADIUS));
    expect(trackCircle).toHaveAttribute("stroke-width", String(STROKE_WIDTH));
    expect(fillCircle).toHaveAttribute("stroke-dasharray", String(CIRCUMFERENCE));
    expect(fillCircle).toHaveAttribute("stroke-dashoffset", String(CIRCUMFERENCE * 0.4));
    expect(fillCircle).toHaveAttribute("stroke-linecap", "round");
    expect(fillCircle).toHaveAttribute("transform", ROTATION);

    unmount();
  });

  it("uses the fixed quarter-arc offset and removes value aria when indeterminate", () => {
    const { container, unmount } = renderVapor(Fixture, {
      props: { ariaLabel: "Loading", isIndeterminate: true, value: 60 },
    });

    expect(part(container, "progress-circle")).not.toHaveAttribute("aria-valuenow");
    expect(part(container, "progress-circle")).not.toHaveAttribute("aria-valuetext");
    expect(part(container, "progress-circle-fill-circle")).toHaveAttribute(
      "stroke-dashoffset",
      String(CIRCUMFERENCE * 0.75),
    );
    expect(container.querySelector("[data-testid='slot-indeterminate']")).toHaveTextContent("true");

    unmount();
  });

  it("clamps custom ranges before calculating the arc", () => {
    const { container, unmount } = renderVapor(Fixture, {
      props: { ariaLabel: "Loading", maxValue: 80, minValue: 20, value: -10 },
    });

    expect(part(container, "progress-circle")).toHaveAttribute("aria-valuenow", "20");
    expect(part(container, "progress-circle-fill-circle")).toHaveAttribute(
      "stroke-dashoffset",
      String(CIRCUMFERENCE),
    );

    unmount();
  });

  it("uses custom value formatting in aria and scoped slot state", () => {
    const formatOptions = { currency: "USD", style: "currency" } as const;
    const { container, unmount } = renderVapor(Fixture, {
      props: { ariaLabel: "Revenue", formatOptions, maxValue: 1000, value: 750 },
    });
    const expected = new Intl.NumberFormat("en-US", formatOptions).format(750);

    expect(part(container, "progress-circle")).toHaveAttribute("aria-valuetext", expected);
    expect(container.querySelector("[data-testid='slot-percentage']")).toHaveTextContent("75");
    expect(container.querySelector("[data-testid='slot-value-text']")).toHaveTextContent(expected);

    unmount();
  });

  it.each(["default", "accent", "success", "warning", "danger"] as const)(
    "applies the %s color modifier",
    (color) => {
      const { container, unmount } = renderVapor(Fixture, {
        props: { ariaLabel: "Loading", color },
      });

      expect(part(container, "progress-circle")).toHaveClass(`progress-circle--${color}`);

      unmount();
    },
  );

  it.each(["sm", "md", "lg"] as const)("applies the %s size modifier", (size) => {
    const { container, unmount } = renderVapor(Fixture, { props: { ariaLabel: "Loading", size } });

    expect(part(container, "progress-circle")).toHaveClass(`progress-circle--${size}`);

    unmount();
  });

  it("merges caller classes onto every public part", () => {
    const { container, unmount } = renderVapor(Fixture, {
      props: {
        ariaLabel: "Loading",
        class: "opacity-80",
        fillCircleClass: "stroke-2",
        trackCircleClass: "opacity-50",
        trackClass: "size-10",
      },
    });

    expect(part(container, "progress-circle")).toHaveClass("progress-circle", "opacity-80");
    expect(part(container, "progress-circle-track")).toHaveClass(
      "progress-circle__track",
      "size-10",
    );
    expect(part(container, "progress-circle-track-circle")).toHaveClass(
      "progress-circle__track-circle",
      "opacity-50",
    );
    expect(part(container, "progress-circle-fill-circle")).toHaveClass(
      "progress-circle__fill-circle",
      "stroke-2",
    );

    unmount();
  });

  it("updates the arc reactively", async () => {
    const props = reactive({ ariaLabel: "Loading", value: 25 });
    const { container, unmount } = renderVapor(Fixture, { props });

    props.value = 75;
    await nextTick();

    expect(part(container, "progress-circle-fill-circle")).toHaveAttribute(
      "stroke-dashoffset",
      String(CIRCUMFERENCE * 0.25),
    );

    unmount();
  });

  it.each([ProgressCircleTrack, ProgressCircleTrackCircle, ProgressCircleFillCircle])(
    "rejects a compound part rendered outside the root",
    (component) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      expect(() => renderVapor(component)).toThrow(/`ProgressCircleContext` was consumed outside/);

      warn.mockRestore();
    },
  );
});
