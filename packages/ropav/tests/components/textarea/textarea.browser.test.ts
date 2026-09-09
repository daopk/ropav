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

  it("does not let the pointer resize it by default", () => {
    const { control, unmount } = render();

    expect(getComputedStyle(control).resize).toBe("none");

    unmount();
  });

  it("opts into vertical or both resize through the resize prop", () => {
    const vertical = render({ resize: "vertical" });

    expect(getComputedStyle(vertical.control).resize).toBe("vertical");
    vertical.unmount();

    const both = render({ resize: "both" });

    expect(getComputedStyle(both.control).resize).toBe("both");
    both.unmount();
  });

  it("grows with its content until maxRows, then scrolls", async () => {
    const { control, unmount } = render({ autosize: true, maxRows: 4, minRows: 2 });

    await nextTick();

    const empty = control.getBoundingClientRect().height;

    control.value = "line\n".repeat(12);
    control.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();

    const capped = control.getBoundingClientRect().height;

    expect(capped).toBeGreaterThan(empty);
    expect(getComputedStyle(control).overflowY).toBe("auto");

    unmount();
  });

  it("stays scrolled to the end past maxRows, so the last line keeps its padding", async () => {
    const { control, unmount } = render({ autosize: true, maxRows: 4, minRows: 2 });

    await nextTick();

    control.value = "line\n".repeat(12);
    control.selectionStart = control.selectionEnd = control.value.length;
    control.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();

    expect(control.scrollTop + control.clientHeight).toBeGreaterThanOrEqual(
      control.scrollHeight - 1,
    );

    unmount();
  });

  it("keeps growing when maxRows is unset, without a scrollbar", async () => {
    const { control, unmount } = render({ autosize: true, minRows: 2 });

    await nextTick();

    const empty = control.getBoundingClientRect().height;

    control.value = "line\n".repeat(8);
    control.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();

    expect(control.getBoundingClientRect().height).toBeGreaterThan(empty);
    expect(getComputedStyle(control).overflowY).toBe("hidden");

    unmount();
  });

  it("honours minRows on an empty control", async () => {
    const short = render({ autosize: true, minRows: 2 });
    const tall = render({ autosize: true, minRows: 6 });

    await nextTick();

    expect(tall.control.getBoundingClientRect().height).toBeGreaterThan(
      short.control.getBoundingClientRect().height,
    );

    short.unmount();
    tall.unmount();
  });
});
