import {renderVapor} from "@heroui/testing/helpers/vue";
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
});
