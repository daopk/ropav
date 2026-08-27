import { PALETTE_CONTRAST_DEBT, expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { parkPointer } from "../../harness/park-pointer";
import { pressRealReset } from "../../harness/real-reset";

import Fixture from "./fixtures.vue";

const render = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });

  return { ...result, control: result.container.querySelector("textarea")! };
};

/**
 * The half of the reset mechanism a textarea keeps somewhere else.
 *
 * `setFormValue` writes `defaultValue`, and on an `<input>` that reflects into a `value` attribute
 * a test can read back. A textarea has no such attribute — its reset source is its child text
 * content — so the two elements really are different mechanisms, and a browser passing for one
 * says nothing about the other. This is the only place the restore itself can be checked.
 */
describe("TextArea (browser)", () => {
  it("restores the value its owner holds after a real reset", async () => {
    await parkPointer();

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

    // As with the input: the pin discriminates and the reset does not, because a textarea with no
    // reset source of its own already restores to empty.
    const { control, unmount } = render({ value: "", withForm: true });

    await userEvent.click(control);
    await userEvent.keyboard("typed");
    await nextTick();

    expect(control.value).toBe("");

    unmount();
  });

  it("restores multi-line text, which is what the children have to carry", async () => {
    await parkPointer();

    // The case that separates the two elements: a newline cannot live in a `value` attribute, and
    // this is the element whose reset source is text content.
    const { container, control, unmount } = render({ value: "one\ntwo", withForm: true });

    await userEvent.click(control);
    await userEvent.keyboard("abc");
    await nextTick();

    await pressRealReset(container);
    await nextTick();

    expect(control.value).toBe("one\ntwo");

    unmount();
  });

  it("reports a real keystroke to the caller", async () => {
    await parkPointer();

    const onUpdate = vi.fn();
    const { control, unmount } = render({ "onUpdate:value": onUpdate });

    await userEvent.click(control);
    await userEvent.keyboard("hi");
    await nextTick();

    expect(onUpdate.mock.calls.map(([value]) => value)).toEqual(["h", "hi"]);
    expect(control.value).toBe("hi");

    unmount();
  });

  it("dims and blocks a disabled bare control through :disabled", () => {
    const { control, unmount } = render({ disabled: true });

    expect(control.hasAttribute("data-disabled")).toBe(false);
    expect(getComputedStyle(control).pointerEvents).toBe("none");
    expect(Number(getComputedStyle(control).opacity)).toBeLessThan(1);

    unmount();
  });

  it("has no axe violations", async () => {
    const { container, unmount } = render({ placeholder: "Notes" });

    await expectNoA11yViolations(container, PALETTE_CONTRAST_DEBT);

    unmount();
  });
});
