import {afterEach, describe, expect, it} from "vitest";
import {effectScope, shallowRef} from "vue";

import {clearCssVariableCache, useCssVariable} from "@/composables/use-css-variable";

/** Read outside a component: nothing here depends on an instance. */
const read = <T>(body: () => T): {value: T; stop: () => void} => {
  const scope = effectScope();
  const value = scope.run(body)!;

  return {stop: () => scope.stop(), value};
};

const setProperty = (name: string, value: string | null) => {
  if (value === null) document.documentElement.style.removeProperty(name);
  else document.documentElement.style.setProperty(name, value);
};

describe("useCssVariable", () => {
  afterEach(() => {
    setProperty("--test-delay", null);
    setProperty("--test-other", null);
    clearCssVariableCache();
  });

  it("reads a custom property off the document root", () => {
    setProperty("--test-delay", "1500ms");

    const {stop, value} = read(() => useCssVariable("--test-delay"));

    expect(value.value).toBe("1500ms");

    stop();
  });

  it("reports nothing for a property that is not declared", () => {
    const {stop, value} = read(() => useCssVariable("--test-delay"));

    // Absent rather than the empty string `getPropertyValue` returns, so the caller falls back to
    // its own default instead of parsing a blank.
    expect(value.value).toBeUndefined();

    stop();
  });

  it("prefers an override over the property", () => {
    setProperty("--test-delay", "1500ms");

    const {stop, value} = read(() => useCssVariable("--test-delay", {override: () => "200ms"}));

    expect(value.value).toBe("200ms");

    stop();
  });

  it("follows a reactive override", () => {
    setProperty("--test-delay", "1500ms");

    const override = shallowRef<string | undefined>("0ms");
    const {stop, value} = read(() => useCssVariable("--test-delay", {override}));

    expect(value.value).toBe("0ms");

    override.value = undefined;

    // Falls back to the property rather than staying at the last override.
    expect(value.value).toBe("1500ms");

    stop();
  });

  it("reads a property once and reuses the answer", () => {
    setProperty("--test-delay", "1500ms");

    const first = read(() => useCssVariable("--test-delay"));

    expect(first.value.value).toBe("1500ms");

    setProperty("--test-delay", "9000ms");

    const second = read(() => useCssVariable("--test-delay"));

    // A theme constant, read as a layout measurement — so it is cached across consumers rather
    // than re-measured by every tooltip on the page.
    expect(second.value.value).toBe("1500ms");

    first.stop();
    second.stop();
  });

  it("re-reads a property when caching is off", () => {
    setProperty("--test-delay", "1500ms");

    const first = read(() => useCssVariable("--test-delay", {cache: false}));

    expect(first.value.value).toBe("1500ms");

    setProperty("--test-delay", "9000ms");

    const second = read(() => useCssVariable("--test-delay", {cache: false}));

    expect(second.value.value).toBe("9000ms");

    first.stop();
    second.stop();
  });

  it("caches each property separately", () => {
    setProperty("--test-delay", "1500ms");
    setProperty("--test-other", "500ms");

    const {stop, value} = read(() => ({
      delay: useCssVariable("--test-delay"),
      other: useCssVariable("--test-other"),
    }));

    expect(value.delay.value).toBe("1500ms");
    expect(value.other.value).toBe("500ms");

    stop();
  });
});
