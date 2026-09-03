import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import Fixture from "./fixtures.vue";

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

const slots = (container: HTMLElement, name: string) =>
  Array.from(container.querySelectorAll<HTMLElement>(`[data-slot='${name}']`));

const press = async (element: HTMLElement) => {
  element.click();
  await nextTick();
};

afterEach(() => {
  document.body.replaceChildren();
  localStorage.clear();
});

describe("the landmark", () => {
  it("is a nav with a name of its own", () => {
    const { container } = renderVapor(Fixture);
    const panel = slot(container, "sidebar-panel");

    expect(panel.tagName).toBe("NAV");
    expect(panel.getAttribute("aria-label")).toBe("Sidebar");
  });

  it("takes the name it is given", () => {
    const { container } = renderVapor(Fixture, { props: { ariaLabel: "Workspace nav" } });

    expect(slot(container, "sidebar-panel").getAttribute("aria-label")).toBe("Workspace nav");
  });
});

describe("the trigger", () => {
  it("points at the panel and reports its state", async () => {
    const { container } = renderVapor(Fixture);
    const trigger = slot(container, "sidebar-trigger");

    expect(trigger.getAttribute("aria-controls")).toBe(slot(container, "sidebar-panel").id);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    await press(trigger);

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(slot(container, "sidebar").getAttribute("data-collapsed")).toBe("true");
  });

  /* A sidebar that cannot collapse has nothing to toggle, and a trigger that silently does
   * nothing is worse than one that says so. */
  it("is disabled where the sidebar cannot collapse", async () => {
    const { container } = renderVapor(Fixture, { props: { collapsible: "none" } });
    const trigger = slot(container, "sidebar-trigger");

    expect(trigger.hasAttribute("disabled")).toBe(true);

    await press(trigger);

    expect(slot(container, "sidebar").hasAttribute("data-collapsed")).toBe(false);
  });

  it("reports a change without taking it, when a caller holds the state", async () => {
    const onChange = vi.fn();
    const { container } = renderVapor(Fixture, {
      props: { isExpanded: true, "onUpdate:isExpanded": onChange },
    });

    await press(slot(container, "sidebar-trigger"));

    expect(onChange).toHaveBeenCalledWith(false);
    expect(slot(container, "sidebar").hasAttribute("data-collapsed")).toBe(false);
  });
});

describe("collapsing", () => {
  /*
   * The distinction the whole component turns on. Collapsed to the rail every item is still on
   * screen and still a target; collapsed out of view none of them are, and a nav a keyboard can
   * still tab into but nobody can see is the outcome `inert` exists to prevent.
   */
  it("goes inert only when it collapses out of view", async () => {
    const rail = renderVapor(Fixture, { props: { collapsible: "icon" } });
    const gone = renderVapor(Fixture, { props: { collapsible: "offcanvas" } });

    await press(slot(rail.container, "sidebar-trigger"));
    await press(slot(gone.container, "sidebar-trigger"));

    expect(slot(rail.container, "sidebar-panel").hasAttribute("inert")).toBe(false);
    expect(slot(gone.container, "sidebar-panel").hasAttribute("inert")).toBe(true);
  });

  it("keeps every name a screen reader needs", async () => {
    const { container } = renderVapor(Fixture);

    await press(slot(container, "sidebar-trigger"));

    const label = slots(container, "sidebar-item-label")[0]!;
    const groupLabel = slot(container, "sidebar-group-label");

    // Marked for the stylesheet to take out of sight, never out of the tree.
    expect(label.getAttribute("data-collapsed")).toBe("true");
    expect(label.textContent).toBe("Home");
    expect(groupLabel.getAttribute("data-collapsed")).toBe("true");
    expect(groupLabel.textContent).toBe("Workspace");
  });
});

describe("groups", () => {
  it("takes its name from its label", async () => {
    const { container } = renderVapor(Fixture);

    await nextTick();

    const group = slot(container, "sidebar-group");

    expect(group.getAttribute("aria-labelledby")).toBe(slot(container, "sidebar-group-label").id);
    expect(group.hasAttribute("aria-label")).toBe(false);
  });

  /* An `aria-labelledby` pointing at an id that never rendered leaves the group with no name at
   * all, which is why the label registers rather than the group assuming one. */
  it("names itself where no label rendered", async () => {
    const { container } = renderVapor(Fixture, { props: { noGroupLabel: true } });

    await nextTick();

    const group = slot(container, "sidebar-group");

    expect(group.hasAttribute("aria-labelledby")).toBe(false);
    expect(group.getAttribute("aria-label")).toBe("Fallback");
  });
});

describe("items", () => {
  it("is an anchor with a destination and a button without one", () => {
    const { container } = renderVapor(Fixture);
    const [home, , archive] = slots(container, "sidebar-item");

    expect(home!.tagName).toBe("A");
    expect(home!.getAttribute("href")).toBe("/");
    // Disabled, so there is no href for a stray middle-click to follow.
    expect(archive!.tagName).toBe("BUTTON");
  });

  it("never claims not to be the current page", () => {
    const { container } = renderVapor(Fixture);
    const [home, inbox] = slots(container, "sidebar-item");

    expect(home!.getAttribute("aria-current")).toBe("page");
    expect(inbox!.hasAttribute("aria-current")).toBe(false);
    expect(inbox!.hasAttribute("data-current")).toBe(false);
  });

  it("takes a disabled item out of the tab order", () => {
    const { container } = renderVapor(Fixture);
    const archive = slots(container, "sidebar-item")[2]!;

    expect(archive.hasAttribute("tabindex")).toBe(false);
    expect(archive.getAttribute("data-disabled")).toBe("true");
  });
});

describe("the rule between groups", () => {
  /* The content lays its own children out, so a rule inside it has to take part in that layout
   * rather than being the block-level `hr` it would be on its own. */
  it("is a div, not an hr", () => {
    const { container } = renderVapor(Fixture);
    const rule = slot(container, "separator");

    expect(rule.tagName).toBe("DIV");
    expect(rule.getAttribute("role")).toBe("separator");
  });
});

describe("a narrow viewport", () => {
  const original = window.matchMedia;

  const pretendNarrow = () => {
    window.matchMedia = ((query: string) => ({
      addEventListener() {},
      addListener() {},
      dispatchEvent: () => false,
      matches: true,
      media: query,
      onchange: null,
      removeEventListener() {},
      removeListener() {},
    })) as typeof window.matchMedia;
  };

  afterEach(() => {
    window.matchMedia = original;
  });

  /*
   * A server has no `matchMedia` to ask, so it renders the wide layout. A client that answered
   * honestly on its first render would disagree with what it is hydrating and have a whole drawer
   * to reconcile, so the switch waits for mount whatever the viewport says.
   */
  it("renders the wide layout on the first pass", () => {
    pretendNarrow();

    const { container } = renderVapor(Fixture);

    expect(container.querySelector("nav")).not.toBeNull();
  });

  it("hands the panel to a drawer once mounted", async () => {
    pretendNarrow();
    renderVapor(Fixture, { props: { defaultMobileOpen: true } });

    await nextTick();

    const dialog = document.body.querySelector<HTMLElement>("[data-slot='drawer-dialog']")!;

    expect(dialog).not.toBeNull();
    expect(dialog.querySelector("[data-slot='sidebar-panel']")).not.toBeNull();
  });

  /* The drawer names itself from its heading and falls back to the button that opened it; the
   * sidebar's trigger is not that button, so a name is given inside instead. */
  it("names the dialog from a heading of its own", async () => {
    pretendNarrow();
    renderVapor(Fixture, { props: { ariaLabel: "Workspace nav", defaultMobileOpen: true } });

    await nextTick();

    const dialog = document.body.querySelector<HTMLElement>("[data-slot='drawer-dialog']")!;
    const heading = document.body.querySelector<HTMLElement>("[data-slot='drawer-heading']")!;

    expect(dialog.getAttribute("aria-labelledby")).toBe(heading.id);
    expect(heading.textContent).toBe("Workspace nav");
  });

  /* A drawer is open or it is gone; there is no half-open drawer to shorten a label for. */
  it("never reports collapsed", async () => {
    pretendNarrow();

    const { container } = renderVapor(Fixture, { props: { defaultExpanded: false } });

    await nextTick();

    expect(slot(container, "sidebar").hasAttribute("data-collapsed")).toBe(false);
  });

  it("leaves the rail out, having nothing to divide", async () => {
    pretendNarrow();

    const { container } = renderVapor(Fixture);

    await nextTick();

    expect(container.querySelector("[data-slot='sidebar-rail']")).toBeNull();
  });
});

describe("autoSaveId", () => {
  it("stores a collapse and comes back to it", async () => {
    const first = renderVapor(Fixture, { props: { autoSaveId: "app" } });

    await press(slot(first.container, "sidebar-trigger"));
    document.body.replaceChildren();

    const second = renderVapor(Fixture, { props: { autoSaveId: "app" } });

    await nextTick();

    expect(slot(second.container, "sidebar").getAttribute("data-collapsed")).toBe("true");
  });

  it("stores nothing without an id", async () => {
    const { container } = renderVapor(Fixture);

    await press(slot(container, "sidebar-trigger"));

    expect(localStorage.length).toBe(0);
  });
});

describe("an item with rows of its own", () => {
  it("names its rows and points the trigger at them", () => {
    const { container } = renderVapor(Fixture, { props: { withNested: true } });
    const trigger = slot(container, "sidebar-collapsible-trigger");
    const sub = slot(container, "sidebar-sub-menu");

    expect(trigger.getAttribute("aria-controls")).toBe(sub.id);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(sub.getAttribute("role")).toBe("group");
    expect(sub.getAttribute("aria-labelledby")).toBe(trigger.id);
  });

  /* `useDisclosurePanel` writes `hidden="until-found"`, which is what keeps a shut row off the tab
   * order while leaving find-in-page able to reveal it. */
  it("keeps a shut row out of the tab order", async () => {
    const { container } = renderVapor(Fixture, { props: { withNested: true } });

    expect(slot(container, "sidebar-sub-menu").getAttribute("hidden")).toBe("until-found");

    await press(slot(container, "sidebar-collapsible-trigger"));

    expect(slot(container, "sidebar-sub-menu").hasAttribute("hidden")).toBe(false);
  });

  it("styles a child as a child and leaves a top row alone", () => {
    const { container } = renderVapor(Fixture, { props: { withNested: true } });
    const rows = slots(container, "sidebar-item");

    expect(rows[0]!.className).not.toContain("sidebar__item--sub");
    expect(rows.at(-1)!.className).toContain("sidebar__item--sub");
  });

  /*
   * The decision the whole shape turns on. A child row carries no icon, so on the rail it would be
   * a nameless blank — the rows are not rendered there at all, and the trigger stops claiming to
   * control a region that is not on the page.
   */
  it("leaves its rows out on the rail", () => {
    const { container } = renderVapor(Fixture, {
      props: { defaultExpanded: false, nestedExpanded: true, withNested: true },
    });
    const trigger = slot(container, "sidebar-collapsible-trigger");

    expect(container.querySelector("[data-slot='sidebar-sub-menu']")).toBeNull();
    expect(trigger.hasAttribute("aria-controls")).toBe(false);
    expect(trigger.hasAttribute("aria-expanded")).toBe(false);
  });

  /* The press was asking for the rows, and the rows live at the wider size. */
  it("opens the sidebar and its rows together when pressed on the rail", async () => {
    const { container } = renderVapor(Fixture, {
      props: { defaultExpanded: false, withNested: true },
    });

    await press(slot(container, "sidebar-collapsible-trigger"));

    expect(slot(container, "sidebar").hasAttribute("data-collapsed")).toBe(false);
    expect(slot(container, "sidebar-sub-menu").getAttribute("data-expanded")).toBe("true");
  });

  it("remembers the fold across a trip to the rail", async () => {
    const { container } = renderVapor(Fixture, {
      props: { nestedExpanded: true, withNested: true },
    });

    expect(slot(container, "sidebar-sub-menu").getAttribute("data-expanded")).toBe("true");

    await press(slot(container, "sidebar-trigger"));
    await press(slot(container, "sidebar-trigger"));

    expect(slot(container, "sidebar-sub-menu").getAttribute("data-expanded")).toBe("true");
  });
});

describe("the variant", () => {
  it("leaves the shell painting itself when nothing asks otherwise", () => {
    const { container } = renderVapor(Fixture);

    expect(slot(container, "sidebar-panel").className).not.toMatch(/--(bare|floating)\b/);
    expect(slot(container, "sidebar-inset").className).not.toContain("sidebar__inset--card");
    expect(slot(container, "sidebar-rail").className).not.toContain("sidebar__rail--quiet");
  });

  it("stands the panel off as a card of its own, on floating", () => {
    const { container } = renderVapor(Fixture, { props: { variant: "floating" } });

    expect(slot(container, "sidebar-panel").className).toContain("sidebar__panel--floating");
    expect(slot(container, "sidebar-rail").className).toContain("sidebar__rail--quiet");
  });

  it("bares the panel and makes the page beside it the card, on inset", () => {
    const { container } = renderVapor(Fixture, { props: { variant: "inset" } });

    expect(slot(container, "sidebar-panel").className).toContain("sidebar__panel--bare");
    expect(slot(container, "sidebar-inset").className).toContain("sidebar__inset--card");
    expect(slot(container, "sidebar-rail").className).toContain("sidebar__rail--quiet");
  });

  /*
   * The panel and the rail each resolve a variant of their own where they stand — the drawer the
   * one is in, the drag the other allows — and the shell's has to survive that. It does because a
   * part's variants are laid over the shell's rather than put in their place, which is the kind of
   * guarantee that goes quiet when it goes: every assertion above would still pass.
   */
  it("survives the variants a part resolves for itself", () => {
    const { container } = renderVapor(Fixture, { props: { isResizable: true, variant: "inset" } });
    const rail = slot(container, "sidebar-rail");

    expect(rail.className).toContain("sidebar__rail--resizable");
    expect(rail.className).toContain("sidebar__rail--quiet");
    expect(slot(container, "sidebar-panel").className).toContain("sidebar__panel--bare");
  });
});
