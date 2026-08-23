import { expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { pressRealReset } from "../../harness/real-reset";

import Fixture from "./fixtures.vue";
import FormFixture from "./form-fixtures.vue";

const renderField = (props: Record<string, unknown> = {}) => renderVapor(Fixture, { props });

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

/**
 * The parts of a text field only a real browser can show: that the attributes it renders are
 * the ones the stylesheet selects on, that the ring is actually painted, and that clicking the
 * label moves focus into the control.
 */
describe("TextField (browser)", () => {
  it("paints a focus ring on the control when it takes focus", async () => {
    const { container, unmount } = renderField();
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
    const { container, unmount } = renderField();
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
    const { container, unmount } = renderField();
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
    const valid = renderField({ withDescription: true });
    const labelWhenValid = getComputedStyle(slot(valid.container, "label")).color;

    expect(getComputedStyle(slot(valid.container, "description")).display).not.toBe("none");

    valid.unmount();

    const invalid = renderField({ isInvalid: true, withDescription: true });

    await nextTick();

    expect(getComputedStyle(slot(invalid.container, "label")).color).not.toBe(labelWhenValid);
    expect(getComputedStyle(slot(invalid.container, "description")).display).toBe("none");

    invalid.unmount();
  });

  it("draws the required marker on the label", async () => {
    // The asterisk is an `::after` on `[data-required="true"] > .label`, which needs the label
    // to be a direct child of the field.
    const { container, unmount } = renderField({ isRequired: true });
    const label = slot(container, "label");

    expect(getComputedStyle(label, "::after").content).toContain("*");

    unmount();
  });

  it("dims a disabled field", async () => {
    const enabled = renderField();
    const enabledOpacity = getComputedStyle(slot(enabled.container, "input")).opacity;

    enabled.unmount();

    const { container, unmount } = renderField({ isDisabled: true });
    const input = slot(container, "input");

    expect(input).toBeDisabled();
    expect(getComputedStyle(input).opacity).not.toBe(enabledOpacity);

    unmount();
  });

  it("really updates the value as the user types", async () => {
    const { container, unmount } = renderField();
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
    const { container, unmount } = renderField({ value: "fixed" });
    const input = slot(container, "input") as HTMLInputElement;

    await userEvent.click(input);
    await userEvent.keyboard("typed");
    await nextTick();

    expect(input.value).toBe("fixed");

    unmount();
  });

  it("stretches the control to the field when full width", async () => {
    const { container, unmount } = renderField({ attributeForm: true });
    const root = slot(container, "textfield");
    const input = slot(container, "input");

    expect(getComputedStyle(input).width).toBe(getComputedStyle(root).width);

    unmount();
  });

  it("has no accessibility violations", async () => {
    const { container, unmount } = renderField({ withDescription: true });

    await expectNoA11yViolations(container);

    unmount();
  });

  it("has no accessibility violations for a textarea field", async () => {
    const { container, unmount } = renderField({ withTextArea: true });

    await expectNoA11yViolations(container);

    unmount();
  });

  describe("a reset the browser performs", () => {
    it("puts a textarea back to its default", async () => {
      /*
       * The mechanism nothing else covers. A textarea has no `value` attribute at all — its reset
       * source is its child text content — and no jsdom test can stand in for this one: jsdom
       * restores the controls inside the dispatch, so the post-flush write mirroring the state
       * always lands afterwards and passes with or without the fix. Here the browser drains
       * microtasks between dispatching `reset` and restoring, so the restore goes first and reads
       * whatever the element actually carries.
       */
      const { container, unmount } = renderVapor(FormFixture, {
        props: { defaultValue: "hello", name: "bio", withTextArea: true },
      });
      const control = slot(container, "textarea") as HTMLTextAreaElement;

      await nextTick();
      await userEvent.click(control);
      await userEvent.keyboard(" there");

      expect(control.value).toBe("hello there");

      await pressRealReset(container);
      await nextTick();
      await nextTick();

      expect(control.value).toBe("hello");

      // Replacing the child text does not leave the control unable to take more typing, which is
      // the half of the mechanism that only a real caret can show.
      await userEvent.click(control);
      await userEvent.keyboard("!");
      expect(control.value).toBe("hello!");

      unmount();
    });

    it("puts an input back to its default, and submits it", async () => {
      const { container, unmount } = renderVapor(FormFixture, {
        props: { defaultValue: "hello", name: "q" },
      });
      const control = slot(container, "input") as HTMLInputElement;

      await nextTick();
      await userEvent.click(control);
      await userEvent.keyboard(" there");

      expect(control.value).toBe("hello there");

      await pressRealReset(container);
      await nextTick();
      await nextTick();

      expect(control.value).toBe("hello");
      // What the user actually loses when this is wrong: the form submits the wrong thing.
      expect(new FormData(container.querySelector("form")!).get("q")).toBe("hello");

      unmount();
    });
  });
});
