import { userEvent } from "vitest/browser";

/**
 * Click a real `<button type="reset">` and let the restore settle.
 *
 * Browser-only, and the separate module is the point: a jsdom suite that imported `vitest/browser`
 * would not start.
 *
 * This exists because `form.reset()` from script — and, measured, a jsdom test clicking this very
 * button — proves nothing about the class of bug it is used for. jsdom restores the controls
 * synchronously inside the dispatch, so a post-flush write mirroring the state always lands
 * afterwards and covers the gap. A real browser drains microtasks *between* dispatching `reset` and
 * restoring the controls, which puts the restore first and is the only ordering that fails. Two
 * ticks after the click, because the state moves on one and the render follows on the next.
 */
export const pressRealReset = async (container: HTMLElement, testId = "reset"): Promise<void> => {
  const button = container.querySelector<HTMLElement>(`[data-testid='${testId}']`);

  if (!button) throw new Error(`no reset button at [data-testid='${testId}']`);

  await userEvent.click(button);
};
