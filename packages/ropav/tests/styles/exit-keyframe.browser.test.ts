import { describe, expect, it } from "vitest";

import { componentCases } from "./golden/cases";
import { renderAll } from "./golden/render";

/**
 * The half of the pair the golden cannot see.
 *
 * `rp-exit` states only a `to` and lets the element's resting style be the `from`, which is what
 * lets one keyframe close every overlay without knowing what any of them looks like open. The
 * cost is that at time zero it computes to that resting style — and time zero is where the golden
 * pauses everything, because an animation in flight reports a different value on every run.
 *
 * So a misspelt keyframe name, or one reading a slot no call site writes, would sit in the middle
 * of the golden looking exactly like a keyframe that works. Read the resolved frames off the
 * animations instead, and hold the end state against the slots the element is actually carrying.
 */

describe("rp-exit", () => {
  it("ends where each call site's slots say it should", () => {
    const { host, rendered } = renderAll(componentCases(document.styleSheets), ["light"], document);

    const slot = (element: Element, name: string) =>
      getComputedStyle(element).getPropertyValue(name).trim() || "1";

    const inert: string[] = [];
    const mismatched: string[] = [];
    let ran = 0;

    for (const [id, entry] of rendered.get("light")!) {
      for (const animation of entry.target.getAnimations()) {
        if ((animation as CSSAnimation).animationName !== "rp-exit") continue;

        const end = (animation.effect as KeyframeEffect | null)?.getKeyframes().at(-1);
        const opacity = slot(entry.target, "--rp-exit-opacity");
        const scale = slot(entry.target, "--rp-exit-scale");

        ran++;

        // Every slot still at its initial value is a call site that asked for nothing, not a
        // keyframe that resolved to nothing — there is no failure to tell apart there.
        if (opacity === "1" && scale === "1") continue;

        if (!end || (end["opacity"] === undefined && end["transform"] === undefined)) {
          inert.push(id);
          continue;
        }

        if (String(end["opacity"]) !== opacity) {
          mismatched.push(`${id} | opacity ${String(end["opacity"])} is not the slot's ${opacity}`);
        }

        const scaled = `scale3d(${scale}, ${scale}, ${scale})`;

        // Only the scale, because no component slides on the way out and a translate of zero
        // serialises differently from the `0` the registration holds.
        if (scale !== "1" && !String(end["transform"]).includes(scaled)) {
          mismatched.push(`${id} | transform ${String(end["transform"])} does not ${scaled}`);
        }
      }
    }

    host.remove();

    expect({ inert, mismatched, ran: ran > 0 }).toEqual({
      inert: [],
      mismatched: [],
      ran: true,
    });
  });
});
