import {renderInterop} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {h, nextTick} from "vue";

import {LabelRoot} from "@/components/label";
import {MeterFill, MeterOutput, MeterRoot, MeterTrack} from "@/components/meter";

const render = (output?: () => unknown) =>
  renderInterop(MeterRoot, {
    props: {color: "success", value: 60},
    slots: {
      default: () => [
        h(LabelRoot, null, {default: () => "Storage"}),
        h(MeterOutput, null, output ? {default: output} : undefined),
        h(MeterTrack, null, {default: () => h(MeterFill)}),
      ],
    },
  });

describe("Meter under a vdom host", () => {
  it("forwards value state and classes into host-authored parts", async () => {
    const {container, unmount} = render();
    const root = container.querySelector('[data-slot="meter"]');
    const label = container.querySelector('[data-slot="label"]');

    await nextTick();

    expect(root).toHaveClass("meter", "meter--success");
    expect(root).toHaveAttribute("aria-valuetext", "60%");
    expect(root).toHaveAttribute("aria-labelledby", label?.id);
    expect(container.querySelector('[data-slot="meter-output"]')).toHaveTextContent("60%");
    expect(container.querySelector<HTMLElement>('[data-slot="meter-fill"]')?.style.width).toBe(
      "60%",
    );

    unmount();
  });

  it("keeps a custom output from the host instead of the fallback", () => {
    const {container, unmount} = render(() => h("strong", null, "Nearly full"));

    expect(container.querySelector('[data-slot="meter-output"]')).toHaveTextContent("Nearly full");
    expect(container.querySelector('[data-slot="meter-output"]')).not.toHaveTextContent("60%");

    unmount();
  });
});
