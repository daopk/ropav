import {describe, expect, it} from "vitest";

import {dataAttr} from "@/utils/assertion";

describe("dataAttr", () => {
  it('renders true as the string "true"', () => {
    expect(dataAttr(true)).toBe("true");
  });

  it("omits the attribute for every falsy input", () => {
    expect(dataAttr(false)).toBeUndefined();
    expect(dataAttr(undefined)).toBeUndefined();
  });
});
