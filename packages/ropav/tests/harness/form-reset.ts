import { expect } from "vitest";

/**
 * Assert that a control carries the half a form reset restores from.
 *
 * Thin on purpose — the value is the name and this comment, not the assertion.
 *
 * The reason this exists rather than a test that resets and checks the value: **no jsdom test can
 * check the value**. jsdom restores the controls synchronously inside the dispatch, so a post-flush
 * write mirroring the state always lands afterwards and covers the gap — measured, and it holds
 * even when the test clicks a real `<button type="reset">`. A real browser drains microtasks
 * between dispatching `reset` and restoring the controls, which is the ordering that breaks, and
 * the only one a `*.browser.test.ts` can reproduce.
 *
 * So: assert the source here, and spend a browser test only where the mechanism is new.
 */
export const expectResetSource = (
  control: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): void => {
  expect(control.defaultValue).toBe(value);

  // An input's default reflects the `value` attribute; a textarea keeps it in its children, and
  // has no such attribute at all. Both are asserted, because the two mechanisms are different
  // enough that one passing says nothing about the other.
  if (control instanceof HTMLTextAreaElement) expect(control.textContent).toBe(value);
  else expect(control.getAttribute("value")).toBe(value);
};

/** The `checked` counterpart. See {@link expectResetSource}. */
export const expectCheckedResetSource = (input: HTMLInputElement, checked: boolean): void => {
  expect(input.defaultChecked).toBe(checked);
  expect(input.hasAttribute("checked")).toBe(checked);
};

/**
 * Assert that exactly one radio in a group carries the checked default, and that it is the right
 * one. The group is the claim: the browser restores each radio independently from its own default,
 * so "one of them" is the part that has to hold.
 */
export const expectRadioGroupResetSource = (
  radios: HTMLInputElement[],
  value: string | null,
): void => {
  expect(radios.filter((radio) => radio.defaultChecked).map((radio) => radio.value)).toEqual(
    value === null ? [] : [value],
  );
};
