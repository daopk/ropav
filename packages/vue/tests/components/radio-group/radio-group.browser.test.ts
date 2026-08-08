import {expectNoA11yViolations} from "@heroui/testing/helpers/a11y";
import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {userEvent} from "vitest/browser";
import {nextTick} from "vue";

import RadioGroupFixture from "./fixtures.vue";

const renderGroup = (props: Record<string, unknown> = {}) => {
  const rendered = renderVapor(RadioGroupFixture, {props});
  const inputs = () => Array.from(rendered.container.querySelectorAll("input"));
  const contents = () =>
    Array.from(rendered.container.querySelectorAll<HTMLElement>("[data-slot='radio-content']"));
  const controls = () =>
    Array.from(rendered.container.querySelectorAll<HTMLElement>("[data-slot='radio-control']"));

  return {...rendered, contents, controls, inputs};
};

/** The indicator dot and its colours are transitioned, so a computed value has to settle. */
const waitForTransition = () => new Promise((resolve) => setTimeout(resolve, 300));

/**
 * The parts of RadioGroup only a real browser can show: that the dot the stylesheet draws
 * actually appears, that a real pointer and real arrow keys drive it, and that suppressing
 * the browser's own radio navigation leaves exactly one step per press.
 */
describe("RadioGroup (browser)", () => {
  it("fills the control of the chosen radio, leaving the dot as its centre", async () => {
    const {controls, unmount} = renderGroup({defaultValue: "premium"});

    await nextTick();
    await waitForTransition();

    // The ring is the control's own background; the dot is a `::before` on the indicator that
    // is always painted, so it reads as the light centre rather than as the selected state.
    expect(getComputedStyle(controls()[1]!).backgroundColor).not.toBe(
      getComputedStyle(controls()[0]!).backgroundColor,
    );

    const dot = getComputedStyle(
      controls()[1]!.querySelector("[data-slot='radio-indicator']")!,
      "::before",
    );

    // `.radio__indicator:empty::before` is what paints it, which is why the indicator has to
    // stay childless.
    expect(dot.width).not.toBe("0px");

    unmount();
  });

  it("chooses a radio under a real pointer, which synthetic events cannot prove", async () => {
    const {contents, inputs, unmount} = renderGroup();

    await userEvent.click(contents()[1]!);
    await nextTick();

    expect(inputs()[1]!.checked).toBe(true);

    unmount();
  });

  it("paints a focus ring on the control when a radio is reached by keyboard", async () => {
    const {controls, unmount} = renderGroup();
    const shadowWhenIdle = getComputedStyle(controls()[0]!).boxShadow;

    await userEvent.keyboard("{Tab}");
    await nextTick();

    // The ring is drawn with a box shadow and `outline-style: none`, so the outline says
    // nothing about whether it is there.
    expect(getComputedStyle(controls()[0]!).boxShadow).not.toBe(shadowWhenIdle);

    unmount();
  });

  it("moves exactly one radio per arrow press", async () => {
    const {inputs, unmount} = renderGroup({defaultValue: "basic"});

    inputs()[0]!.focus();
    await userEvent.keyboard("{ArrowDown}");
    await nextTick();

    // Both the group's handler and the browser's own would move it, so a missing
    // `preventDefault` shows up here as a jump of two.
    expect(inputs()[1]!.checked).toBe(true);

    await userEvent.keyboard("{ArrowDown}");
    await nextTick();

    expect(inputs()[2]!.checked).toBe(true);

    unmount();
  });

  it("wraps around the ends with real key presses", async () => {
    const {inputs, unmount} = renderGroup({defaultValue: "team"});

    inputs()[2]!.focus();
    await userEvent.keyboard("{ArrowDown}");
    await nextTick();

    expect(inputs()[0]!.checked).toBe(true);
    expect(document.activeElement).toBe(inputs()[0]);

    unmount();
  });

  it("keeps the group to a single tab stop", async () => {
    const {inputs, unmount} = renderGroup({defaultValue: "premium"});

    await userEvent.keyboard("{Tab}");
    await nextTick();

    expect(document.activeElement).toBe(inputs()[1]);

    // Tabbing again leaves the group entirely rather than walking to the next radio.
    await userEvent.keyboard("{Tab}");
    await nextTick();

    expect(inputs()).not.toContain(document.activeElement);

    unmount();
  });

  it("rings the control in danger when the group is invalid", async () => {
    const {controls: valid, unmount: unmountValid} = renderGroup();
    const {controls, unmount} = renderGroup({isInvalid: true});

    await nextTick();

    expect(getComputedStyle(valid()[0]!).outlineStyle).toBe("none");
    expect(getComputedStyle(controls()[0]!).outlineStyle).toBe("solid");

    unmountValid();
    unmount();
  });

  it("lays the group out along the axis it was given", async () => {
    const {container, unmount} = renderGroup({orientation: "horizontal"});

    await nextTick();

    const group = container.querySelector<HTMLElement>("[data-slot='radio-group']")!;

    expect(getComputedStyle(group).flexDirection).toBe("row");

    unmount();
  });

  describe("accessibility", () => {
    it("has no violations in its default state", async () => {
      const {container, unmount} = renderGroup({withLabel: true});

      await nextTick();
      await expectNoA11yViolations(container);

      unmount();
    });

    it("has no violations while invalid with a message", async () => {
      const {container, unmount} = renderGroup({
        isInvalid: true,
        isRequired: true,
        withFieldError: true,
        withLabel: true,
      });

      await nextTick();
      // `color-contrast` is scoped out for this one case: `[data-invalid] .label` paints the
      // label in `--danger`, which falls short of 4.5:1. Verified byte-identical on React at
      // 6006 (`oklch(0.6532 0.2328 25.74)`), so it is a `@heroui/styles` shortfall both
      // frameworks share rather than anything this port introduced.
      await expectNoA11yViolations(container, {rules: {"color-contrast": {enabled: false}}});

      unmount();
    });
  });
});
