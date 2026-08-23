import {renderInterop} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {h, nextTick} from "vue";

import {LabelRoot} from "@/components/label";
import {
  ProgressBarFill,
  ProgressBarOutput,
  ProgressBarRoot,
  ProgressBarTrack,
} from "@/components/progress-bar";

const render = (isIndeterminate = false) =>
  renderInterop(ProgressBarRoot, {
    props: {color: "warning", isIndeterminate, value: 40},
    slots: {
      default: () => [
        h(LabelRoot, null, {default: () => "Loading"}),
        h(ProgressBarOutput),
        h(ProgressBarTrack, null, {default: () => h(ProgressBarFill)}),
      ],
    },
  });

describe("ProgressBar under a vdom host", () => {
  it("forwards determinate state and classes into host-authored parts", async () => {
    const {container, unmount} = render();
    const root = container.querySelector('[data-slot="progress-bar"]');
    const label = container.querySelector('[data-slot="label"]');

    await nextTick();

    expect(root).toHaveClass("progress-bar", "progress-bar--warning");
    expect(root).toHaveAttribute("aria-labelledby", label?.id);
    expect(root).toHaveAttribute("aria-valuetext", "40%");
    expect(container.querySelector('[data-slot="progress-bar-output"]')).toHaveTextContent("40%");
    expect(
      container.querySelector<HTMLElement>('[data-slot="progress-bar-fill"]')?.style.width,
    ).toBe("40%");

    unmount();
  });

  it("keeps host-authored parts indeterminate", () => {
    const {container, unmount} = render(true);

    expect(container.querySelector('[data-slot="progress-bar"]')).not.toHaveAttribute(
      "aria-valuenow",
    );
    expect(
      container.querySelector<HTMLElement>('[data-slot="progress-bar-fill"]')?.style.width,
    ).toBe("");

    unmount();
  });
});
