import {afterEach, describe, expect, it} from "vitest";
import {effectScope, nextTick, shallowRef} from "vue";

import {usePreventScroll} from "@/composables/use-prevent-scroll";

/** Run a composable in a disposable scope, mirroring a component lifetime. */
const withScope = <T>(setup: () => T): [T, () => void] => {
  const scope = effectScope();
  const result = scope.run(setup) as T;

  return [result, () => scope.stop()];
};

afterEach(() => {
  document.documentElement.style.overflow = "";
  document.documentElement.style.paddingRight = "";
});

describe("usePreventScroll", () => {
  it("blocks page scrolling", () => {
    const [, dispose] = withScope(() => usePreventScroll());

    // An overlay is positioned once, against where its trigger was; letting the page scroll
    // would leave it pointing at nothing.
    expect(document.documentElement.style.overflow).toBe("hidden");

    dispose();

    expect(document.documentElement.style.overflow).toBe("");
  });

  it("does nothing while disabled", () => {
    const [, dispose] = withScope(() => usePreventScroll({isDisabled: true}));

    expect(document.documentElement.style.overflow).toBe("");

    dispose();
  });

  it("follows the disabled flag as it changes", async () => {
    const isDisabled = shallowRef(true);
    const [, dispose] = withScope(() => usePreventScroll({isDisabled}));

    expect(document.documentElement.style.overflow).toBe("");

    isDisabled.value = false;
    await nextTick();

    expect(document.documentElement.style.overflow).toBe("hidden");

    isDisabled.value = true;
    await nextTick();

    expect(document.documentElement.style.overflow).toBe("");

    dispose();
  });

  it("keeps scrolling blocked until the last caller releases it", () => {
    const [, disposeFirst] = withScope(() => usePreventScroll());
    const [, disposeSecond] = withScope(() => usePreventScroll());

    disposeSecond();

    // Two overlays can be open at once, and the page has one scroll position between them.
    expect(document.documentElement.style.overflow).toBe("hidden");

    disposeFirst();

    expect(document.documentElement.style.overflow).toBe("");
  });

  it("restores whatever the page had set itself", () => {
    document.documentElement.style.overflow = "scroll";

    const [, dispose] = withScope(() => usePreventScroll());

    expect(document.documentElement.style.overflow).toBe("hidden");

    dispose();

    expect(document.documentElement.style.overflow).toBe("scroll");
  });
});
