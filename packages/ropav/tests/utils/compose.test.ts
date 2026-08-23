import {describe, expect, it} from "vitest";

import {composeSlotClassName} from "@/utils/compose";

describe("composeSlotClassName", () => {
  it("passes the slot function both the class and the variants", () => {
    const slot = (args?: {class?: string; [key: string]: any}) =>
      `slot ${args?.["color"]} ${args?.class}`;

    expect(composeSlotClassName(slot, "extra", {color: "danger"})).toBe("slot danger extra");
  });

  it("returns the class untouched when there is no slot function", () => {
    expect(composeSlotClassName(undefined, "extra")).toBe("extra");
    expect(composeSlotClassName(undefined)).toBeUndefined();
  });
});
