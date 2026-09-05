import { PALETTE_CONTRAST_DEBT, expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { settled } from "../../harness/settle";

import Fixture from "./fixtures.vue";

const renderNumberField = (props: Record<string, unknown> = {}) =>
  renderVapor(Fixture, { props: { locale: "en-US", ...props } });

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The parts of a number field only a real browser can show: the grid the `:has([slot=…])` rules
 * lay out, holding a stepper to make the value run, the wheel, and — the one thing a synthetic
 * event cannot reproduce — where the caret ends up after the text is reformatted underneath it.
 */
describe("NumberField (browser)", () => {
  it("lays the group out in three columns around the input", async () => {
    // `.rp-number-field__group:has([slot="decrement"]):has([slot="increment"])` is the rule. It
    // cannot be checked without a layout engine, and losing it has no other symptom.
    const { container, unmount } = renderNumberField({ defaultValue: 5 });

    expect(getComputedStyle(slot(container, "number-field-group")).gridTemplateColumns).toMatch(
      /^40px .+ 40px$/,
    );

    unmount();
  });

  it("drops to two columns with only one stepper", async () => {
    const { container, unmount } = renderNumberField({ defaultValue: 5, withDecrement: false });

    expect(getComputedStyle(slot(container, "number-field-group")).gridTemplateColumns).toMatch(
      /40px$/,
    );

    unmount();
  });

  it("lays out a single column with no steppers at all", async () => {
    const { container, unmount } = renderNumberField({
      defaultValue: 5,
      withDecrement: false,
      withIncrement: false,
    });

    const columns = getComputedStyle(slot(container, "number-field-group")).gridTemplateColumns;

    expect(columns).not.toMatch(/40px/);

    unmount();
  });

  it("steps the value when a real pointer clicks a stepper", async () => {
    const { container, unmount } = renderNumberField({ defaultValue: 5, step: 1 });

    await userEvent.click(slot(container, "number-field-increment-button"));
    await nextTick();

    expect((slot(container, "number-field-input") as HTMLInputElement).value).toBe("6");

    unmount();
  });

  it("keeps stepping while a stepper is held down", async () => {
    // Hold-to-repeat re-arms itself one step at a time rather than running on an interval, and a
    // synthetic pointer never produces the press that starts it.
    const { container, unmount } = renderNumberField({ defaultValue: 0, step: 1 });
    const button = slot(container, "number-field-increment-button");
    const input = slot(container, "number-field-input") as HTMLInputElement;

    const box = button.getBoundingClientRect();

    button.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        clientX: box.x + box.width / 2,
        clientY: box.y + box.height / 2,
        isPrimary: true,
        pointerId: 1,
        pointerType: "mouse",
      }),
    );

    // Long enough for the initial delay plus a handful of repeats.
    await wait(700);
    await nextTick();

    const held = Number(input.value);

    expect(held).toBeGreaterThan(1);

    button.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, cancelable: true, pointerType: "mouse" }),
    );
    await wait(200);
    await nextTick();

    // Releasing has to stop the chain, not just pause it.
    expect(Number(input.value)).toBe(held);

    unmount();
  });

  it("stops the repeat at the end of the range", async () => {
    const { container, unmount } = renderNumberField({
      defaultValue: 0,
      maxValue: 3,
      minValue: 0,
      step: 1,
    });
    const button = slot(container, "number-field-increment-button");
    const input = slot(container, "number-field-input") as HTMLInputElement;

    button.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerType: "mouse" }),
    );
    await wait(700);
    await nextTick();

    expect(input.value).toBe("3");

    button.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, cancelable: true, pointerType: "mouse" }),
    );

    unmount();
  });

  it("hands focus to the input when a mouse presses a stepper", async () => {
    const { container, unmount } = renderNumberField({ defaultValue: 5, step: 1 });
    const input = slot(container, "number-field-input");

    await userEvent.click(slot(container, "number-field-increment-button"));
    await nextTick();

    expect(document.activeElement).toBe(input);

    unmount();
  });

  it("keeps the caret at the end after the text is reformatted", async () => {
    // Committing rewrites the whole value, and a rewrite moves the caret. This is the assertion
    // a synthetic event cannot make: the caret only has a position in a real layout.
    const { container, unmount } = renderNumberField({
      defaultValue: 1000,
      formatOptions: { currency: "USD", style: "currency" },
    });
    const input = slot(container, "number-field-input") as HTMLInputElement;

    await userEvent.click(input);
    await userEvent.keyboard("{Enter}");
    await nextTick();

    expect(input.value).toBe("$1,000.00");
    expect(input.selectionStart).toBe(input.value.length);

    unmount();
  });

  it("steps with a real arrow key press", async () => {
    const { container, unmount } = renderNumberField({ defaultValue: 5, step: 1 });
    const input = slot(container, "number-field-input") as HTMLInputElement;

    await userEvent.click(input);
    await userEvent.keyboard("{ArrowUp}");
    await nextTick();

    expect(input.value).toBe("6");

    unmount();
  });

  it("runs the value up while an arrow key is held", async () => {
    // The browser's own key repeat drives this, which is why repeats are let through rather than
    // swallowed on the first one.
    const { container, unmount } = renderNumberField({ defaultValue: 0, step: 1 });
    const input = slot(container, "number-field-input") as HTMLInputElement;

    await userEvent.click(input);
    await userEvent.keyboard("{ArrowUp>5/}");
    await nextTick();

    expect(input.value).toBe("5");

    unmount();
  });

  it("steps the value on the wheel while focus is inside", async () => {
    const { container, unmount } = renderNumberField({ defaultValue: 5, step: 1 });
    const input = slot(container, "number-field-input") as HTMLInputElement;

    await userEvent.click(input);
    await nextTick();

    input.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 20 }));
    await nextTick();

    expect(input.value).toBe("6");

    unmount();
  });

  it("ignores the wheel while focus is elsewhere", async () => {
    // Otherwise scrolling a page past a number field would quietly rewrite it.
    const { container, unmount } = renderNumberField({ defaultValue: 5, step: 1 });
    const input = slot(container, "number-field-input") as HTMLInputElement;

    await nextTick();
    input.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 20 }));
    await nextTick();

    expect(input.value).toBe("5");

    unmount();
  });

  it("refuses a character that could never be part of the number", async () => {
    // `beforeinput` is what does this, and it is the only event that can still be cancelled —
    // jsdom does not deliver it at all.
    const { container, unmount } = renderNumberField({ defaultValue: 5 });
    const input = slot(container, "number-field-input") as HTMLInputElement;

    await userEvent.click(input);
    await userEvent.keyboard("abc");
    await nextTick();

    expect(input.value).toBe("5");

    unmount();
  });

  it("lets a half-typed decimal through", async () => {
    const { container, unmount } = renderNumberField({});
    const input = slot(container, "number-field-input") as HTMLInputElement;

    await userEvent.click(input);
    await userEvent.keyboard("1.");
    await nextTick();

    expect(input.value).toBe("1.");

    unmount();
  });

  it("normalises the text when focus leaves", async () => {
    const { container, unmount } = renderNumberField({
      formatOptions: { currency: "USD", style: "currency" },
    });
    const input = slot(container, "number-field-input") as HTMLInputElement;

    await userEvent.click(input);
    await userEvent.keyboard("1234.5");
    await userEvent.tab();
    await nextTick();

    expect(input.value).toBe("$1,234.50");

    unmount();
  });

  it("takes a pasted number that replaces the whole field", async () => {
    const { container, unmount } = renderNumberField({
      formatOptions: { currency: "USD", style: "currency" },
    });
    const input = slot(container, "number-field-input") as HTMLInputElement;

    await userEvent.click(input);

    const data = new DataTransfer();

    data.setData("text/plain", " 42 ");
    input.dispatchEvent(
      new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: data }),
    );
    await nextTick();

    expect(input.value).toBe("$42.00");

    unmount();
  });

  it("skips the steppers when tabbing through", async () => {
    // Two extra tab stops in front of every number on a form is the thing being avoided.
    const { container, unmount } = renderNumberField({ defaultValue: 5 });
    const input = slot(container, "number-field-input");

    await userEvent.click(input);
    await userEvent.tab();
    await nextTick();

    expect(document.activeElement).not.toBe(slot(container, "number-field-increment-button"));
    expect(document.activeElement).not.toBe(slot(container, "number-field-decrement-button"));

    unmount();
  });

  it("paints the focus ring on the group rather than on the input", async () => {
    const { container, unmount } = renderNumberField({ defaultValue: 5 });
    const group = slot(container, "number-field-group");
    const input = slot(container, "number-field-input");

    const idle = getComputedStyle(group).boxShadow;

    await userEvent.click(input);
    await nextTick();

    expect(group).toHaveAttribute("data-focus-within", "true");

    await settled(group);

    expect(getComputedStyle(group).boxShadow).not.toBe(idle);
    expect(getComputedStyle(input).outlineStyle).toBe("none");

    unmount();
  });

  it("fills the group on hover and drops the fill once focus is inside", async () => {
    const { container, unmount } = renderNumberField({ defaultValue: 5 });
    const group = slot(container, "number-field-group");
    const input = slot(container, "number-field-input");

    const idle = getComputedStyle(group).backgroundColor;

    await userEvent.hover(group);
    await nextTick();

    await settled(group);

    const hovered = getComputedStyle(group).backgroundColor;

    expect(hovered).not.toBe(idle);

    await userEvent.click(input);
    await nextTick();

    await settled(group);

    expect(getComputedStyle(group).backgroundColor).not.toBe(hovered);

    unmount();
  });

  it("scales a stepper down while it is held", async () => {
    const { container, unmount } = renderNumberField({ defaultValue: 5, step: 1 });
    const button = slot(container, "number-field-increment-button");

    const idle = getComputedStyle(button).transform;

    button.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerType: "mouse" }),
    );
    await nextTick();

    // Written as raw `transform: scale(0.97)` in the stylesheet, not as a Tailwind utility — so
    // it lands in `transform`, unlike `scale-*`, which Tailwind v4 writes into `scale`.
    expect(getComputedStyle(button).transform).not.toBe(idle);

    button.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, cancelable: true, pointerType: "mouse" }),
    );

    unmount();
  });

  it("has no accessibility violations", async () => {
    const { container, unmount } = renderNumberField({ defaultValue: 5, withDescription: true });

    await expectNoA11yViolations(container);

    unmount();
  });

  it("has no accessibility violations while disabled", async () => {
    const { container, unmount } = renderNumberField({ defaultValue: 5, isDisabled: true });

    // `color-contrast` is scoped out for this one case, not silenced: a disabled field dims its
    // label through opacity, which drops it below the threshold. The same colour comes out of
    // React, so this is a gap in the shared stylesheet rather than anything about this port.
    await expectNoA11yViolations(container, PALETTE_CONTRAST_DEBT);

    unmount();
  });
});
