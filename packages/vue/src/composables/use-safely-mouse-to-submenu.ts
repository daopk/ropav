import type {MaybeRefOrGetter} from "vue";

import {onScopeDispose, toValue, watch} from "vue";

/** How many consecutive moves away from the submenu it takes to give up on the journey. */
const ALLOWED_INVALID_MOVEMENTS = 2;
/** Pointer moves arrive far faster than the geometry changes. */
const THROTTLE_MS = 50;
/** A pointer that stops on its way to the submenu was not on its way there after all. */
const TIMEOUT_MS = 1000;
/** Widens the corridor by 15° at each edge, so a slightly wobbly path still counts. */
const ANGLE_PADDING = Math.PI / 12;

export interface UseSafelyMouseToSubmenuProps {
  /** The menu holding the trigger. */
  menuRef: MaybeRefOrGetter<HTMLElement | null | undefined>;
  submenuRef: MaybeRefOrGetter<HTMLElement | null | undefined>;
  isOpen: MaybeRefOrGetter<boolean>;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
}

/**
 * Let the pointer travel from a submenu trigger to the submenu without the submenu closing on the
 * way, ported from React Aria's `useSafelyMouseToSubmenu`.
 *
 * A submenu opens beside its trigger, so the natural path to it is diagonal and crosses the items
 * below the trigger. Each of those items takes focus on hover, which closes the submenu the pointer
 * was heading for — the submenu is unreachable by mouse without something like this.
 *
 * The trick is to ask where the pointer is *going* rather than where it is. The angle of the last
 * movement is compared against the angle of the corridor from the pointer to the submenu's top and
 * bottom corners; while it points inside that corridor the parent menu stops taking pointer events
 * at all, so the items under the path never see the pointer. It is undone as soon as the pointer
 * turns away, or if it simply stops for a second — a pointer at rest is not on a journey.
 *
 * @example
 * ```ts
 * useSafelyMouseToSubmenu({
 *   isOpen: () => state.isOpen.value,
 *   menuRef: () => parentMenuElement.value,
 *   submenuRef: () => submenuElement.value,
 * });
 * ```
 */
export const useSafelyMouseToSubmenu = (props: UseSafelyMouseToSubmenuProps): void => {
  let previousPointer: {x: number; y: number} | undefined;
  let submenuSide: "left" | "right" | undefined;
  let lastProcessedAt = 0;
  let stillTimeout: ReturnType<typeof setTimeout> | undefined;
  let reopenTimeout: ReturnType<typeof setTimeout> | undefined;
  let movementsTowardsSubmenu = ALLOWED_INVALID_MOVEMENTS;
  let preventPointerEvents = false;

  const getMenu = () => toValue(props.menuRef) ?? null;

  const setPreventPointerEvents = (next: boolean) => {
    if (preventPointerEvents === next) return;

    preventPointerEvents = next;

    const menu = getMenu();

    if (menu) menu.style.pointerEvents = next ? "none" : "";
  };

  const reset = () => {
    setPreventPointerEvents(false);
    movementsTowardsSubmenu = ALLOWED_INVALID_MOVEMENTS;
    previousPointer = undefined;
  };

  const clearTimers = () => {
    if (stillTimeout !== undefined) clearTimeout(stillTimeout);
    if (reopenTimeout !== undefined) clearTimeout(reopenTimeout);
    stillTimeout = undefined;
    reopenTimeout = undefined;
  };

  const listeners: (() => void)[] = [];

  const detach = () => {
    for (const remove of listeners.splice(0)) remove();
    clearTimers();
    reset();
  };

  watch(
    [
      () => toValue(props.isOpen),
      () => toValue(props.isDisabled),
      () => getMenu(),
      () => toValue(props.submenuRef) ?? null,
    ],
    ([isOpen, isDisabled, menu, submenu]) => {
      detach();

      if (!isOpen || isDisabled || !menu || !submenu) return;

      submenuSide = undefined;

      const onPointermove = (event: PointerEvent) => {
        // Only a mouse has a path worth reading; touch and pen jump.
        if (event.pointerType !== "mouse") return;

        const now = Date.now();

        if (now - lastProcessedAt < THROTTLE_MS) return;

        clearTimers();

        const {clientX: x, clientY: y} = event;

        if (!previousPointer) {
          previousPointer = {x, y};

          return;
        }

        // Measured now rather than when the submenu opened: the popover is laid out before it is
        // placed, so a rectangle taken at that moment is the one it had at the document's origin,
        // and the corridor would then point at the corner of the viewport. Measuring here also
        // survives the popover being moved afterwards — flipped to the other side, or shifted to
        // stay on screen.
        const submenuRect = submenu.getBoundingClientRect();

        // Which way the submenu opened. Fixed on first use, so a pointer crossing over the
        // submenu's own edge does not flip the corridor mid-journey.
        submenuSide ??= x > submenuRect.right ? "left" : "right";

        const menuRect = menu.getBoundingClientRect();

        // Outside the parent menu entirely: whatever the pointer is doing, it is not crossing
        // items on the way to the submenu.
        if (x < menuRect.left || x > menuRect.right || y < menuRect.top || y > menuRect.bottom) {
          reset();

          return;
        }

        const {x: previousX, y: previousY} = previousPointer;
        const toSubmenuX =
          submenuSide === "right" ? submenuRect.left - previousX : previousX - submenuRect.right;
        const angleTop = Math.atan2(previousY - submenuRect.top, toSubmenuX) + ANGLE_PADDING;
        const angleBottom = Math.atan2(previousY - submenuRect.bottom, toSubmenuX) - ANGLE_PADDING;
        const anglePointer = Math.atan2(
          previousY - y,
          submenuSide === "left" ? -(x - previousX) : x - previousX,
        );
        const isMovingTowardsSubmenu = anglePointer < angleTop && anglePointer > angleBottom;

        movementsTowardsSubmenu = isMovingTowardsSubmenu
          ? Math.min(movementsTowardsSubmenu + 1, ALLOWED_INVALID_MOVEMENTS)
          : Math.max(movementsTowardsSubmenu - 1, 0);

        setPreventPointerEvents(movementsTowardsSubmenu >= ALLOWED_INVALID_MOVEMENTS);

        lastProcessedAt = now;
        previousPointer = {x, y};

        if (!isMovingTowardsSubmenu) return;

        // A pointer that stopped is not travelling. Once the menu takes pointer events again, the
        // item genuinely under the pointer is told about it, so hover ends up where it looks.
        stillTimeout = setTimeout(() => {
          reset();
          reopenTimeout = setTimeout(() => {
            const under = document.elementFromPoint(x, y);

            if (under && menu.contains(under)) {
              under.dispatchEvent(
                new PointerEvent("pointerover", {bubbles: true, cancelable: true}),
              );
            }
          }, 100);
        }, TIMEOUT_MS);
      };

      const onPointerdown = (event: PointerEvent) => {
        // Clicking through the corridor would land on whatever sits behind the menu, taking focus
        // somewhere nobody asked for.
        if (preventPointerEvents) event.preventDefault();
      };

      window.addEventListener("pointermove", onPointermove);
      window.addEventListener("pointerdown", onPointerdown, true);

      listeners.push(() => {
        window.removeEventListener("pointermove", onPointermove);
        window.removeEventListener("pointerdown", onPointerdown, true);
      });
    },
    {flush: "post", immediate: true},
  );

  onScopeDispose(() => detach(), true);
};
