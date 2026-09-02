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
