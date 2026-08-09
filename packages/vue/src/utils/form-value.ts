/**
 * Put a value on an input as both the property and the `value` attribute.
 *
 * The attribute is the half that matters for a form reset, and the half a Vapor binding never
 * writes: binding `value` sets the property, so the element carries no `value="…"` and the browser
 * has nothing to restore from — it puts a text input back to empty and a range input back to the
 * *midpoint of its range*.
 *
 * Re-asserting a tick after the `reset` event is not enough on its own, and the reason is worth
 * writing down because it is measured rather than reasoned: when the reset comes from a real click
 * the browser drains microtasks *between* dispatching the event and restoring the controls, so a
 * `nextTick` write lands too early and is overwritten. Only a reset called from script — which is
 * what a test usually does — leaves the microtask after the restore, which is exactly the shape
 * that makes a jsdom test pass while the real thing is broken.
 *
 * Keeping the attribute in step sidesteps the ordering entirely: whenever the browser restores, it
 * restores the value the field already holds. Setting the attribute on an input the user has typed
 * into does not disturb what is on screen — the dirty value flag makes the current value
 * independent of the attribute from the first keystroke on.
 */
export const setFormValue = (input: HTMLInputElement | null, value: string): void => {
  if (!input) return;

  if (input.value !== value) input.value = value;
  input.setAttribute("value", value);
};
