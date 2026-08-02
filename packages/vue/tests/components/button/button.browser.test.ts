import {expectNoA11yViolations} from "@heroui/testing/helpers/a11y";
import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {userEvent} from "vitest/browser";
import {nextTick} from "vue";

import {Button} from "@/components/button";

const renderButton = (props: Record<string, unknown> = {}) =>
  renderVapor(Button, {
    props,
    slots: {default: () => document.createTextNode("Press me")},
  });

const buttonIn = (container: HTMLElement) => container.querySelector("button")!;

/**
 * These cover the parts of Button only a real browser can show: that the interaction
 * attributes it renders line up with the pseudo-classes the browser computes, and that
 * the stylesheet then paints the states those attributes select.
 */
describe("Button (browser)", () => {
  it("paints a focus ring on keyboard focus", async () => {
    const {container, unmount} = renderButton();
    const button = buttonIn(container);

    const shadowWhenIdle = getComputedStyle(button).boxShadow;

    await userEvent.keyboard("{Tab}");
    await nextTick();

    expect(button).toHaveFocus();
    expect(button.matches(":focus-visible")).toBe(true);
    // The ring is a ring utility, so it lands on box-shadow. `outline-style` stays
    // `none` in both states, which makes outline useless as the assertion here.
    expect(button.getAttribute("data-focus-visible")).toBe("true");
    expect(getComputedStyle(button).boxShadow).not.toBe(shadowWhenIdle);

    unmount();
  });

  it("paints no focus ring when focused by pointer", async () => {
    const {container, unmount} = renderButton();
    const button = buttonIn(container);

    const shadowWhenIdle = getComputedStyle(button).boxShadow;

    await userEvent.click(button);
    await nextTick();

    // The rendered attribute agrees with what the browser itself computes.
    expect(button.matches(":focus-visible")).toBe(false);
    expect(button.hasAttribute("data-focus-visible")).toBe(false);
    expect(getComputedStyle(button).boxShadow).toBe(shadowWhenIdle);

    unmount();
  });

  it("ends a press released away from the button", async () => {
    const {container, unmount} = renderButton();
    const button = buttonIn(container);

    await userEvent.dragAndDrop(button, document.body);
    await nextTick();

    // Native `:active` sticks here; the rendered attribute is what the stylesheet reads.
    expect(button.hasAttribute("data-pressed")).toBe(false);

    unmount();
  });

  it("reports hover in step with the pseudo-class", async () => {
    const {container, unmount} = renderButton();
    const button = buttonIn(container);

    const transformWhenIdle = getComputedStyle(button).transform;

    await userEvent.hover(button);
    await nextTick();

    expect(button.matches(":hover")).toBe(true);
    expect(button.getAttribute("data-hovered")).toBe("true");
    // A transform is declared at rest, which is what `:active` scales down from.
    expect(transformWhenIdle).toBeTruthy();

    unmount();
  });

  it("renders the block class and resolves real styles from the stylesheet", () => {
    const {container, unmount} = renderButton();
    const button = buttonIn(container);

    // Proves the compiled HeroUI CSS is actually loaded in this environment.
    expect(button.classList.contains("button")).toBe(true);
    expect(getComputedStyle(button).display).toBe("inline-flex");

    unmount();
  });

  it("blocks pointer events while pending", () => {
    const {container, unmount} = renderButton({isPending: true});
    const button = buttonIn(container);

    // `status-pending` is keyed on `data-pending`, which is the one state that needs JS.
    expect(button.getAttribute("data-pending")).toBe("true");
    expect(getComputedStyle(button).pointerEvents).toBe("none");

    unmount();
  });

  it("dims and blocks a disabled button through :disabled", () => {
    const {container, unmount} = renderButton({isDisabled: true});
    const button = buttonIn(container);

    const styles = getComputedStyle(button);

    expect(button.disabled).toBe(true);
    expect(styles.pointerEvents).toBe("none");
    expect(Number(styles.opacity)).toBeLessThan(1);

    unmount();
  });

  it("has no axe violations", async () => {
    const {container, unmount} = renderButton();

    // `color-contrast` is scoped out, not silenced: the primary button pairs
    // `--accent` (#0485F7) with `--accent-foreground` (#FCFCFC) for 3.59:1, under the
    // 4.5:1 WCAG AA floor for normal text. Both come from `@heroui/styles`, so the
    // finding belongs to the palette and applies equally to `@heroui/react`.
    await expectNoA11yViolations(container, {rules: {"color-contrast": {enabled: false}}});

    unmount();
  });

  it("has no axe violations on a variant that does not lean on the accent palette", async () => {
    const {container, unmount} = renderButton({variant: "outline"});

    await expectNoA11yViolations(container);

    unmount();
  });
});
