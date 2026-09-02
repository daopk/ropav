import { afterEach, describe, expect, it, vi } from "vitest";
import { shallowRef } from "vue";

import { useSidebarState } from "@/components/sidebar/sidebar.state";

import { withScope } from "../../harness/scope";

const disposers: (() => void)[] = [];

afterEach(() => {
  disposers.splice(0).forEach((dispose) => dispose());
});

const setUp = (options: Partial<Parameters<typeof useSidebarState>[0]> = {}) => {
  const [state, dispose] = withScope(() =>
    useSidebarState({
      collapsible: undefined,
      isExpanded: undefined,
      isMobile: undefined,
      isMobileOpen: undefined,
      width: undefined,
      ...options,
    }),
  );

  disposers.push(dispose);

  return state;
};

describe("defaults", () => {
  it("starts expanded, on the icon mode", () => {
    const state = setUp();

    expect(state.collapsible.value).toBe("icon");
    expect(state.isExpanded.value).toBe(true);
    expect(state.isOpen.value).toBe(true);
    expect(state.isCollapsed.value).toBe(false);
  });

  it("has no width until one is set, so the stylesheet decides", () => {
    const state = setUp();

    expect(state.width.value).toBeUndefined();

    state.setWidth("20rem");

    expect(state.width.value).toBe("20rem");
  });
});

describe("collapsing", () => {
  it("reports a collapsed panel once it is closed", () => {
    const state = setUp();

    state.close();

    expect(state.isExpanded.value).toBe(false);
    expect(state.isCollapsed.value).toBe(true);
  });

  /*
   * The distinction the parts read: collapsed means narrowed, so a label drops to `sr-only`. A
   * drawer is open or it is gone, and a shut one has no labels left to shorten.
   */
  it("never reports collapsed on a narrow viewport", () => {
    const state = setUp({ isMobile: true });

    state.close();

    expect(state.isOpen.value).toBe(false);
    expect(state.isCollapsed.value).toBe(false);
  });

  it("stays expanded when it cannot collapse", () => {
    const state = setUp({ collapsible: "none" });

    state.close();
    state.toggle();

    expect(state.isExpanded.value).toBe(true);
    expect(state.isCollapsed.value).toBe(false);
  });

  // `collapsible: "none"` is a claim about the sidebar, not about this render — a controlled flag
  // saying otherwise is a contradiction rather than a state to honour.
  it("stays expanded when it cannot collapse, even if told otherwise", () => {
    const state = setUp({ collapsible: "none", isExpanded: false });

    expect(state.isExpanded.value).toBe(true);
  });
});

describe("the two widths", () => {
  it("keeps the desktop and drawer states apart", () => {
    const isMobile = shallowRef(false);
    const state = setUp({ isMobile });

    state.close();
    expect(state.isCollapsed.value).toBe(true);

    // Narrowed while collapsed: the drawer starts shut rather than inheriting a collapsed panel.
    isMobile.value = true;
    expect(state.isOpen.value).toBe(false);

    state.open();
    expect(state.isMobileOpen.value).toBe(true);

    // Widened again, the sidebar is where it was left, not where the drawer was put.
    isMobile.value = false;
    expect(state.isOpen.value).toBe(false);
    expect(state.isCollapsed.value).toBe(true);
  });

  it("toggles whichever state is in charge at this width", () => {
    const isMobile = shallowRef(true);
    const state = setUp({ isMobile });

    state.toggle();

    expect(state.isMobileOpen.value).toBe(true);
    expect(state.isExpanded.value).toBe(true);

    isMobile.value = false;
    state.toggle();

    expect(state.isExpanded.value).toBe(false);
    expect(state.isMobileOpen.value).toBe(true);
  });
});

describe("controlled mode", () => {
  it("never writes its own expanded state", () => {
    const onExpandedChange = vi.fn();
    const state = setUp({ isExpanded: true, onExpandedChange });

    state.close();

    expect(onExpandedChange).toHaveBeenCalledWith(false);
    expect(state.isExpanded.value).toBe(true);
  });

  it("never writes its own drawer state", () => {
    const onMobileOpenChange = vi.fn();
    const state = setUp({ isMobile: true, isMobileOpen: false, onMobileOpenChange });

    state.open();

    expect(onMobileOpenChange).toHaveBeenCalledWith(true);
    expect(state.isMobileOpen.value).toBe(false);
  });

  it("reports a width change without keeping it", () => {
    const onWidthChange = vi.fn();
    const state = setUp({ onWidthChange, width: "16rem" });

    state.setWidth("20rem");

    expect(onWidthChange).toHaveBeenCalledWith("20rem");
    expect(state.width.value).toBe("16rem");
  });

  it("reports a change only when there is one", () => {
    const onExpandedChange = vi.fn();
    const state = setUp({ onExpandedChange });

    state.open();
    expect(onExpandedChange).not.toHaveBeenCalled();

    state.close();
    expect(onExpandedChange).toHaveBeenCalledTimes(1);
  });
});
