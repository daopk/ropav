import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import { BreadcrumbsItem } from "@/components/breadcrumbs";

import Fixture from "./fixtures.vue";
import SeparatorFixture from "./separator-fixture.vue";

const renderBreadcrumbs = async (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });

  await nextTick();

  const root = result.container.querySelector<HTMLOListElement>("[data-slot='breadcrumbs']")!;

  return {
    ...result,
    items: [...root.querySelectorAll<HTMLElement>("[data-slot='breadcrumbs-item']")],
    links: [...root.querySelectorAll<HTMLElement>("[data-slot='link']")],
    root,
  };
};

describe("Breadcrumbs", () => {
  it("renders a localized, labelled ordered list", async () => {
    const { root, unmount } = await renderBreadcrumbs({ locale: "fr-FR" });

    expect(root.tagName).toBe("OL");
    expect(root).toHaveAttribute("aria-label", "Chemin de navigation");
    expect(root).toHaveAttribute("data-slot", "breadcrumbs");
    expect(root).toHaveClass("breadcrumbs");

    unmount();
  });

  it("lets an explicit accessible name override the localized fallback", async () => {
    const { root, unmount } = await renderBreadcrumbs({ ariaLabel: "Page hierarchy" });

    expect(root).toHaveAttribute("aria-label", "Page hierarchy");

    unmount();
  });

  it("renders every item as a list item containing a styled link", async () => {
    const { items, links, unmount } = await renderBreadcrumbs();

    expect(items).toHaveLength(3);
    expect(items.every((item) => item.tagName === "LI")).toBe(true);
    expect(items[0]).toHaveClass("breadcrumbs__item");
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveClass("breadcrumbs__link");
    expect(links[0]).toHaveAttribute("href", "#home");

    unmount();
  });

  it("marks only the final item as the current page", async () => {
    const { items, links, unmount } = await renderBreadcrumbs();

    expect(items[0]).not.toHaveAttribute("data-current");
    expect(items[2]).toHaveAttribute("data-current", "true");
    expect(links[2]).toHaveAttribute("aria-current", "page");
    expect(links[2]).toHaveAttribute("aria-disabled", "true");
    expect(links[2]).toHaveAttribute("role", "link");

    unmount();
  });

  it("renders a default chevron between non-final items", async () => {
    const { root, unmount } = await renderBreadcrumbs();
    const separators = root.querySelectorAll("[data-slot='breadcrumbs-separator']");

    expect(separators).toHaveLength(2);
    expect([...separators].every((separator) => separator.tagName === "svg")).toBe(true);

    unmount();
  });

  it("supports a plain text separator without adding a wrapper", async () => {
    const { items, root, unmount } = await renderBreadcrumbs({ separator: "/" });

    expect(root.querySelector("[data-slot='breadcrumbs-separator']")).toBeNull();
    expect(items[0]?.textContent?.replaceAll(/\s/g, "")).toBe("Home/");
    expect(items[1]?.textContent?.replaceAll(/\s/g, "")).toBe("Products/");
    expect(items[2]).toHaveTextContent("Laptop");

    unmount();
  });

  it.each(["", 0])("uses the default chevron for falsy separator %j", async (separator) => {
    const { root, unmount } = await renderBreadcrumbs({ separator });

    expect(root.querySelectorAll("[data-slot='breadcrumbs-separator']")).toHaveLength(2);

    unmount();
  });

  it("renders a component separator with the separator slot styling", async () => {
    const { root, unmount } = await renderBreadcrumbs({ separator: SeparatorFixture });
    const separators = root.querySelectorAll("[data-testid='custom-separator']");

    expect(separators).toHaveLength(2);
    expect(
      [...separators].every((separator) => separator.classList.contains("breadcrumbs__separator")),
    ).toBe(true);
    expect(
      [...separators].every(
        (separator) => separator.getAttribute("data-slot") === "breadcrumbs-separator",
      ),
    ).toBe(true);

    unmount();
  });

  it("moves current state, disabled state, and separators after a keyed reorder", async () => {
    const props = reactive<{
      items: { href?: string; id: string; label: string }[];
    }>({
      items: [
        { href: "#a", id: "a", label: "A" },
        { href: "#b", id: "b", label: "B" },
        { href: "#c", id: "c", label: "C" },
      ],
    });
    const { root, unmount } = await renderBreadcrumbs(props);

    expect(root.querySelector("[data-current='true']")).toHaveAttribute("data-testid", "c");

    props.items = [props.items[2]!, props.items[1]!, props.items[0]!];
    await nextTick();
    await Promise.resolve();
    await nextTick();

    const items = [...root.querySelectorAll<HTMLElement>("[data-slot='breadcrumbs-item']")];

    expect(items.map((item) => item.dataset["testid"])).toEqual(["c", "b", "a"]);
    expect(root.querySelector("[data-current='true']")).toHaveAttribute("data-testid", "a");
    expect(root.querySelector("[data-testid='a'] [data-slot='link']")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(root.querySelector("[data-testid='c'] [data-slot='link']")).not.toHaveAttribute(
      "aria-disabled",
    );
    expect(
      root.querySelector("[data-testid='c'] [data-slot='breadcrumbs-separator']"),
    ).not.toBeNull();
    expect(root.querySelector("[data-testid='a'] [data-slot='breadcrumbs-separator']")).toBeNull();

    unmount();
  });

  it("cascades the disabled state to every link", async () => {
    const { items, links, unmount } = await renderBreadcrumbs({ isDisabled: true });

    expect(links.every((link) => link.getAttribute("aria-disabled") === "true")).toBe(true);
    expect(items.every((item) => item.getAttribute("data-disabled") === "true")).toBe(true);

    unmount();
  });

  it("reports item click and root action for an enabled, non-current item", async () => {
    const onAction = vi.fn();
    const onItemClick = vi.fn();
    const { links, unmount } = await renderBreadcrumbs({ onAction, onItemClick });

    links[0]!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith("home");

    unmount();
  });

  it("does not report activation for the current item", async () => {
    const onAction = vi.fn();
    const onItemClick = vi.fn();
    const { links, unmount } = await renderBreadcrumbs({ onAction, onItemClick });

    links[2]!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    expect(onItemClick).not.toHaveBeenCalled();
    expect(onAction).not.toHaveBeenCalled();

    unmount();
  });

  it("merges caller classes and forwards attributes to the public elements", async () => {
    const { items, root, unmount } = await renderBreadcrumbs({
      class: "mt-4",
      itemClass: "font-bold",
    });

    expect(root).toHaveClass("breadcrumbs", "mt-4");
    expect(root).toHaveAttribute("data-testid", "breadcrumbs");
    expect(items[0]).toHaveClass("breadcrumbs__item", "font-bold");
    expect(items[0]).toHaveAttribute("data-testid", "home");

    unmount();
  });

  it("updates the root disabled state reactively", async () => {
    const props = reactive({ isDisabled: false });
    const { links, root, unmount } = await renderBreadcrumbs(props);

    expect(links[0]).not.toHaveAttribute("aria-disabled");

    props.isDisabled = true;
    await nextTick();

    expect(root.querySelector("[data-slot='link']")).toHaveAttribute("aria-disabled", "true");

    unmount();
  });

  it("keeps item context strict", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => renderVapor(BreadcrumbsItem)).toThrow(/`BreadcrumbsContext` was consumed outside/);

    warn.mockRestore();
  });
});
