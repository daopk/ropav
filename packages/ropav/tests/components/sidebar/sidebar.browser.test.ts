import { expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";

import { parkPointer } from "../../harness/park-pointer";
import { settled } from "../../harness/settle";
import { waitUntil } from "../../harness/wait-until";

import Fixture from "./fixtures.vue";

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

const slots = (container: HTMLElement, name: string) =>
  Array.from(container.querySelectorAll<HTMLElement>(`[data-slot='${name}']`));

const POINTER = { bubbles: true, button: 0, pointerId: 1, pointerType: "mouse" } as const;

/*
 * The browser project runs in a narrow frame, well under the breakpoint the sidebar defaults to —
 * so left alone every fixture here would become a drawer and there would be no panel beside an
 * inset to resize. Each case says which layout it is exercising instead of depending on the frame.
 */
const WIDE = "(max-width: 0px)";
const NARROW = "(min-width: 0px)";

const centreOf = (element: HTMLElement) => {
  const box = element.getBoundingClientRect();

  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
};

/**
 * A drag on the rail, moved on `window` rather than on the rail itself.
 *
 * That is where `useMove` listens, because a drag keeps going once the pointer leaves the element
 * it started on — which is exactly what a resize does the moment the edge moves out from under it.
 */
const drag = async (rail: HTMLElement, by: number) => {
  const from = centreOf(rail);

  rail.dispatchEvent(
    new PointerEvent("pointerdown", { ...POINTER, clientX: from.x, clientY: from.y }),
  );
  await nextTick();

  window.dispatchEvent(
    new PointerEvent("pointermove", { ...POINTER, clientX: from.x + by, clientY: from.y }),
  );
  await nextTick();

  window.dispatchEvent(
    new PointerEvent("pointerup", { ...POINTER, clientX: from.x + by, clientY: from.y }),
  );
  await nextTick();
};

const widthOf = (container: HTMLElement) =>
  slot(container, "sidebar-panel").getBoundingClientRect().width;

/*
 * Unmounted rather than swept out of the DOM, and the page being shared by every browser test in
 * the run is why it matters. A drawer portals its backdrop to the body and locks the page behind
 * it; removing the elements leaves that lock in place, with nothing left to run the cleanup that
 * lifts it, and the next test's `parkPointer` then waits out its whole timeout trying to hover
 * through a body that no longer takes pointer events.
 */
const mounted: { unmount: () => void }[] = [];

const mount = (props: Record<string, unknown>) => {
  const view = renderVapor(Fixture, { props });

  mounted.push(view);

  return view;
};

afterEach(() => {
  mounted.splice(0).forEach((view) => view.unmount());
});

describe("resizing", () => {
  it("follows the drag and reports where the edge ended up", async () => {
    await parkPointer();

    const { container } = mount({
      breakpoint: WIDE,
      defaultWidth: "256px",
      isResizable: true,
      maxWidth: 400,
      minWidth: 180,
    });

    await settled(slot(container, "sidebar-panel"));

    const rail = slot(container, "sidebar-rail");

    await drag(rail, 60);
    await settled(slot(container, "sidebar-panel"));

    expect(widthOf(container)).toBe(316);
    expect(rail.getAttribute("aria-valuenow")).toBe("316");
  });

  /*
   * A width the rail cannot read off the declaration — `rem` here, and nothing at all is the same
   * case — so the only number available is a measurement of the panel. Taken during setup that
   * measurement is zero, because the tree is still being built and an element outside the document
   * has no width; the first drag then starts from nothing and snaps the panel to its minimum,
   * where the pointer has to travel the whole width back before the edge moves again.
   */
  it("knows how wide the panel is before anything is declared in pixels", async () => {
    await parkPointer();

    const { container } = mount({ breakpoint: WIDE, defaultWidth: "18rem", isResizable: true });

    await settled(slot(container, "sidebar-panel"));

    expect(slot(container, "sidebar-rail").getAttribute("aria-valuenow")).toBe(
      String(Math.round(widthOf(container))),
    );
  });

  it("starts the first drag from the width on screen, not from nothing", async () => {
    await parkPointer();

    const { container } = mount({
      breakpoint: WIDE,
      defaultWidth: "18rem",
      isResizable: true,
      maxWidth: 400,
      minWidth: 200,
    });

    await settled(slot(container, "sidebar-panel"));

    const before = widthOf(container);

    await drag(slot(container, "sidebar-rail"), 40);
    await settled(slot(container, "sidebar-panel"));

    expect(widthOf(container)).toBe(before + 40);
  });

  it("clamps at both ends rather than snapping shut", async () => {
    await parkPointer();

    const { container } = mount({
      breakpoint: WIDE,
      defaultWidth: "256px",
      isResizable: true,
      maxWidth: 400,
      minWidth: 180,
    });

    await settled(slot(container, "sidebar-panel"));

    await drag(slot(container, "sidebar-rail"), -600);
    await settled(slot(container, "sidebar-panel"));

    expect(widthOf(container)).toBe(180);
    // The rail toggles on a click, so a drag that also collapsed would make the narrow end of the
    // track behave like a different control.
    expect(slot(container, "sidebar").hasAttribute("data-collapsed")).toBe(false);

    await drag(slot(container, "sidebar-rail"), 600);
    await settled(slot(container, "sidebar-panel"));

    expect(widthOf(container)).toBe(400);
  });

  /* A drag that happens to end where it started is still a drag, and collapsing the panel under
   * it would be a surprise. */
  it("toggles on a click that did not travel, and not on one that did", async () => {
    await parkPointer();

    const { container } = mount({ breakpoint: WIDE, defaultWidth: "256px", isResizable: true });

    await settled(slot(container, "sidebar-panel"));

    const rail = slot(container, "sidebar-rail");

    await drag(rail, 40);
    rail.click();
    await nextTick();

    expect(slot(container, "sidebar").hasAttribute("data-collapsed")).toBe(false);

    rail.dispatchEvent(new PointerEvent("pointerdown", { ...POINTER, ...centreOf(rail) }));
    window.dispatchEvent(new PointerEvent("pointerup", { ...POINTER }));
    await nextTick();
    rail.click();
    await nextTick();

    expect(slot(container, "sidebar").getAttribute("data-collapsed")).toBe("true");
  });
});

describe("collapsed to the rail", () => {
  it("keeps every item reachable and named", async () => {
    await parkPointer();

    const { container } = mount({ breakpoint: WIDE, defaultExpanded: false });

    await settled(slot(container, "sidebar-panel"));

    const [home, inbox] = slots(container, "sidebar-item");

    expect(slot(container, "sidebar-panel").hasAttribute("inert")).toBe(false);

    // The label is out of sight, not out of the tree — which is what still names the item.
    home!.focus();
    expect(document.activeElement).toBe(home);
    expect(home!.textContent).toContain("Home");

    inbox!.focus();
    expect(document.activeElement).toBe(inbox);
  });

  it("puts the labels out of sight without taking their space back twice", async () => {
    await parkPointer();

    const { container } = mount({ breakpoint: WIDE, defaultExpanded: false });

    await settled(slot(container, "sidebar-panel"));

    const label = slots(container, "sidebar-item-label")[0]!;
    const trailing = slot(container, "sidebar-item-trailing");

    expect(getComputedStyle(label).position).toBe("absolute");
    expect(getComputedStyle(trailing).display).toBe("none");
  });

  it("hides everything inside once it collapses out of view", async () => {
    await parkPointer();

    const { container } = mount({
      breakpoint: WIDE,
      collapsible: "offcanvas",
      defaultExpanded: false,
    });

    await settled(slot(container, "sidebar-panel"));

    const panel = slot(container, "sidebar-panel");

    expect(panel.hasAttribute("inert")).toBe(true);
    expect(panel.getBoundingClientRect().width).toBe(0);
  });
});

describe("accessibility", () => {
  it("has no violations expanded", async () => {
    await parkPointer();

    const { container } = mount({ breakpoint: WIDE, isResizable: true });

    await settled(slot(container, "sidebar-panel"));
    await expectNoA11yViolations(container);
  });

  it("has no violations collapsed to the rail", async () => {
    await parkPointer();

    const { container } = mount({ breakpoint: WIDE, defaultExpanded: false });

    await settled(slot(container, "sidebar-panel"));
    await expectNoA11yViolations(container);
  });
});

describe("a narrow viewport", () => {
  it("opens the panel in a drawer, with focus inside it", async () => {
    await parkPointer();

    const { container } = mount({ breakpoint: NARROW, defaultMobileOpen: true });

    // The switch waits for mount whatever the viewport says, so the drawer is a tick away.
    await nextTick();

    const dialog = document.body.querySelector<HTMLElement>("[data-slot='drawer-dialog']")!;

    await settled(dialog);

    expect(dialog.contains(slot(document.body, "sidebar-panel"))).toBe(true);
    expect(dialog.contains(document.activeElement)).toBe(true);
    // Nothing beside the panel for a rail to divide.
    expect(container.querySelector("[data-slot='sidebar-rail']")).toBeNull();
  });

  it("has no violations while the drawer is open", async () => {
    await parkPointer();

    mount({ breakpoint: NARROW, defaultMobileOpen: true });

    await nextTick();

    const dialog = document.body.querySelector<HTMLElement>("[data-slot='drawer-dialog']")!;

    await settled(dialog);
    await expectNoA11yViolations(dialog);
  });
});

describe("tooltips", () => {
  /**
   * Hovered the way a pointer arrives, and waited out rather than stepped through.
   *
   * The delay is the theme's, so this asks the tooltip whether it opened at all rather than when —
   * the wait is generous on purpose, because a test that raced the delay would pass or fail on how
   * loaded the machine was.
   */
  const hoverAndWait = async (element: HTMLElement) => {
    element.dispatchEvent(
      new PointerEvent("pointerenter", { bubbles: false, pointerType: "mouse" }),
    );
    await new Promise((resolve) => setTimeout(resolve, 2200));

    return document.body.querySelector<HTMLElement>(".tooltip");
  };

  it("says the label on the rail, on the side away from the panel", async () => {
    await parkPointer();

    const { container } = mount({ breakpoint: WIDE, defaultExpanded: false, withTooltips: true });

    await settled(slot(container, "sidebar-panel"));

    const tip = await hoverAndWait(slot(container, "tooltip-trigger"));

    expect(tip).not.toBeNull();
    expect(tip!.textContent!.trim()).toBe("Home");
    // `end` resolved against a left-hand sidebar in a left-to-right page.
    expect(tip!.getAttribute("data-placement")).toBe("right");
  });

  it("mirrors to the other side for a sidebar on the trailing edge", async () => {
    await parkPointer();

    const { container } = mount({
      breakpoint: WIDE,
      defaultExpanded: false,
      side: "right",
      withTooltips: true,
    });

    await settled(slot(container, "sidebar-panel"));

    const tip = await hoverAndWait(slot(container, "tooltip-trigger"));

    expect(tip!.getAttribute("data-placement")).toBe("left");
  });

  /* The label is on screen already, and a tooltip repeating the word beside the pointer is noise. */
  it("stays quiet while the label is on screen", async () => {
    await parkPointer();

    const { container } = mount({ breakpoint: WIDE, withTooltips: true });

    await settled(slot(container, "sidebar-panel"));

    expect(await hoverAndWait(slot(container, "tooltip-trigger"))).toBeNull();
  });

  /* A drawer shows every label, so there is nothing for a tooltip to fill in there either. */
  it("stays quiet inside the drawer", async () => {
    await parkPointer();

    mount({ breakpoint: NARROW, defaultMobileOpen: true, withTooltips: true });

    await nextTick();

    const dialog = document.body.querySelector<HTMLElement>("[data-slot='drawer-dialog']")!;

    await settled(dialog);

    expect(await hoverAndWait(slot(dialog, "tooltip-trigger"))).toBeNull();
  });

  /* An item is a full-width row; the tooltip's own trigger is `inline-block` and would shrink it. */
  it("does not change the row it wraps", async () => {
    await parkPointer();

    const plain = mount({ breakpoint: WIDE });

    await settled(slot(plain.container, "sidebar-panel"));

    const width = slot(plain.container, "sidebar-item").getBoundingClientRect().width;

    const wrapped = mount({ breakpoint: WIDE, withTooltips: true });

    await settled(slot(wrapped.container, "sidebar-panel"));

    expect(slot(wrapped.container, "sidebar-item").getBoundingClientRect().width).toBe(width);
    // The item inside is focusable already, so the wrapper adds no second interactive element.
    expect(slot(wrapped.container, "tooltip-trigger").hasAttribute("tabindex")).toBe(false);
    expect(slot(wrapped.container, "tooltip-trigger").hasAttribute("role")).toBe(false);
  });
});

describe("an item with rows of its own", () => {
  it("animates the fold rather than jumping", async () => {
    await parkPointer();

    const { container } = mount({ breakpoint: WIDE, withNested: true });

    await settled(slot(container, "sidebar-panel"));

    const sub = slot(container, "sidebar-sub-menu");
    const shut = sub.getBoundingClientRect().height;

    slot(container, "sidebar-collapsible-trigger").click();
    await nextTick();

    // Mid-flight: the height is a pixel value on its way somewhere, not the `auto` it settles on.
    expect(sub.getAnimations({ subtree: true }).length).toBeGreaterThan(0);

    await settled(sub);

    expect(shut).toBe(0);
    expect(sub.getBoundingClientRect().height).toBeGreaterThan(0);
  });

  it("draws the line its rows hang from", async () => {
    await parkPointer();

    const { container } = mount({ breakpoint: WIDE, nestedExpanded: true, withNested: true });

    await settled(slot(container, "sidebar-panel"));

    const style = getComputedStyle(slot(container, "sidebar-sub-menu"));

    expect(style.borderInlineStartStyle).toBe("solid");
    expect(Number.parseFloat(style.borderInlineStartWidth)).toBeGreaterThan(0);
  });

  it("turns its indicator a quarter, and takes it off the rail", async () => {
    await parkPointer();

    const open = mount({ breakpoint: WIDE, nestedExpanded: true, withNested: true });
    const shut = mount({ breakpoint: WIDE, withNested: true });
    const rail = mount({ breakpoint: WIDE, defaultExpanded: false, withNested: true });

    for (const view of [open, shut, rail]) await settled(slot(view.container, "sidebar-panel"));

    const rotationOf = (root: HTMLElement) =>
      getComputedStyle(slot(root, "sidebar-item-indicator")).rotate;

    expect(rotationOf(open.container)).toBe("0deg");
    expect(rotationOf(shut.container)).toBe("-90deg");
    expect(getComputedStyle(slot(rail.container, "sidebar-item-indicator")).display).toBe("none");
  });

  it("has no violations with its rows open", async () => {
    await parkPointer();

    const { container } = mount({ breakpoint: WIDE, nestedExpanded: true, withNested: true });

    await settled(slot(container, "sidebar-panel"));
    await expectNoA11yViolations(container);
  });
});

describe("the scroll region", () => {
  /** Enough rows to overflow the short panel the cases below give it. */
  const many = Array.from({ length: 14 }, (_, index) => ({
    href: `/row-${index}`,
    label: `Row ${index}`,
  }));

  it("is the shadow container itself, and keeps the nav's own scrollbar", async () => {
    await parkPointer();

    const { container } = mount({ breakpoint: WIDE });

    await settled(slot(container, "sidebar-panel"));

    const content = slot(container, "sidebar-content");
    const style = getComputedStyle(content);

    // The fade has to be on the element that scrolls; a wrapper around it would fade a box that
    // never moves.
    expect(content.className).toContain("scroll-shadow");
    expect(content.className).toContain("sidebar__content");
    // `scroll-shadow.css` is imported long after `sidebar.css`, so this is the two-class rule
    // winning `scrollbar-thin` back from `.scroll-shadow--vertical`.
    expect(style.scrollbarWidth).toBe("thin");
  });

  /*
   * The thing that makes the fade safe rather than merely pretty: focus scrolls an item to the
   * nearest edge, which is exactly where the fade is, so without this a keyboard user would tab
   * down the nav landing on item after item with its focus ring faded out.
   */
  it("keeps focus clear of the fade", async () => {
    await parkPointer();

    const { container } = mount({ breakpoint: WIDE });

    await settled(slot(container, "sidebar-panel"));

    const style = getComputedStyle(slot(container, "sidebar-content"));

    expect(Number.parseFloat(style.scrollPaddingBlockStart)).toBeGreaterThan(0);
    expect(style.scrollPaddingBlockStart).toBe(style.scrollPaddingBlockEnd);
  });

  it("says nothing while the nav fits", async () => {
    await parkPointer();

    const { container } = mount({ breakpoint: WIDE });

    await settled(slot(container, "sidebar-panel"));

    const content = slot(container, "sidebar-content");

    expect(content.scrollHeight).toBeLessThanOrEqual(content.clientHeight + 1);
    expect(content.hasAttribute("data-bottom-scroll")).toBe(false);
    expect(getComputedStyle(content).maskImage).toBe("none");
  });

  it("fades at the edge with more nav beyond it", async () => {
    await parkPointer();

    const { container } = mount({ breakpoint: WIDE, class: "h-40", items: many });

    await settled(slot(container, "sidebar-panel"));

    const content = slot(container, "sidebar-content");

    expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);

    // The composable batches its write into an animation frame, so the attribute lands a frame
    // after the overflow does.
    await waitUntil("the fade reports more nav below", () =>
      content.hasAttribute("data-bottom-scroll"),
    );

    expect(content.getAttribute("data-bottom-scroll")).toBe("true");
    expect(getComputedStyle(content).maskImage).not.toBe("none");
  });

  it("stays out of the way when it is turned off", async () => {
    await parkPointer();

    const { container } = mount({
      breakpoint: WIDE,
      class: "h-40",
      items: many,
      showScrollShadow: false,
    });

    await settled(slot(container, "sidebar-panel"));

    const content = slot(container, "sidebar-content");

    expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
    expect(content.hasAttribute("data-bottom-scroll")).toBe(false);
    expect(getComputedStyle(content).maskImage).toBe("none");
  });

  /*
   * The case that reads as the fade being broken: nothing scrolled, nothing resized, the nav simply
   * grew. A submenu opening changes what is inside the scroll region without changing the region
   * itself, so a `ResizeObserver` watching only the container has nothing to report.
   */
  it("fades when a submenu grows the nav past the panel", async () => {
    await parkPointer();

    const { container } = mount({
      breakpoint: WIDE,
      class: "h-56",
      items: [{ href: "/one", label: "One" }],
      withNested: true,
    });

    await settled(slot(container, "sidebar-panel"));

    const content = slot(container, "sidebar-content");

    /*
     * A scrollbar taking layout width when the nav overflows would resize the container and set the
     * check off by accident, which is exactly the accident this case exists to rule out — on a
     * platform with overlay scrollbars it never happens. Reserving the gutter up front means the
     * only thing that changes is what is inside.
     */
    content.style.overflowY = "scroll";

    expect(content.scrollHeight).toBeLessThanOrEqual(content.clientHeight + 1);

    slot(container, "sidebar-collapsible-trigger").click();
    await settled(slot(container, "sidebar-sub-menu"));

    expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);

    await waitUntil("the fade catches up with the taller nav", () =>
      content.hasAttribute("data-bottom-scroll"),
    );
  });
});
