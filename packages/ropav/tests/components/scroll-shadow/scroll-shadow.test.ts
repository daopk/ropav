import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import Fixture from "./fixtures.vue";

const setGeometry = (
  element: HTMLElement,
  values: Partial<Record<"clientHeight" | "clientWidth" | "scrollHeight" | "scrollWidth", number>>,
) => {
  for (const [property, value] of Object.entries(values)) {
    Object.defineProperty(element, property, { configurable: true, value });
  }
};

const renderScrollShadow = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });
  const root = result.container.querySelector<HTMLElement>("[data-slot='scroll-shadow']")!;

  return { ...result, root };
};

describe("ScrollShadow", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);

      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => vi.unstubAllGlobals());

  it("renders content, the BEM block, slot, and defaults", () => {
    const { root, unmount } = renderScrollShadow();

    expect(root).toHaveTextContent("Scrollable content");
    expect(root).toHaveAttribute("data-slot", "scroll-shadow");
    expect(root).toHaveAttribute("data-orientation", "vertical");
    expect(root).toHaveAttribute("data-scroll-shadow-size", "40");
    expect(root).toHaveClass("scroll-shadow", "scroll-shadow--vertical", "scroll-shadow--fade");
    expect(root.style.getPropertyValue("--scroll-shadow-size")).toBe("40px");

    unmount();
  });

  it("applies horizontal orientation and the hidden scrollbar modifier", () => {
    const { root, unmount } = renderScrollShadow({
      hideScrollBar: true,
      orientation: "horizontal",
    });

    expect(root).toHaveAttribute("data-orientation", "horizontal");
    expect(root).toHaveClass("scroll-shadow--horizontal", "scroll-shadow--hide-scrollbar");
    expect(root).not.toHaveClass("scroll-shadow--vertical");

    unmount();
  });

  it("merges caller class, style, and arbitrary attributes", () => {
    const { root, unmount } = renderScrollShadow({
      class: "p-4",
      size: 24,
      style: { maxHeight: "200px" },
    });

    expect(root).toHaveClass("scroll-shadow", "p-4");
    expect(root).toHaveAttribute("data-foo", "bar");
    expect(root.style.maxHeight).toBe("200px");
    expect(root.style.getPropertyValue("--scroll-shadow-size")).toBe("24px");

    unmount();
  });

  it.each([
    ["both", "data-top-bottom-scroll"],
    ["top", "data-top-scroll"],
    ["bottom", "data-bottom-scroll"],
    ["none", undefined],
  ] as const)("renders controlled vertical visibility %s", async (visibility, attribute) => {
    const { root, unmount } = renderScrollShadow({ visibility });

    await nextTick();

    if (attribute) expect(root).toHaveAttribute(attribute, "true");
    else {
      expect(root).not.toHaveAttribute("data-top-scroll");
      expect(root).not.toHaveAttribute("data-bottom-scroll");
      expect(root).not.toHaveAttribute("data-top-bottom-scroll");
    }

    unmount();
  });

  it("maps controlled both visibility to the horizontal axis", async () => {
    const { root, unmount } = renderScrollShadow({ orientation: "horizontal", visibility: "both" });

    await nextTick();

    expect(root).toHaveAttribute("data-left-right-scroll", "true");
    expect(root).not.toHaveAttribute("data-top-bottom-scroll");

    unmount();
  });

  it("clears stale controlled attributes when visibility changes", async () => {
    const props = reactive({ visibility: "top" as "none" | "top" });
    const { root, unmount } = renderScrollShadow(props);

    await nextTick();
    expect(root).toHaveAttribute("data-top-scroll", "true");

    props.visibility = "none";
    await nextTick();

    expect(root).not.toHaveAttribute("data-top-scroll");

    unmount();
  });

  it("replaces controlled visibility when switching back to automatic detection", async () => {
    const onVisibilityChange = vi.fn();
    const props = reactive({ onVisibilityChange, visibility: "top" as "auto" | "top" });
    const { root, unmount } = renderScrollShadow(props);

    setGeometry(root, { clientHeight: 100, scrollHeight: 300 });
    await nextTick();
    expect(root).toHaveAttribute("data-top-scroll", "true");

    props.visibility = "auto";
    await nextTick();
    root.dispatchEvent(new Event("scroll"));

    expect(root).toHaveAttribute("data-top-scroll", "false");
    expect(root).toHaveAttribute("data-bottom-scroll", "true");
    expect(onVisibilityChange).toHaveBeenLastCalledWith("bottom");

    unmount();
  });

  it("detects vertical overflow and reports visibility transitions", async () => {
    const onVisibilityChange = vi.fn();
    const { root, unmount } = renderScrollShadow({ onVisibilityChange });

    setGeometry(root, { clientHeight: 100, scrollHeight: 300 });
    await nextTick();
    root.dispatchEvent(new Event("scroll"));

    expect(root).toHaveAttribute("data-top-scroll", "false");
    expect(root).toHaveAttribute("data-bottom-scroll", "true");
    expect(onVisibilityChange).toHaveBeenLastCalledWith("bottom");

    root.scrollTop = 100;
    root.dispatchEvent(new Event("scroll"));

    expect(root).toHaveAttribute("data-top-bottom-scroll", "true");
    expect(root).not.toHaveAttribute("data-top-scroll");
    expect(root).not.toHaveAttribute("data-bottom-scroll");
    expect(onVisibilityChange).toHaveBeenLastCalledWith("both");

    root.scrollTop = 200;
    root.dispatchEvent(new Event("scroll"));

    expect(root).toHaveAttribute("data-top-scroll", "true");
    expect(root).toHaveAttribute("data-bottom-scroll", "false");
    expect(onVisibilityChange).toHaveBeenLastCalledWith("top");

    unmount();
  });

  it("detects horizontal overflow using the absolute scroll offset", async () => {
    const onVisibilityChange = vi.fn();
    const { root, unmount } = renderScrollShadow({ onVisibilityChange, orientation: "horizontal" });

    setGeometry(root, { clientWidth: 100, scrollWidth: 300 });
    await nextTick();
    root.dispatchEvent(new Event("scroll"));

    expect(root).toHaveAttribute("data-left-scroll", "false");
    expect(root).toHaveAttribute("data-right-scroll", "true");

    root.scrollLeft = -100;
    root.dispatchEvent(new Event("scroll"));

    expect(root).toHaveAttribute("data-left-right-scroll", "true");
    expect(onVisibilityChange).toHaveBeenLastCalledWith("both");

    unmount();
  });

  it("honours the visibility offset", async () => {
    const { root, unmount } = renderScrollShadow({ offset: 10 });

    setGeometry(root, { clientHeight: 100, scrollHeight: 120 });
    root.scrollTop = 10;
    await nextTick();
    root.dispatchEvent(new Event("scroll"));

    expect(root).toHaveAttribute("data-top-scroll", "false");
    expect(root).toHaveAttribute("data-bottom-scroll", "false");

    unmount();
  });

  it("does not install automatic state when detection is disabled", async () => {
    const onVisibilityChange = vi.fn();
    const { root, unmount } = renderScrollShadow({ isEnabled: false, onVisibilityChange });

    setGeometry(root, { clientHeight: 100, scrollHeight: 300 });
    await nextTick();
    root.dispatchEvent(new Event("scroll"));

    expect(root).not.toHaveAttribute("data-bottom-scroll");
    expect(onVisibilityChange).not.toHaveBeenCalled();

    unmount();
  });

  it("does not report the same measured state twice", async () => {
    const onVisibilityChange = vi.fn();
    const { root, unmount } = renderScrollShadow({ onVisibilityChange });

    setGeometry(root, { clientHeight: 100, scrollHeight: 300 });
    await nextTick();
    onVisibilityChange.mockClear();

    root.dispatchEvent(new Event("scroll"));
    root.dispatchEvent(new Event("scroll"));

    expect(onVisibilityChange).not.toHaveBeenCalled();

    unmount();
  });
});
