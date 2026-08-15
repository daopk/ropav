/**
 * Put a value on a form control as both the live property and the default a reset restores from.
 *
 * The default is the half that matters for a form reset, and the half a Vapor binding never
 * writes: binding `value` sets the property, so the element carries no reset source at all and the
 * browser has nothing to restore from — it puts a text input back to empty and a range input back
 * to the *midpoint of its range*.
 *
 * Re-asserting a tick after the `reset` event is not enough on its own, and the reason is worth
 * writing down because it is measured rather than reasoned: when the reset comes from a real click
 * the browser drains microtasks *between* dispatching the event and restoring the controls, so a
 * `nextTick` write lands too early and is overwritten. Only a reset called from script — which is
 * what a test usually does — leaves the microtask after the restore, which is exactly the shape
 * that makes a jsdom test pass while the real thing is broken.
 *
 * Keeping the default in step sidesteps the ordering entirely: whenever the browser restores, it
 * restores the value the field already holds. Writing both halves in one call is what makes it
 * ordering-independent in *either* direction — called from a post-flush watcher the default is in
 * place before a browser-initiated restore reads it, and were the two ever to run the other way
 * round the property write in the same call is the one that lands. Which is the argument for
 * putting this in a watcher rather than in a `reset` listener: a listener only ever gets one of
 * the two orders, and it is the losing one.
 *
 * `defaultValue` rather than `setAttribute("value", …)`, because the two elements keep their reset
 * source in different places: an `<input>`'s is the `value` attribute, a `<textarea>`'s is its
 * child text content, and there is no attribute for the second. `defaultValue` is the one IDL that
 * writes the right half of either, and on an input it still reflects — `getAttribute("value")`
 * reads back what was written. Measured, including on a control the user has already typed into:
 * the dirty value flag makes the current value independent of the default from the first keystroke
 * on, so neither half disturbs what is on screen.
 *
 * One thing to keep true: every attribute bag that reaches a control this is called for has to
 * carry `value` unconditionally. A key that *leaves* a Vapor bag arrives as `null`, and Vapor
 * answers a null `value` with `removeAttribute("value")` — which would wipe the default written
 * here. No bag in the package drops it today.
 */
export const setFormValue = (
  control: HTMLInputElement | HTMLTextAreaElement | null | undefined,
  value: string,
): void => {
  if (!control) return;

  if (control.value !== value) control.value = value;
  if (control.defaultValue !== value) control.defaultValue = value;
};

/**
 * Put a checkbox or radio's state on both halves: the live `checked` property, and the
 * `defaultChecked` that reflects the `checked` attribute.
 *
 * `checked` reflects nothing, so a binding leaves no mark on the element at all — a control the
 * user has toggled has no reset source, and a browser-initiated reset puts it back to *unchecked*
 * while the state still says selected. The form then submits nothing for a box the user can see is
 * ticked. `defaultChecked` is the only way to reach the attribute that does not disturb what is on
 * screen: the dirty checkedness flag makes the two independent from the first toggle on.
 *
 * On a radio the group comes free. Checking one radio unchecks the rest sharing its name, but the
 * default half needs no walk at all — every radio in the group mirrors the same selected value, so
 * each one settles its own default in the same flush, and exactly one of them ends up true.
 *
 * The ordering argument is the same as {@link setFormValue}'s, and so is the conclusion: call this
 * from a post-flush watcher, not from a `reset` listener.
 */
export const setFormChecked = (
  input: HTMLInputElement | null | undefined,
  checked: boolean,
): void => {
  if (!input) return;

  if (input.checked !== checked) input.checked = checked;
  if (input.defaultChecked !== checked) input.defaultChecked = checked;
};
