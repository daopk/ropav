import { nextTick } from "vue";

/**
 * Poll a frame at a time until something is true, and say what it was if it never is.
 *
 * For anything the browser finishes on its own schedule rather than on the microtask queue. A test
 * that writes `await nextTick()` three times and then asserts is not waiting for the thing to
 * happen — it is betting that three microtask drains are enough, and a drain does not wait for a
 * frame. So whatever needs one (focus restored by a focus scope, an overlay positioned before it is
 * shown, a state that lands on the render after an animation) can be a frame away and the test will
 * arrive before it every time the machine is busy enough.
 *
 * A frame per round, and a tick after it, so the render that the frame allowed is in the DOM before
 * the predicate reads it.
 */
export const waitUntil = async (
  what: string,
  predicate: () => boolean,
  budget = 2000,
): Promise<void> => {
  const started = performance.now();

  while (performance.now() - started < budget) {
    if (predicate()) return;

    await new Promise((resolve) => requestAnimationFrame(resolve));
    await nextTick();
  }

  throw new Error(`timed out after ${budget}ms waiting for ${what}`);
};
