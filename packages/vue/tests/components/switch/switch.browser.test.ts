import {expectNoA11yViolations} from "@heroui/testing/helpers/a11y";
import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {userEvent} from "vitest/browser";
import {nextTick} from "vue";

import SwitchFixture from "./fixtures.vue";

const renderSwitch = (props: Record<string, unknown> = {}) => renderVapor(SwitchFixture, {props});

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

/**
 * The parts of Switch only a real browser can show: that the attributes it renders are the
 * ones the stylesheet selects on, and that the thumb actually travels when the switch is on.
 */
describe("Switch (browser)", () => {
  it("paints a focus ring on the control when the input is focused by keyboard", async () => {
    const {container, unmount} = renderSwitch();
    const control = slot(container, "switch-control");

    const shadowWhenIdle = getComputedStyle(control).boxShadow;

    await userEvent.keyboard("{Tab}");
    await nextTick();

    // `status-focused` draws the ring with a box shadow and pins `outline-style: none`, so
    // the outline says nothing about whether the ring is there.
    expect(getComputedStyle(control).boxShadow).not.toBe(shadowWhenIdle);
    expect(slot(container, "switch-content").getAttribute("data-focus-visible")).toBe("true");

    unmount();
  });

  it("leaves the ring off when focus follows a pointer", async () => {
    const {container, unmount} = renderSwitch();
    const control = slot(container, "switch-control");
    const shadowWhenIdle = getComputedStyle(control).boxShadow;

    await userEvent.click(slot(container, "switch-content"));
    await nextTick();

    expect(slot(container, "switch-content").hasAttribute("data-focus-visible")).toBe(false);
    expect(getComputedStyle(control).boxShadow).toBe(shadowWhenIdle);

    unmount();
  });

  it("darkens the control on hover and fills it when on", async () => {
    const {container, unmount} = renderSwitch();
    const content = slot(container, "switch-content");
    const control = slot(container, "switch-control");

    const idle = getComputedStyle(control).backgroundColor;

    await userEvent.hover(content);
    await nextTick();

    expect(content.getAttribute("data-hovered")).toBe("true");

    const hovered = getComputedStyle(control).backgroundColor;

    expect(hovered).not.toBe(idle);

    await userEvent.click(content);
    await nextTick();

    // The accent fill is what the checked branch of the stylesheet paints.
    expect(getComputedStyle(control).backgroundColor).not.toBe(hovered);

    unmount();
  });

  it("travels the thumb the full width of the control at every size", async () => {
    for (const size of ["sm", "md", "lg"] as const) {
      const off = renderSwitch({size});
      const offControl = slot(off.container, "switch-control").getBoundingClientRect();
      const offThumb = slot(off.container, "switch-thumb").getBoundingClientRect();

      off.unmount();

      const on = renderSwitch({defaultSelected: true, size});
      const onControl = slot(on.container, "switch-control").getBoundingClientRect();
      const onThumb = slot(on.container, "switch-thumb").getBoundingClientRect();

      // The thumb sits inside the control at both ends, with the same inset either side.
      expect(offThumb.left - offControl.left).toBeCloseTo(onControl.right - onThumb.right, 1);
      expect(onThumb.left).toBeGreaterThan(offThumb.left);
      expect(onThumb.right).toBeLessThanOrEqual(onControl.right);

      on.unmount();
    }
  });

  it("does not travel the thumb of a disabled switch that is off", () => {
    const off = renderSwitch({isDisabled: true});
    const offThumb = slot(off.container, "switch-thumb").getBoundingClientRect();
    const offControl = slot(off.container, "switch-control").getBoundingClientRect();

    expect(offThumb.left - offControl.left).toBeLessThan(offControl.width / 2);
    // Disabled dims the whole field rather than the thumb alone.
    expect(getComputedStyle(slot(off.container, "switch")).opacity).not.toBe("1");

    off.unmount();
  });

  it("toggles on Space and leaves the page still", async () => {
    const {container, unmount} = renderSwitch();
    const content = slot(container, "switch-content");

    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard(" ");
    await nextTick();

    expect(container.querySelector("input")!.checked).toBe(true);
    expect(slot(container, "switch").getAttribute("data-selected")).toBe("true");
    expect(content.hasAttribute("data-pressed")).toBe(false);

    unmount();
  });

  it("has no accessibility violations", async () => {
    const {container, unmount} = renderSwitch({withDescription: true});

    await nextTick();
    await expectNoA11yViolations(container);

    unmount();
  });

  it("has no accessibility violations without a visible label", async () => {
    const {container, unmount} = renderSwitch({ariaLabel: "Enable notifications"});

    await nextTick();
    await expectNoA11yViolations(container);

    unmount();
  });
});
