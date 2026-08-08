import {expectNoA11yViolations} from "@heroui/testing/helpers/a11y";
import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {userEvent} from "vitest/browser";
import {nextTick} from "vue";

import Fixture from "./fixtures.vue";

const renderField = (props: Record<string, unknown> = {}) => renderVapor(Fixture, {props});

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

/**
 * The parts of a text field only a real browser can show: that the attributes it renders are
 * the ones the stylesheet selects on, that the ring is actually painted, and that clicking the
 * label moves focus into the control.
 */
describe("TextField (browser)", () => {
  it("paints a focus ring on the control when it takes focus", async () => {
    const {container, unmount} = renderField();
    const input = slot(container, "input");

    const shadowWhenIdle = getComputedStyle(input).boxShadow;

    await userEvent.click(input);
    await nextTick();

    // `status-focused-field` draws the ring with a box shadow and pins `outline-style: none`,
    // so the outline says nothing about whether the ring is there.
    expect(getComputedStyle(input).boxShadow).not.toBe(shadowWhenIdle);
    expect(input).toHaveAttribute("data-focused", "true");

    unmount();
  });

  it("moves focus into the control when the label is clicked", async () => {
    // The only thing that does this is `for` on the label pointing at the control's id.
    const {container, unmount} = renderField();
    const label = slot(container, "label");
    const input = slot(container, "input");

    expect(label).toHaveAttribute("for", input.id);

    await userEvent.click(label);
    await nextTick();

    expect(document.activeElement).toBe(input);

    unmount();
  });

  it("darkens the control on hover and drops the hover once focused", async () => {
    // The stylesheet gates hover on `:not(:focus)`, so a focused field must not keep it.
    const {container, unmount} = renderField();
    const input = slot(container, "input");

    const idle = getComputedStyle(input).backgroundColor;

    await userEvent.hover(input);
    await nextTick();

    const hovered = getComputedStyle(input).backgroundColor;

    expect(hovered).not.toBe(idle);
    expect(input).toHaveAttribute("data-hovered", "true");

    await userEvent.click(input);
    await nextTick();

    expect(getComputedStyle(input).backgroundColor).not.toBe(hovered);

    unmount();
  });

  it("turns the label danger and hides the description while invalid", async () => {
    // Both come from ancestor selectors on the field's own `data-invalid`, so they only prove
    // anything with the real stylesheet applied.
    const valid = renderField({withDescription: true});
    const labelWhenValid = getComputedStyle(slot(valid.container, "label")).color;

    expect(getComputedStyle(slot(valid.container, "description")).display).not.toBe("none");

    valid.unmount();

    const invalid = renderField({isInvalid: true, withDescription: true});

    await nextTick();

    expect(getComputedStyle(slot(invalid.container, "label")).color).not.toBe(labelWhenValid);
    expect(getComputedStyle(slot(invalid.container, "description")).display).toBe("none");

    invalid.unmount();
  });

  it("draws the required marker on the label", async () => {
    // The asterisk is an `::after` on `[data-required="true"] > .label`, which needs the label
    // to be a direct child of the field.
    const {container, unmount} = renderField({isRequired: true});
    const label = slot(container, "label");

    expect(getComputedStyle(label, "::after").content).toContain("*");

    unmount();
  });

  it("dims a disabled field", async () => {
    const enabled = renderField();
    const enabledOpacity = getComputedStyle(slot(enabled.container, "input")).opacity;

    enabled.unmount();

    const {container, unmount} = renderField({isDisabled: true});
    const input = slot(container, "input");

    expect(input).toBeDisabled();
    expect(getComputedStyle(input).opacity).not.toBe(enabledOpacity);

    unmount();
  });

  it("really updates the value as the user types", async () => {
    const {container, unmount} = renderField();
    const input = slot(container, "input") as HTMLInputElement;

    await userEvent.click(input);
    await userEvent.keyboard("hello");
    await nextTick();

    expect(input.value).toBe("hello");

    unmount();
  });

  it("keeps a controlled field at the value its owner allows", async () => {
    // A real keyboard is the only way to prove the re-assert: the browser moves the text
    // first, and a binding whose value did not change is skipped.
    const {container, unmount} = renderField({value: "fixed"});
    const input = slot(container, "input") as HTMLInputElement;

    await userEvent.click(input);
    await userEvent.keyboard("typed");
    await nextTick();

    expect(input.value).toBe("fixed");

    unmount();
  });

  it("stretches the control to the field when full width", async () => {
    const {container, unmount} = renderField({attributeForm: true});
    const root = slot(container, "textfield");
    const input = slot(container, "input");

    expect(getComputedStyle(input).width).toBe(getComputedStyle(root).width);

    unmount();
  });

  it("has no accessibility violations", async () => {
    const {container, unmount} = renderField({withDescription: true});

    await expectNoA11yViolations(container);

    unmount();
  });

  it("has no accessibility violations for a textarea field", async () => {
    const {container, unmount} = renderField({withTextArea: true});

    await expectNoA11yViolations(container);

    unmount();
  });
});
