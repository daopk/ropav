import { renderInterop } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it } from "vitest";
import { h, nextTick } from "vue";

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInset,
  SidebarItem,
  SidebarItemLabel,
  SidebarPanel,
  SidebarRail,
  SidebarRoot,
  SidebarTrigger,
} from "@/components/sidebar";

/**
 * The sidebar mounted the way a consumer mounts it: from a VDOM host, with every part written in
 * the host and forwarded through the root's slot.
 *
 * Everything here is covered by the Vapor suite, and that is exactly why the file exists. Content
 * written in Vapor resolves `inject` against the component that renders it, so the context is
 * found wherever it was provided; content written in a VDOM host resolves against the host, so
 * only what the root itself provides is found. A part that cannot see the root would still render
 * — right tag, right `data-slot` — and simply never learn that the sidebar had collapsed, which
 * the Vapor suite structurally cannot fail on.
 *
 * The group's own context is the second reason: the label registers with the group rather than the
 * root, so it is the one piece of wiring that has to survive two levels of forwarding.
 */
const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

afterEach(() => {
  document.body.replaceChildren();
});

const mount = (props: Record<string, unknown> = {}) =>
  renderInterop(SidebarRoot, {
    props,
    slots: {
      default: () => [
        h(SidebarPanel, null, {
          default: () => [
            h(SidebarContent, null, {
              default: () => [
                h(SidebarGroup, null, {
                  default: () => [
                    h(SidebarGroupLabel, null, { default: () => "Workspace" }),
                    h(
                      SidebarItem,
                      { href: "/" },
                      {
                        default: () => [h(SidebarItemLabel, null, { default: () => "Home" })],
                      },
                    ),
                  ],
                }),
              ],
            }),
          ],
        }),
        h(SidebarRail),
        h(SidebarInset, null, { default: () => [h(SidebarTrigger)] }),
      ],
    },
  });

describe("mounted from a VDOM host", () => {
  it("renders every part", () => {
    const { container } = mount();

    for (const name of [
      "sidebar",
      "sidebar-panel",
      "sidebar-content",
      "sidebar-group",
      "sidebar-group-label",
      "sidebar-item",
      "sidebar-item-label",
      "sidebar-rail",
      "sidebar-inset",
      "sidebar-trigger",
    ]) {
      expect(slot(container, name), name).not.toBeNull();
    }
  });

  it("wires the trigger and the rail to the panel", () => {
    const { container } = mount();
    const panelId = slot(container, "sidebar-panel").id;

    expect(slot(container, "sidebar-trigger").getAttribute("aria-controls")).toBe(panelId);
    expect(slot(container, "sidebar-rail").getAttribute("aria-controls")).toBe(panelId);
  });

  /* The state has to reach parts the root never rendered itself, which is the whole point. */
  it("tells every part about a collapse", async () => {
    const { container } = mount();

    slot(container, "sidebar-trigger").click();
    await nextTick();

    expect(slot(container, "sidebar").getAttribute("data-collapsed")).toBe("true");
    expect(slot(container, "sidebar-group-label").getAttribute("data-collapsed")).toBe("true");
    expect(slot(container, "sidebar-item-label").getAttribute("data-collapsed")).toBe("true");
    expect(slot(container, "sidebar-item").getAttribute("data-collapsed")).toBe("true");
  });

  it("lets the label name the group two levels down", async () => {
    const { container } = mount();

    await nextTick();

    expect(slot(container, "sidebar-group").getAttribute("aria-labelledby")).toBe(
      slot(container, "sidebar-group-label").id,
    );
  });
});
