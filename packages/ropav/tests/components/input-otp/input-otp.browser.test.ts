import { expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { pressRealReset } from "../../harness/real-reset";

import Fixture from "./fixtures.vue";

const renderInputOTP = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });

  return {
    ...result,
    control: result.container.querySelector("input") as HTMLInputElement,
    root: result.container.querySelector<HTMLElement>("[data-input-otp-container]")!,
    slotAt: (index: number) =>
      result.container.querySelectorAll<HTMLElement>('[data-slot="input-otp-slot"]')[index]!,
  };
};

/**
 * Poll rather than sleep.
 *
 * Everything the boxes are drawn from reaches the engine through the document's `selectionchange`,
 * which the browser queues as a task rather than firing inline — so the mirror lands some time
 * after the call that moved the caret, and the render lands after that. A fixed sleep is a guess at
 * how long the pair takes, and the guess is what a loaded machine invalidates. This waits for the
 * answer instead, and says what it was waiting for when it never comes.
 */
const waitUntil = async (what: string, predicate: () => boolean, budget = 2000): Promise<void> => {
  const started = performance.now();

  while (performance.now() - started < budget) {
    if (predicate()) return;

    await new Promise((resolve) => requestAnimationFrame(resolve));
    await nextTick();
  }

  throw new Error(`timed out after ${budget}ms waiting for ${what}`);
};

/**
 * A paste carrying text, delivered to the control.
 *
 * The clipboard itself cannot be written to from this harness, and a native desktop paste is the
 * browser's own work rather than the engine's — so these tests hand the field a paste transformer,
 * which is what makes the engine take the paste over on every platform, and deliver a real
 * `DataTransfer` to it.
 */
const paste = async (control: HTMLInputElement, text: string) => {
  const data = new DataTransfer();

  data.setData("text/plain", text);
  control.dispatchEvent(
    new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: data }),
  );

  await nextTick();
};

/** Which box the field currently says the caret is on, read the way the stylesheet reads it. */
const activeIndex = (container: HTMLElement) =>
  [...container.querySelectorAll('[data-slot="input-otp-slot"]')].findIndex(
    (element) => element.getAttribute("data-active") === "true",
  );

/**
 * The parts of a one-time code field only a real browser can show. All of them come down to the
 * same thing: there is one invisible control and the boxes are a drawing of its selection, so
 * everything here depends on a real caret, a real selection and a real pointer — none of which a
 * synthetic event reproduces.
 */
describe("InputOTP (browser)", () => {
  /**
   * The boxes are drawings, and the control is stretched over all of them. Checked by geometry and
   * by `pointer-events` rather than by clicking a box: a real pointer cannot be sent to an element
   * the page has taken out of hit testing, which is exactly the property being asserted.
   */
  it("stretches the control over the boxes and takes them out of the pointer's way", async () => {
    const { container, control, root, unmount } = renderInputOTP();

    expect(getComputedStyle(root).pointerEvents).toBe("none");
    expect(getComputedStyle(control).pointerEvents).toBe("all");

    const controlRect = control.getBoundingClientRect();

    for (const box of container.querySelectorAll('[data-slot="input-otp-slot"]')) {
      const rect = box.getBoundingClientRect();

      expect(rect.left).toBeGreaterThanOrEqual(Math.floor(controlRect.left));
      expect(rect.right).toBeLessThanOrEqual(Math.ceil(controlRect.right));
      expect(rect.top).toBeGreaterThanOrEqual(Math.floor(controlRect.top));
      expect(rect.bottom).toBeLessThanOrEqual(Math.ceil(controlRect.bottom));
    }

    await userEvent.click(control);
    await nextTick();

    expect(document.activeElement).toBe(control);

    unmount();
  });

  it("puts the caret on the first empty box when focus arrives", async () => {
    const { container, control, unmount } = renderInputOTP({ defaultValue: "12" });

    await userEvent.click(control);
    await nextTick();

    expect(activeIndex(container)).toBe(2);

    unmount();
  });

  it("keeps the caret on the last box once the code is full", async () => {
    const { container, control, unmount } = renderInputOTP({ defaultValue: "123456" });

    await userEvent.click(control);
    await nextTick();

    expect(activeIndex(container)).toBe(5);

    unmount();
  });

  it("fills the boxes left to right as the keys are pressed", async () => {
    const { container, control, slotAt, unmount } = renderInputOTP();

    await userEvent.click(control);
    await userEvent.keyboard("12");
    await nextTick();

    expect(slotAt(0)).toHaveTextContent("1");
    expect(slotAt(1)).toHaveTextContent("2");
    expect(activeIndex(container)).toBe(2);

    unmount();
  });

  it("walks the caret back as Backspace empties the boxes", async () => {
    const { container, control, slotAt, unmount } = renderInputOTP({ defaultValue: "123" });

    await userEvent.click(control);
    await userEvent.keyboard("{Backspace}");
    await waitUntil("the caret to walk back a box", () => activeIndex(container) === 2);

    expect(slotAt(2)).toHaveTextContent("");
    expect(activeIndex(container)).toBe(2);

    unmount();
  });

  /**
   * Snapping the caret onto whole characters is the whole reason the engine listens for
   * `selectionchange`: a click lands between two characters as far as the control is concerned, and
   * without the snap the highlight would sit between two boxes rather than on one.
   */
  it("snaps a caret dropped inside the code onto a single box", async () => {
    const { container, control, unmount } = renderInputOTP({ defaultValue: "123456" });

    await userEvent.click(control);
    control.setSelectionRange(2, 2);
    await waitUntil("the caret to snap onto a single box", () => activeIndex(container) === 1);

    expect(activeIndex(container)).toBe(1);
    expect(control.selectionStart).toBe(1);
    expect(control.selectionEnd).toBe(2);

    unmount();
  });

  it("marks every box as active when the whole code is selected", async () => {
    const { container, control, unmount } = renderInputOTP({ defaultValue: "123456" });

    await userEvent.click(control);
    control.setSelectionRange(0, 6);
    await waitUntil(
      "the whole code to be mirrored as selected",
      () => activeIndex(container) === 0,
    );

    const active = [...container.querySelectorAll('[data-slot="input-otp-slot"]')].map(
      (element) => element.getAttribute("data-active") === "true",
    );

    expect(active).toEqual([true, true, true, true, true, true]);

    unmount();
  });

  it("replaces the whole code when a full selection is typed over", async () => {
    const { container, control, slotAt, unmount } = renderInputOTP({ defaultValue: "123456" });

    await userEvent.click(control);
    control.setSelectionRange(0, 6);
    // The keystroke has to land on a selection the engine has already taken in, or it replaces a
    // caret rather than the whole code — which is the thing under test.
    await waitUntil(
      "the whole code to be mirrored as selected",
      () => activeIndex(container) === 0,
    );
    await userEvent.keyboard("9");
    await nextTick();

    expect(control.value).toBe("9");
    expect(slotAt(0)).toHaveTextContent("9");
    expect(slotAt(1)).toHaveTextContent("");

    unmount();
  });

  it("lays a pasted code into the boxes", async () => {
    const { control, slotAt, unmount } = renderInputOTP({ withPasteTransformer: true });

    await userEvent.click(control);
    await paste(control, "135790");
    await nextTick();

    expect(control.value).toBe("135790");
    expect(slotAt(0)).toHaveTextContent("1");
    expect(slotAt(5)).toHaveTextContent("0");
    // The caret ends on the last box rather than past the end of the code.
    expect(control.selectionStart).toBe(5);
    expect(control.selectionEnd).toBe(6);

    unmount();
  });

  it("keeps a pasted code within the length of the field", async () => {
    const { control, unmount } = renderInputOTP({ maxLength: 4, withPasteTransformer: true });

    await userEvent.click(control);
    await paste(control, "13579");
    await nextTick();

    expect(control.value).toBe("1357");

    unmount();
  });

  it("refuses a pasted code the pattern does not allow", async () => {
    const { control, unmount } = renderInputOTP({
      pattern: "^[a-zA-Z]+$",
      withPasteTransformer: true,
    });

    await userEvent.click(control);
    await paste(control, "123456");
    await nextTick();

    expect(control.value).toBe("");

    unmount();
  });

  it("inserts a pasted code at the caret rather than replacing what is there", async () => {
    const { control, unmount } = renderInputOTP({ defaultValue: "12", withPasteTransformer: true });

    await userEvent.click(control);
    await paste(control, "34");
    await nextTick();

    expect(control.value).toBe("1234");

    unmount();
  });

  it("refuses a typed character the pattern does not allow", async () => {
    const { control, slotAt, unmount } = renderInputOTP({ pattern: "^[a-zA-Z]+$" });

    await userEvent.click(control);
    await userEvent.keyboard("a1");
    await nextTick();

    expect(control.value).toBe("a");
    expect(slotAt(1)).toHaveTextContent("");

    unmount();
  });

  it("hides the text of the control so only the boxes are readable", async () => {
    const { control, unmount } = renderInputOTP({ defaultValue: "123" });

    const styles = getComputedStyle(control);

    // Hidden by colour, not by opacity: iOS shows no hold-to-paste menu on a see-through control.
    expect(styles.color).toBe("rgba(0, 0, 0, 0)");
    expect(styles.caretColor).toBe("rgba(0, 0, 0, 0)");
    expect(styles.opacity).toBe("1");
    expect(styles.pointerEvents).toBe("all");

    unmount();
  });

  it("sizes the control's text from the height the boxes came out", async () => {
    const { control, root, unmount } = renderInputOTP();

    // Set from a `ResizeObserver`, so it only exists once something has actually been laid out.
    expect(root.style.getPropertyValue("--root-height")).toBe(
      `${Math.round(control.clientHeight)}px`,
    );
    expect(getComputedStyle(control).fontSize).toBe(`${Math.round(control.clientHeight)}px`);

    unmount();
  });

  it("draws its own caret in the active box, since the real one is invisible", async () => {
    const { container, control, unmount } = renderInputOTP();

    await userEvent.click(control);
    await nextTick();

    const caret = container.querySelector<HTMLElement>('[data-slot="input-otp-caret"]')!;

    expect(caret).not.toBeNull();
    expect(getComputedStyle(caret).animationName).toBe("caret-blink");

    unmount();
  });

  it("cannot be typed into while disabled", async () => {
    const { control, slotAt, unmount } = renderInputOTP({ isDisabled: true });

    await userEvent.click(control, { force: true });
    await userEvent.keyboard("1");
    await nextTick();

    expect(control.value).toBe("");
    expect(slotAt(0)).toHaveTextContent("");

    unmount();
  });

  it("has no accessibility violations", async () => {
    const { container, unmount } = renderInputOTP({ ariaLabel: "Verification code" });

    await nextTick();

    await expectNoA11yViolations(container);

    unmount();
  });

  it("has no accessibility violations while disabled", async () => {
    const { container, unmount } = renderInputOTP({
      ariaLabel: "Verification code",
      isDisabled: true,
    });

    await nextTick();

    // `color-contrast` is scoped off: the disabled field is deliberately faded, which is what the
    // rule reports, and the same exemption is already taken for the other disabled fields.
    await expectNoA11yViolations(container, { rules: { "color-contrast": { enabled: false } } });

    unmount();
  });

  describe("a reset the browser performs", () => {
    it("puts the code back to its default, and submits it", async () => {
      /*
       * Two things at once, because before this sweep neither existed: the field had no
       * `useFormReset` at all, and no reset source on its input. A real reset therefore blanked
       * the input while the boxes kept showing the typed code, and the form submitted an empty
       * string for a field the user could see was filled in.
       */
      const { container, control, slotAt, unmount } = renderInputOTP({
        defaultValue: "123",
        name: "code",
        withForm: true,
      });

      await nextTick();
      await userEvent.click(control);
      await userEvent.keyboard("456");
      await nextTick();

      expect(control.value).toBe("123456");

      await pressRealReset(container);
      await nextTick();
      await nextTick();

      // Both halves: what the form submits, and what the boxes show.
      expect(control.value).toBe("123");
      expect(slotAt(0).textContent).toBe("1");
      expect(new FormData(container.querySelector("form")!).get("code")).toBe("123");

      unmount();
    });
  });
});
