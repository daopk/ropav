import type {ShallowRef} from "vue";

import {onScopeDispose, watch} from "vue";

import {getScrollParent, isScrollable} from "../utils/focus";
import {isIOS, isWebKit} from "../utils/platform";

/** How close to an edge the pointer must come before the container starts scrolling. */
const AUTOSCROLL_AREA_SIZE = 20;

export interface UseAutoScrollReturn {
  /** Report the pointer position, in coordinates relative to the scrollable container. */
  move: (x: number, y: number) => void;
  stop: () => void;
}

/**
 * Scroll a container while a drag hovers near its edge, ported from React Aria's `useAutoScroll`.
 *
 * A no-op in every engine except WebKit on macOS, which is the only one that does not do this
 * itself during a drag. iOS WebKit does, so it is excluded too.
 *
 * @see https://bugs.webkit.org/show_bug.cgi?id=222636
 */
export const useAutoScroll = (element: ShallowRef<HTMLElement | null>): UseAutoScrollReturn => {
  let scrollable: HTMLElement | null = null;
  let scrollableX = true;
  let scrollableY = true;
  let timer: number | undefined;
  let dx = 0;
  let dy = 0;

  watch(
    element,
    (value) => {
      if (!value) {
        scrollable = null;

        return;
      }

      scrollable = isScrollable(value) ? value : getScrollParent(value);

      if (!scrollable) return;

      const style = window.getComputedStyle(scrollable);

      scrollableX = /(auto|scroll)/.test(style.overflowX);
      scrollableY = /(auto|scroll)/.test(style.overflowY);
    },
    {immediate: true},
  );

  const stop = () => {
    if (timer == null) return;

    cancelAnimationFrame(timer);
    timer = undefined;
  };

  const scroll = () => {
    if (scrollable) {
      if (scrollableX) scrollable.scrollLeft += dx;
      if (scrollableY) scrollable.scrollTop += dy;
    }

    // Re-arm only while still running, so `stop` genuinely stops rather than losing a race with
    // the frame it just cancelled.
    if (timer != null) timer = requestAnimationFrame(scroll);
  };

  onScopeDispose(stop);

  return {
    move(x, y) {
      if (!isWebKit() || isIOS() || !scrollable) return;

      const box = scrollable.getBoundingClientRect();
      const left = AUTOSCROLL_AREA_SIZE;
      const top = AUTOSCROLL_AREA_SIZE;
      const right = box.width - AUTOSCROLL_AREA_SIZE;
      const bottom = box.height - AUTOSCROLL_AREA_SIZE;

      if (x >= left && x <= right && y >= top && y <= bottom) {
        stop();

        return;
      }

      // Speed is how far past the edge the pointer has gone, so the scroll accelerates as the
      // user pushes further out rather than running at one fixed rate.
      if (x < left) dx = x - left;
      else if (x > right) dx = x - right;

      if (y < top) dy = y - top;
      else if (y > bottom) dy = y - bottom;

      if (timer == null) timer = requestAnimationFrame(scroll);
    },
    stop,
  };
};
