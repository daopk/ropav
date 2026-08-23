import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import Fixture from "./load-more-fixtures.vue";

/**
 * The asking half of load more, which only a real browser answers.
 *
 * jsdom implements no `IntersectionObserver` at all, so the sentinel there is a piece of markup
 * that never reports anything — the whole point of the component is unprovable outside this file.
 */
const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) cleanups.pop()?.();
});

const render = async (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });

  cleanups.push(result.unmount);

  await nextTick();

  return result;
};

/** An intersection is reported off the main task, so a tick is not enough to wait for it. */
const observed = () => new Promise((resolve) => setTimeout(resolve, 50));

describe("ListBox load more item (browser)", () => {
  it("asks for the next page when the end of the list is in view", async () => {
    const onLoadMore = vi.fn();

    await render({ onLoadMore });

    await observed();

    // A short list that fits entirely in view has its end already reached, so the next page is
    // asked for straight away — which is what stops a list that never filled the box from
    // stalling forever.
    expect(onLoadMore).toHaveBeenCalled();
  });

  it("holds off while the end is still a screen away", async () => {
    const onLoadMore = vi.fn();

    await render({
      items: Array.from({ length: 60 }, (_, index) => ({
        id: String(index),
        name: `Person ${index}`,
      })),
      onLoadMore,
      // Wait until the very end comes into view, rather than a screen ahead of it.
      scrollOffset: 0,
      withScrollBox: true,
    });

    await observed();

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("asks once the list is scrolled to its end", async () => {
    const onLoadMore = vi.fn();

    const result = await render({
      items: Array.from({ length: 60 }, (_, index) => ({
        id: String(index),
        name: `Person ${index}`,
      })),
      onLoadMore,
      scrollOffset: 0,
      withScrollBox: true,
    });

    await observed();
    expect(onLoadMore).not.toHaveBeenCalled();

    const box = result.container.firstElementChild as HTMLElement;

    box.scrollTop = box.scrollHeight;

    await observed();

    expect(onLoadMore).toHaveBeenCalled();
  });
});
