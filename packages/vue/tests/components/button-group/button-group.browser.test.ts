import {expectNoA11yViolations} from "@heroui/testing/helpers/a11y";
import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {userEvent} from "vitest/browser";
import {nextTick} from "vue";

import ButtonGroupFixture from "./fixtures.vue";

const renderGroup = (props: Record<string, unknown> = {}) =>
  renderVapor(ButtonGroupFixture, {props});

const buttonsIn = (container: HTMLElement) => {
  const [first, last] = Array.from(container.querySelectorAll("button"));

  return [first!, last!] as const;
};

/**
 * The group's own styling is all edge cases the stylesheet resolves from position:
 * corner rounding per child, the press transform, and stacking while focused. None of it
 * can be read without a real layout.
 */
describe("ButtonGroup (browser)", () => {
  it("rounds only the outer edges of a horizontal group", () => {
    const {container, unmount} = renderGroup();
    const [first, last] = buttonsIn(container);

    const firstStyles = getComputedStyle(first);
    const lastStyles = getComputedStyle(last);

    expect(firstStyles.borderTopLeftRadius).not.toBe("0px");
    // The two inner edges meet, so neither of them is rounded.
    expect(firstStyles.borderTopRightRadius).toBe("0px");
    expect(lastStyles.borderTopLeftRadius).toBe("0px");
    expect(lastStyles.borderTopRightRadius).not.toBe("0px");

    unmount();
  });

  it("rounds the top and bottom edges of a vertical group", () => {
    const {container, unmount} = renderGroup({orientation: "vertical"});
    const [first, last] = buttonsIn(container);

    expect(getComputedStyle(first).borderTopLeftRadius).not.toBe("0px");
    expect(getComputedStyle(first).borderBottomLeftRadius).toBe("0px");
    expect(getComputedStyle(last).borderTopLeftRadius).toBe("0px");
    expect(getComputedStyle(last).borderBottomLeftRadius).not.toBe("0px");

    unmount();
  });

  it("drops the press transform so a grouped button does not pull away from its neighbour", async () => {
    const {container, unmount} = renderGroup();
    const [first] = buttonsIn(container);

    first.dispatchEvent(
      new PointerEvent("pointerdown", {bubbles: true, button: 0, pointerType: "mouse"}),
    );
    await nextTick();

    expect(first.getAttribute("data-pressed")).toBe("true");
    expect(getComputedStyle(first).transform).toBe("none");

    unmount();
  });

  it("raises the focused button above its neighbour", async () => {
    const {container, unmount} = renderGroup();
    const [first] = buttonsIn(container);

    expect(getComputedStyle(first).zIndex).toBe("auto");

    await userEvent.keyboard("{Tab}");
    await nextTick();

    expect(first).toHaveFocus();
    // Keyed on the same attribute as the focus ring, so the ring is not clipped by the
    // button next to it.
    expect(first.getAttribute("data-focus-visible")).toBe("true");
    expect(getComputedStyle(first).zIndex).toBe("10");

    unmount();
  });

  it("positions the separator between the buttons", () => {
    const {container, unmount} = renderGroup({withSeparator: true});
    const separator = container.querySelector<HTMLElement>('[data-slot="button-group-separator"]')!;

    const styles = getComputedStyle(separator);

    expect(styles.position).toBe("absolute");
    expect(styles.pointerEvents).toBe("none");
    expect(separator.getBoundingClientRect().width).toBeCloseTo(1, 0);

    unmount();
  });

  it("has no axe violations", async () => {
    const {container, unmount} = renderGroup({variant: "outline"});

    await expectNoA11yViolations(container);

    unmount();
  });
});
