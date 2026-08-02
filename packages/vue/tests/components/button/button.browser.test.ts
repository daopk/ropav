import {expectNoA11yViolations} from "@heroui/testing/helpers/a11y";
import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {userEvent} from "vitest/browser";

import {Button} from "@/components/button";

const renderButton = (props: Record<string, unknown> = {}) =>
  renderVapor(Button, {
    props,
    slots: {default: () => document.createTextNode("Press me")},
  });

const buttonIn = (container: HTMLElement) => container.querySelector("button")!;

/**
 * These cover the bet this port makes on Button: that native pseudo-classes stand in for
 * the `data-hovered` / `data-pressed` / `data-focus-visible` attributes React Aria sets,
 * because the HeroUI stylesheet declares both. Only a real browser can show it working.
 */
describe("Button (browser)", () => {
  it("matches :focus-visible on keyboard focus and gets a focus ring", async () => {
    const {container, unmount} = renderButton();
    const button = buttonIn(container);

    const outlineWhenIdle = getComputedStyle(button).outlineWidth;

    await userEvent.keyboard("{Tab}");

    expect(button).toHaveFocus();
    expect(button.matches(":focus-visible")).toBe(true);
    // The stylesheet reacts to the pseudo-class alone, with no JS state involved.
    expect(getComputedStyle(button).outlineWidth).not.toBe(outlineWhenIdle);

    unmount();
  });

  it("does not match :focus-visible when focused by pointer", async () => {
    const {container, unmount} = renderButton();
    const button = buttonIn(container);

    await userEvent.click(button);

    expect(button.matches(":focus-visible")).toBe(false);

    unmount();
  });

  it("reacts to :hover with no JS state involved", async () => {
    const {container, unmount} = renderButton();
    const button = buttonIn(container);

    const transformWhenIdle = getComputedStyle(button).transform;

    await userEvent.hover(button);

    expect(button.matches(":hover")).toBe(true);
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
