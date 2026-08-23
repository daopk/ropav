import type {
  DragCollection,
  DragKey,
  DropTarget,
  DropTargetDelegate,
  ItemDropTarget,
} from "./dnd-types";

export interface TreeDropTargetDelegateOptions {
  /** The collection being dropped into, read at event time so expansion changes are seen. */
  collection: () => DragCollection;
  /** Which rows are open. A collapsed row's children are not in the collection at all. */
  expandedKeys: () => Set<DragKey>;
  /** @default "ltr" */
  direction?: () => "ltr" | "rtl";
}

/** How far the pointer must travel on each axis before it counts as a deliberate move. */
const X_SWITCH_THRESHOLD = 10;
const Y_SWITCH_THRESHOLD = 5;

/** What the pointer has been doing, which is how an ambiguous gap is resolved. */
interface PointerTracking {
  lastY: number;
  lastX: number;
  yDirection: "down" | "up" | null;
  xDirection: "left" | "right" | null;
  boundaryContext: {
    parentKey: DragKey;
    lastSwitchY: number;
    lastSwitchX: number;
    preferredTargetIndex?: number;
  } | null;
}

/**
 * Resolves a pointer position inside a **tree** to a drop target, ported from React Aria
 * Components' `TreeDropTargetDelegate`.
 *
 * Wraps a flat delegate rather than replacing it: finding which row the pointer is over is the
 * same problem in a tree as in a list, and only what a position *means* differs.
 *
 * The problem it exists to solve: the gap under the last child of a subtree is not one place but
 * several. Visually it is a single line, but it could mean "after the last child", "after that
 * child's parent", or "after the grandparent" — every ancestor that ends there. Nothing in the
 * pointer's Y position distinguishes them, so **X** does: moving left steps outwards to shallower
 * levels, moving right steps back in. Both axes are hysteretic, so a hand that is not quite still
 * does not make the target flicker between levels.
 */
export class TreeDropTargetDelegate implements DropTargetDelegate {
  private delegate: DropTargetDelegate;
  private options: TreeDropTargetDelegateOptions;
  private tracking: PointerTracking = {
    boundaryContext: null,
    lastX: 0,
    lastY: 0,
    xDirection: null,
    yDirection: null,
  };

  constructor(delegate: DropTargetDelegate, options: TreeDropTargetDelegateOptions) {
    this.delegate = delegate;
    this.options = options;
  }

  private get collection(): DragCollection {
    return this.options.collection();
  }

  private get direction(): "ltr" | "rtl" {
    return this.options.direction?.() ?? "ltr";
  }

  getDropTargetFromPoint(
    x: number,
    y: number,
    isValidDropTarget: (target: DropTarget) => boolean,
  ): DropTarget | null {
    const baseTarget = this.delegate.getDropTargetFromPoint(x, y, isValidDropTarget);

    if (!baseTarget || baseTarget.type === "root") return baseTarget;

    return this.resolveDropTarget(baseTarget, x, y, isValidDropTarget);
  }

  private resolveDropTarget(
    target: ItemDropTarget,
    x: number,
    y: number,
    isValidDropTarget: (target: DropTarget) => boolean,
  ): DropTarget | null {
    const tracking = this.tracking;
    const deltaY = y - tracking.lastY;
    const deltaX = x - tracking.lastX;
    let yMovement = tracking.yDirection;
    let xMovement = tracking.xDirection;

    if (Math.abs(deltaY) > Y_SWITCH_THRESHOLD) {
      yMovement = deltaY > 0 ? "down" : "up";
      tracking.yDirection = yMovement;
      tracking.lastY = y;
    }

    if (Math.abs(deltaX) > X_SWITCH_THRESHOLD) {
      xMovement = deltaX > 0 ? "right" : "left";
      tracking.xDirection = xMovement;
      tracking.lastX = x;
    }

    // Normalised to "after" so the walk below only ever has one case to handle. "Before A" and
    // "after whatever precedes A" name the same gap.
    let resolved = target;

    if (resolved.dropPosition === "before") {
      let keyBefore = this.collection.getKeyBefore(resolved.key);

      while (keyBefore != null) {
        const node = this.collection.getItem(keyBefore);

        if ((node?.type ?? "item") === "item") break;
        keyBefore = node?.parentKey ?? null;
      }

      if (keyBefore != null) {
        const converted: ItemDropTarget = { dropPosition: "after", key: keyBefore, type: "item" };

        if (isValidDropTarget(converted)) resolved = converted;
      }
    }

    const potentialTargets = this.getPotentialTargets(resolved, isValidDropTarget);

    if (potentialTargets.length === 0) return { type: "root" };

    if (potentialTargets.length === 1) {
      // Not at a boundary, so nothing to remember about which level was preferred.
      tracking.boundaryContext = null;

      return potentialTargets[0]!;
    }

    return this.selectTarget(potentialTargets, resolved, x, y, yMovement, xMovement);
  }

  /**
   * Every level the given gap could mean, innermost first.
   *
   * One entry for an unambiguous gap. Several when the gap sits at the end of one or more
   * subtrees, in which case each ancestor that also ends there is a candidate.
   */
  private getPotentialTargets(
    originalTarget: ItemDropTarget,
    isValidDropTarget: (target: DropTarget) => boolean,
  ): ItemDropTarget[] {
    if (originalTarget.dropPosition === "on") return [originalTarget];

    const collection = this.collection;
    let target = originalTarget;
    let currentItem = collection.getItem(target.key);

    // Step over rows that are not items — a loader, a section header — to the next real one.
    while (currentItem && (currentItem.type ?? "item") !== "item" && currentItem.nextKey != null) {
      target = { ...target, key: currentItem.nextKey };
      currentItem = collection.getItem(currentItem.nextKey);
    }

    /**
     * The gap under an open parent is *inside* it, not after it.
     *
     * Dropping "after" a row that has visible children would put the item below the whole
     * subtree, which is not where the line the user sees is drawn.
     */
    if (
      currentItem &&
      currentItem.hasChildItems &&
      this.options.expandedKeys().has(currentItem.key) &&
      target.dropPosition === "after"
    ) {
      let firstChild =
        currentItem.firstChildKey != null ? collection.getItem(currentItem.firstChildKey) : null;

      while (firstChild && (firstChild.type ?? "item") !== "item") {
        firstChild = firstChild.nextKey != null ? collection.getItem(firstChild.nextKey) : null;
      }

      if (firstChild) {
        const beforeFirstChild: ItemDropTarget = {
          dropPosition: "before",
          key: firstChild.key,
          type: "item",
        };

        return isValidDropTarget(beforeFirstChild) ? [beforeFirstChild] : [];
      }
    }

    // A row with a sibling after it ends nothing, so its gap means exactly one thing.
    if (currentItem?.nextKey != null) return [originalTarget];

    const potentialTargets: ItemDropTarget[] = [target];
    const ancestorTargets: ItemDropTarget[] = [];
    let parentKey = currentItem?.parentKey;

    // Walk out through every ancestor whose own subtree also ends at this gap.
    while (parentKey != null) {
      const parentItem = collection.getItem(parentKey);
      const nextItem = parentItem?.nextKey != null ? collection.getItem(parentItem.nextKey) : null;
      const isLastChildAtLevel = !nextItem || nextItem.parentKey !== parentKey;

      if (isLastChildAtLevel) {
        const afterParent: ItemDropTarget = { dropPosition: "after", key: parentKey, type: "item" };

        if (isValidDropTarget(afterParent)) ancestorTargets.push(afterParent);
        if (nextItem) break;
      }

      parentKey = parentItem?.parentKey;
    }

    potentialTargets.push(...ancestorTargets);

    /**
     * "After A" when the row below A is A's own child means "before that child" instead.
     *
     * Only when nothing was ambiguous: with several candidates the level is chosen by the
     * pointer, and rewriting the innermost one here would take that choice away.
     */
    if (potentialTargets.length === 1) {
      const nextKey = collection.getKeyAfter(target.key);
      const nextNode = nextKey != null ? collection.getItem(nextKey) : null;

      if (
        nextKey != null &&
        nextNode &&
        currentItem &&
        nextNode.level != null &&
        currentItem.level != null &&
        nextNode.level > currentItem.level
      ) {
        const beforeNext: ItemDropTarget = { dropPosition: "before", key: nextKey, type: "item" };

        if (isValidDropTarget(beforeNext)) return [beforeNext];
      }
    }

    return potentialTargets.filter(isValidDropTarget);
  }

  /**
   * Which of several levels the pointer means.
   *
   * Y picks the starting level — arriving from below starts at the outermost, from above at the
   * innermost — and X moves between them afterwards. Each axis resets the other's direction, so
   * a diagonal drag settles on one intent instead of oscillating.
   */
  private selectTarget(
    potentialTargets: ItemDropTarget[],
    originalTarget: ItemDropTarget,
    x: number,
    y: number,
    yMovement: "down" | "up" | null,
    xMovement: "left" | "right" | null,
  ): ItemDropTarget {
    const tracking = this.tracking;
    const parentKey = this.collection.getItem(originalTarget.key)?.parentKey;

    if (parentKey == null) return potentialTargets[0]!;

    if (!tracking.boundaryContext || tracking.boundaryContext.parentKey !== parentKey) {
      tracking.boundaryContext = {
        lastSwitchX: x,
        lastSwitchY: y,
        parentKey,
        preferredTargetIndex: tracking.yDirection === "up" ? potentialTargets.length - 1 : 0,
      };
    }

    const boundary = tracking.boundaryContext;
    const movedX = Math.abs(x - boundary.lastSwitchX);
    const movedY = Math.abs(y - boundary.lastSwitchY);

    if (movedY > Y_SWITCH_THRESHOLD && yMovement) {
      const index = boundary.preferredTargetIndex ?? 0;

      // Continuing past the innermost level means leaving the subtree, and vice versa.
      if (yMovement === "down" && index === 0) {
        boundary.preferredTargetIndex = potentialTargets.length - 1;
      } else if (yMovement === "up" && index === potentialTargets.length - 1) {
        boundary.preferredTargetIndex = 0;
      }

      tracking.xDirection = null;
    }

    if (movedX > X_SWITCH_THRESHOLD && xMovement) {
      const index = boundary.preferredTargetIndex ?? 0;
      // Outwards is towards the start of the line, which flips with the writing direction.
      const outwards = this.direction === "ltr" ? "left" : "right";
      const step = xMovement === outwards ? 1 : -1;
      const next = index + step;

      if (next >= 0 && next <= potentialTargets.length - 1) {
        boundary.preferredTargetIndex = next;
        boundary.lastSwitchX = x;
      }

      tracking.yDirection = null;
    }

    const index = Math.max(
      0,
      Math.min(boundary.preferredTargetIndex ?? 0, potentialTargets.length - 1),
    );

    return potentialTargets[index]!;
  }
}
