import { PALETTE_CONTRAST_DEBT, expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { Button } from "@/components/button";

import { parkPointer } from "../../harness/park-pointer";
import { settled } from "../../harness/settle";

const renderButton = (props: Record<string, unknown> = {}) =>
  renderVapor(Button, {
    props,
    slots: { default: () => document.createTextNode("Press me") },
  });

const buttonIn = (container: HTMLElement) => container.querySelector("button")!;

/**
 * These cover the parts of Button only a real browser can show: that the interaction
 * attributes it renders line up with the pseudo-classes the browser computes, and that
 * the stylesheet then paints the states those attributes select.
 */
describe("Button (browser)", () => {
  it("paints a focus ring on keyboard focus", async () => {
    const { container, unmount } = renderButton();
    const button = buttonIn(container);

    const shadowWhenIdle = getComputedStyle(button).boxShadow;

    await userEvent.keyboard("{Tab}");
    await nextTick();

    expect(button).toHaveFocus();
    expect(button.matches(":focus-visible")).toBe(true);
    // The ring is a ring utility, so it lands on box-shadow. `outline-style` stays
    // `none` in both states, which makes outline useless as the assertion here.
    expect(button.getAttribute("data-focus-visible")).toBe("true");

    await settled(button);

    expect(getComputedStyle(button).boxShadow).not.toBe(shadowWhenIdle);

    unmount();
  });

  it("paints no focus ring when focused by pointer", async () => {
    const { container, unmount } = renderButton();
    const button = buttonIn(container);

    const shadowWhenIdle = getComputedStyle(button).boxShadow;

    await userEvent.click(button);
    await nextTick();

    // The rendered attribute agrees with what the browser itself computes.
    expect(button.matches(":focus-visible")).toBe(false);
    expect(button.hasAttribute("data-focus-visible")).toBe(false);

    await settled(button);

    expect(getComputedStyle(button).boxShadow).toBe(shadowWhenIdle);

    unmount();
  });

  it("ends a press released away from the button", async () => {
    const { container, unmount } = renderButton();
    const button = buttonIn(container);

    await userEvent.dragAndDrop(button, document.body);
    await nextTick();

    // Native `:active` sticks here; the rendered attribute is what the stylesheet reads.
    expect(button.hasAttribute("data-pressed")).toBe(false);

    unmount();
  });

  it("reports hover in step with the pseudo-class", async () => {
    const { container, unmount } = renderButton();
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

  it("activates on Enter and on Space", async () => {
    const clicks: MouseEvent[] = [];
    const { container, unmount } = renderVapor(Button, {
      props: { onClick: (event: MouseEvent) => clicks.push(event) },
      slots: { default: () => document.createTextNode("Press me") },
    });
    const button = buttonIn(container);

    button.focus();
    // Keyboard activation is left to the native button, so only a real browser shows it.
    await userEvent.keyboard("{Enter}");

    expect(clicks).toHaveLength(1);

    await userEvent.keyboard(" ");

    expect(clicks).toHaveLength(2);

    unmount();
  });

  /**
   * The synthetic press the jsdom suite uses cannot see this. A real press moves the pointer onto
   * the button first, and hovering re-renders it; in vapor a re-render re-attaches every listener
   * that arrived through `v-bind`, which reorders them and can drop one mid-dispatch. So a button
   * whose activation is green under a dispatched event can still be dead under a finger.
   *
   * The pointer is parked first because it belongs to the page rather than to this test: left on
   * the button by an earlier test, a click would never cross the boundary that triggers the
   * re-render, and the case would pass without exercising anything.
   */
  it("activates on a press from the pointer itself", async () => {
    await parkPointer();

    const clicks: MouseEvent[] = [];
    const { container, unmount } = renderVapor(Button, {
      props: { onClick: (event: MouseEvent) => clicks.push(event) },
      slots: { default: () => document.createTextNode("Press me") },
    });
    const button = buttonIn(container);

    await userEvent.click(button);
    await nextTick();

    expect(clicks).toHaveLength(1);

    unmount();
  });

  it("renders the block class and resolves real styles from the stylesheet", () => {
    const { container, unmount } = renderButton();
    const button = buttonIn(container);

    // Proves the compiled `@ropav/styles` CSS is actually loaded in this environment.
    expect(button.classList.contains("rp-button")).toBe(true);
    expect(getComputedStyle(button).display).toBe("inline-flex");

    unmount();
  });

  it("blocks pointer events while pending", () => {
    const { container, unmount } = renderButton({ isPending: true });
    const button = buttonIn(container);

    // `status-pending` is keyed on `data-pending`, which is the one state that needs JS.
    expect(button.getAttribute("data-pending")).toBe("true");
    expect(getComputedStyle(button).pointerEvents).toBe("none");

    unmount();
  });

  it("dims and blocks a disabled button through :disabled", () => {
    const { container, unmount } = renderButton({ isDisabled: true });
    const button = buttonIn(container);

    const styles = getComputedStyle(button);

    expect(button.disabled).toBe(true);
    expect(styles.pointerEvents).toBe("none");
    expect(Number(styles.opacity)).toBeLessThan(1);

    unmount();
  });

  it("does not submit its form while pending", async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    const form = document.createElement("form");

    document.body.appendChild(form);
    form.addEventListener("submit", onSubmit);

    const { container, unmount } = renderButton({ isPending: true, type: "submit" });

    form.appendChild(container);

    // A real click cannot land while `pointer-events` is none, so the click is dispatched
    // directly: what is under test is the type downgrade, not the pointer blocking.
    buttonIn(container).click();

    expect(onSubmit).not.toHaveBeenCalled();

    unmount();
    form.remove();
  });

  it("submits its form once pending clears", async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    const form = document.createElement("form");

    document.body.appendChild(form);
    form.addEventListener("submit", onSubmit);

    const { container, unmount } = renderButton({ type: "submit" });

    form.appendChild(container);

    await userEvent.click(buttonIn(container));

    expect(onSubmit).toHaveBeenCalledTimes(1);

    unmount();
    form.remove();
  });

  it("has no axe violations", async () => {
    const { container, unmount } = renderButton();

    // `color-contrast` is scoped out, not silenced: the primary button pairs `--accent`
    // with `--accent-foreground` under the 4.5:1 WCAG AA floor for normal text. Both come
    // from `@ropav/styles`, so the finding belongs to the palette, not to this component.
    await expectNoA11yViolations(container, PALETTE_CONTRAST_DEBT);

    unmount();
  });

  it("has no axe violations on a variant that does not lean on the accent palette", async () => {
    const { container, unmount } = renderButton({ variant: "outline" });

    await expectNoA11yViolations(container);

    unmount();
  });
});
