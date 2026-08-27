import { PALETTE_CONTRAST_DEBT, expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { parkPointer } from "../../harness/park-pointer";
import { pressRealReset } from "../../harness/real-reset";
import { settled } from "../../harness/settle";

import Fixture from "./fixtures.vue";

const render = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });

  return { ...result, control: result.container.querySelector("input")! };
};

/**
 * The bare control, driven for real.
 *
 * The jsdom suite next door covers which attributes arrive and which states are reported. Three
 * things it cannot cover live here: a form reset, because jsdom restores the controls synchronously
 * inside the dispatch and a post-flush write always lands afterwards to cover the gap; the
 * stylesheet, because `data-disabled` is never rendered on a bare control and `:disabled` is what
 * the cascade reads instead; and a real keystroke, which is the only thing that moves the text
 * before the binding has a say.
 */
describe("Input (browser)", () => {
  it("restores the value its owner holds after a real reset", async () => {
    await parkPointer();

    // The ordering is the whole point: a real browser drains microtasks between dispatching `reset`
    // and restoring the controls, so a write that only mirrors state lands too early. Keeping the
    // reset source in step is what makes it ordering-independent.
    const { container, control, unmount } = render({ value: "pinned", withForm: true });

    await userEvent.click(control);
    await userEvent.keyboard("abc");
    await nextTick();

    expect(control.value).toBe("pinned");

    await pressRealReset(container);
    await nextTick();

    expect(control.value).toBe("pinned");

    unmount();
  });

  it("holds an empty owned value against real typing", async () => {
    await parkPointer();

    // An empty string is a value the caller holds, not an absent one — the case a guard written as
    // `if (!pinned) return` would drop. The pin is what discriminates here and the reset is not:
    // an input with no reset source of its own already restores to empty, so a reset-only
    // assertion would pass either way.
    const { container, control, unmount } = render({ value: "", withForm: true });

    await userEvent.click(control);
    await userEvent.keyboard("typed");
    await nextTick();

    expect(control.value).toBe("");

    await pressRealReset(container);
    await nextTick();

    expect(control.value).toBe("");

    unmount();
  });

  it("reports a real keystroke to the caller", async () => {
    await parkPointer();

    const onUpdate = vi.fn();
    const { control, unmount } = render({ "onUpdate:value": onUpdate });

    await userEvent.click(control);
    await userEvent.keyboard("hi");
    await nextTick();

    // One call per keystroke, each carrying the whole value rather than the character.
    expect(onUpdate.mock.calls.map(([value]) => value)).toEqual(["h", "hi"]);
    expect(control.value).toBe("hi");

    unmount();
  });

  it("reports hover and focus in step with the pseudo-classes", async () => {
    await parkPointer();

    const { control, unmount } = render();

    await userEvent.hover(control);
    await nextTick();

    expect(control.matches(":hover")).toBe(true);
    expect(control).toHaveAttribute("data-hovered", "true");

    await userEvent.click(control);
    await nextTick();

    expect(control).toHaveFocus();
    expect(control).toHaveAttribute("data-focused", "true");
    // A text input is focus-visible to the browser however focus arrived, which is why the
    // stylesheet can key the ring on it without a keyboard check.
    expect(control.matches(":focus-visible")).toBe(true);

    unmount();
  });

  it("dims and blocks a disabled bare control through :disabled", () => {
    const { control, unmount } = render({ disabled: true });

    // Nothing renders `data-disabled` here — there is no field to report it — so `input.css` keying
    // the treatment on `:disabled` as well is the only thing standing between a disabled bare
    // control and looking enabled.
    expect(control.hasAttribute("data-disabled")).toBe(false);
    expect(getComputedStyle(control).pointerEvents).toBe("none");
    expect(Number(getComputedStyle(control).opacity)).toBeLessThan(1);

    unmount();
  });

  it("resolves real styles from the stylesheet", async () => {
    await parkPointer();

    const { control, unmount } = render();

    await settled(control);

    const idle = getComputedStyle(control).backgroundColor;

    await userEvent.hover(control);
    await settled(control);

    // `input.css` paints hover from `[data-hovered]` as well as from `:hover`, and only a real
    // cascade shows the two agreeing.
    expect(getComputedStyle(control).backgroundColor).not.toBe(idle);

    unmount();
  });

  it("has no axe violations", async () => {
    const { container, unmount } = render({ placeholder: "Your name" });

    // Named by its placeholder, which is what every story does and what axe accepts. A real label
    // belongs to `TextField`; this asserts the bare control is not flagged on its own.
    await expectNoA11yViolations(container, PALETTE_CONTRAST_DEBT);

    unmount();
  });
});
