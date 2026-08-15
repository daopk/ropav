import {expectNoA11yViolations} from "@heroui/testing/helpers/a11y";
import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {userEvent} from "vitest/browser";
import {nextTick} from "vue";

import {pressRealReset} from "../../harness/real-reset";

import CheckboxFixture from "./fixtures.vue";
import CheckboxFormFixture from "./form-fixtures.vue";

const renderCheckbox = (props: Record<string, unknown> = {}) =>
  renderVapor(CheckboxFixture, {props});

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

/** The fill and its colour are transitioned, so a computed value has to be let settle. */
const waitForTransition = () => new Promise((resolve) => setTimeout(resolve, 300));

/**
 * The parts of Checkbox only a real browser can show: that the attributes it renders are the
 * ones the stylesheet selects on, that a real pointer drives it, and that the error message
 * expands the way the transition is written.
 */
describe("Checkbox (browser)", () => {
  it("paints a focus ring on the control when the input is focused by keyboard", async () => {
    const {container, unmount} = renderCheckbox();
    const control = slot(container, "checkbox-control");
    const shadowWhenIdle = getComputedStyle(control).boxShadow;

    await userEvent.keyboard("{Tab}");
    await nextTick();

    // The ring is drawn with a box shadow and `outline-style: none`, so the outline says
    // nothing about whether it is there.
    expect(getComputedStyle(control).boxShadow).not.toBe(shadowWhenIdle);
    expect(slot(container, "checkbox-content").getAttribute("data-focus-visible")).toBe("true");

    unmount();
  });

  it("leaves the ring off when focus follows a pointer", async () => {
    const {container, unmount} = renderCheckbox();
    const control = slot(container, "checkbox-control");
    const shadowWhenIdle = getComputedStyle(control).boxShadow;

    await userEvent.click(slot(container, "checkbox-content"));
    await nextTick();

    expect(slot(container, "checkbox-content").hasAttribute("data-focus-visible")).toBe(false);
    expect(getComputedStyle(control).boxShadow).toBe(shadowWhenIdle);

    unmount();
  });

  it("ticks under a real pointer, which synthetic events cannot prove", async () => {
    const {container, unmount} = renderCheckbox();

    await userEvent.click(slot(container, "checkbox-content"));
    await nextTick();

    expect(container.querySelector("input")!.checked).toBe(true);
    expect(slot(container, "checkbox").getAttribute("data-selected")).toBe("true");

    unmount();
  });

  it("fills the control once it is ticked", async () => {
    const {container, unmount} = renderCheckbox();
    const control = slot(container, "checkbox-control");

    // The fill is a `::before` layer that scales and fades in, not the control's own
    // background — reading `background-color` off the control would show nothing at all.
    expect(getComputedStyle(control, "::before").opacity).toBe("0");

    await userEvent.click(slot(container, "checkbox-content"));
    await nextTick();
    await waitForTransition();

    expect(getComputedStyle(control, "::before").opacity).toBe("1");
    expect(getComputedStyle(control, "::before").scale).toBe("1");

    unmount();
  });

  it("darkens the fill on hover", async () => {
    const {container, unmount} = renderCheckbox();
    const content = slot(container, "checkbox-content");
    const control = slot(container, "checkbox-control");
    const idle = getComputedStyle(control, "::before").backgroundColor;

    await userEvent.hover(content);
    await nextTick();
    await waitForTransition();

    expect(content.getAttribute("data-hovered")).toBe("true");
    expect(getComputedStyle(control, "::before").backgroundColor).not.toBe(idle);

    unmount();
  });

  it("rings the control in danger when validation fails", async () => {
    const {container: valid, unmount: unmountValid} = renderCheckbox();
    const {container, unmount} = renderCheckbox({isInvalid: true});

    await nextTick();

    // `status-invalid-field` draws a danger outline. The width is not the tell — the base
    // already carries one behind `outline-style: none` — so the style is what to read.
    expect(getComputedStyle(slot(valid, "checkbox-control")).outlineStyle).toBe("none");

    const invalid = getComputedStyle(slot(container, "checkbox-control"));

    expect(invalid.outlineStyle).toBe("solid");
    expect(invalid.outlineWidth).toBe("1px");

    unmountValid();
    unmount();
  });

  it("shows the tick at full stroke once selected", async () => {
    const {container, unmount} = renderCheckbox({defaultSelected: true});

    await nextTick();

    const checkmark = slot(container, "checkbox-default-indicator--checkmark");

    // Tailwind v4 writes `scale-*` into the `scale` property, so `transform` proves nothing
    // here — the tick is revealed through its stroke offset instead.
    expect(checkmark.getAttribute("stroke-dashoffset")).toBe("44");
    expect(getComputedStyle(checkmark).width).not.toBe("0px");

    unmount();
  });

  describe("field error", () => {
    it("lays the message out flat inside the checkbox, not collapsed", async () => {
      const {container, unmount} = renderCheckbox({
        validate: () => "must be accepted",
        validationBehavior: "aria",
        withFieldError: true,
      });

      await nextTick();

      const error = slot(container, "field-error");
      const style = getComputedStyle(error);

      // `.field-error` alone is `h-0 opacity-0` with a height transition; the descendant rule
      // for `.checkbox > .field-error` flattens all of that, which is what keeps the field's
      // column layout from breaking.
      expect(style.opacity).toBe("1");
      expect(style.height).not.toBe("0px");
      expect(style.transitionDuration).toBe("0s");
      expect(style.paddingTop).toBe("0px");

      unmount();
    });

    it("moves focus to the field and paints the ring on a failed submit", async () => {
      const {container, unmount} = renderVapor(CheckboxFormFixture, {
        props: {validate: () => "must be accepted", withFieldError: true},
      });
      const form = container.querySelector("form")!;

      form.addEventListener("submit", (event) => event.preventDefault());

      await nextTick();
      await userEvent.click(container.querySelector("[data-testid='submit']")!);
      await nextTick();
      await nextTick();

      const input = container.querySelector("input")!;

      expect(document.activeElement).toBe(input);
      // The move came from a submit rather than a pointer, so the ring has to be asked for.
      expect(slot(container, "checkbox-content").getAttribute("data-focus-visible")).toBe("true");
      expect(slot(container, "field-error").textContent).toContain("must be accepted");

      unmount();
    });
  });

  describe("accessibility", () => {
    it("has no violations in its default state", async () => {
      const {container, unmount} = renderCheckbox();

      await nextTick();
      await expectNoA11yViolations(container);

      unmount();
    });

    it("has no violations while invalid with a message", async () => {
      const {container, unmount} = renderCheckbox({
        isInvalid: true,
        isRequired: true,
        withFieldError: true,
      });

      await nextTick();
      await expectNoA11yViolations(container);

      unmount();
    });

    it("has no violations while indeterminate", async () => {
      const {container, unmount} = renderCheckbox({isIndeterminate: true});

      await nextTick();
      await expectNoA11yViolations(container);

      unmount();
    });
  });

  describe("a reset the browser performs", () => {
    it("puts the box back to its default, and submits it", async () => {
      /*
       * `checked` reflects nothing, so a binding leaves the input with no reset source and this is
       * the only kind of test that can see it: jsdom restores the controls inside the dispatch, so
       * the post-flush write mirroring the state lands afterwards and covers the gap even when the
       * test clicks this very button. Here the browser drains microtasks in between, the restore
       * goes first, and an unticked box is what the form submits.
       */
      const {container, unmount} = renderVapor(CheckboxFormFixture, {
        props: {defaultSelected: true, name: "terms", value: "yes"},
      });
      const input = container.querySelector("input")!;

      await nextTick();
      await userEvent.click(slot(container, "checkbox-content"));

      expect(input.checked).toBe(false);

      await pressRealReset(container);
      await nextTick();
      await nextTick();

      expect(input.checked).toBe(true);
      // What the user actually loses when this is wrong.
      expect(new FormData(container.querySelector("form")!).get("terms")).toBe("yes");

      unmount();
    });
  });
});
