import { renderInterop } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { h, nextTick } from "vue";

import { LabelRoot } from "@/components/label";
import {
  ProgressCircleFillCircle,
  ProgressCircleRoot,
  ProgressCircleTrack,
  ProgressCircleTrackCircle,
} from "@/components/progress-circle";
import { CIRCUMFERENCE } from "@/components/progress-circle/progress-circle.constants";

const render = (isIndeterminate = false) =>
  renderInterop(ProgressCircleRoot, {
    props: { color: "danger", isIndeterminate, value: 25 },
    slots: {
      default: () => [
        h(LabelRoot, null, { default: () => "Loading" }),
        h(ProgressCircleTrack, null, {
          default: () => [h(ProgressCircleTrackCircle), h(ProgressCircleFillCircle)],
        }),
      ],
    },
  });

describe("ProgressCircle under a vdom host", () => {
  it("forwards determinate state and classes into host-authored SVG parts", async () => {
    const { container, unmount } = render();
    const root = container.querySelector('[data-slot="progress-circle"]');
    const label = container.querySelector('[data-slot="label"]');

    await nextTick();

    expect(root).toHaveClass("progress-circle", "progress-circle--danger");
    expect(root).toHaveAttribute("aria-labelledby", label?.id);
    expect(container.querySelector('[data-slot="progress-circle-track"]')).toHaveClass(
      "progress-circle__track",
    );
    expect(container.querySelector('[data-slot="progress-circle-fill-circle"]')).toHaveAttribute(
      "stroke-dashoffset",
      String(CIRCUMFERENCE * 0.75),
    );

    unmount();
  });

  it("keeps host-authored SVG parts indeterminate", () => {
    const { container, unmount } = render(true);

    expect(container.querySelector('[data-slot="progress-circle"]')).not.toHaveAttribute(
      "aria-valuenow",
    );
    expect(container.querySelector('[data-slot="progress-circle-fill-circle"]')).toHaveAttribute(
      "stroke-dashoffset",
      String(CIRCUMFERENCE * 0.75),
    );

    unmount();
  });
});
