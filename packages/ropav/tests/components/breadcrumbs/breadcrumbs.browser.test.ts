import {renderVapor} from "@ropav/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {userEvent} from "vitest/browser";
import {nextTick} from "vue";

import Fixture from "./fixtures.vue";

describe("Breadcrumbs (browser)", () => {
  it("activates a non-current item with Enter", async () => {
    const onAction = vi.fn();
    const onItemClick = vi.fn();
    const {container, unmount} = renderVapor(Fixture, {props: {onAction, onItemClick}});
    const link = container.querySelector<HTMLElement>("[data-slot='link']")!;

    link.focus();
    await userEvent.keyboard("{Enter}");
    await nextTick();

    expect(onItemClick).toHaveBeenCalledOnce();
    expect(onAction).toHaveBeenCalledWith("home");

    unmount();
  });

  it("preserves modifier keys during native Enter activation", async () => {
    const onItemClick = vi.fn((event: MouseEvent) => event.preventDefault());
    const {container, unmount} = renderVapor(Fixture, {props: {onItemClick}});
    const link = container.querySelector<HTMLElement>("[data-slot='link']")!;

    link.focus();
    await userEvent.keyboard("{Control>}{Enter}{/Control}");
    await nextTick();

    expect(onItemClick).toHaveBeenCalledOnce();
    expect(onItemClick.mock.calls[0]![0].ctrlKey).toBe(true);

    unmount();
  });

  it("activates an item without an href, where no native click follows Enter", async () => {
    const onAction = vi.fn();
    const {container, unmount} = renderVapor(Fixture, {
      props: {
        items: [
          {id: "home", label: "Home"},
          {id: "leaf", label: "Leaf"},
        ],
        onAction,
      },
    });

    await nextTick();

    const link = container.querySelector<HTMLElement>("[data-slot='link']")!;

    expect(link.tagName).toBe("SPAN");

    link.focus();
    await userEvent.keyboard("{Enter}");
    await nextTick();

    expect(onAction).toHaveBeenCalledExactlyOnceWith("home");

    unmount();
  });
});
