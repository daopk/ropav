import type { DragCollection, DragKey, DragKeyboardDelegate, DropTarget } from "./dnd-types";

/**
 * Moving the drop target with the arrow keys, ported from React Aria's
 * `DropTargetKeyboardNavigation`.
 *
 * A pointer picks a position directly; a keyboard has to walk one. Within a single item the walk
 * visits **before → on → after**, so every place a drop could land is reachable, and at the ends
 * of a subtree it steps into children or back out to the parent. That is why this is a tree walk
 * rather than a simple "next key".
 */

/** Whether a node is a real item, as opposed to a loader row or a section header. */
const isItem = (collection: DragCollection, key: DragKey | null | undefined): boolean =>
  key != null && (collection.getItem(key)?.type ?? "item") === "item";

/**
 * The next key in document order that is actually an item.
 *
 * A collection may hold rows that are not drop targets, and stepping onto one would offer the
 * user somewhere they cannot drop.
 */
const getNextItem = (
  collection: DragCollection,
  key: DragKey,
  getNextKey: (key: DragKey) => DragKey | null,
): DragKey | null => {
  let nextKey = getNextKey(key);

  while (nextKey != null && !isItem(collection, nextKey)) {
    nextKey = getNextKey(nextKey);
  }

  return nextKey;
};

/**
 * The position after the last child of an expanded item, if it has one.
 *
 * There is no direct "is expanded" flag to read. A collapsed item's children are absent from
 * document order, so the test is whether the next row is deeper than this one.
 */
const getLastChild = (collection: DragCollection, key: DragKey): DropTarget | null => {
  const targetNode = collection.getItem(key);
  const nextKey = getNextItem(collection, key, (current) => collection.getKeyAfter(current));
  const nextNode = nextKey != null ? collection.getItem(nextKey) : null;

  if (!targetNode || !nextNode) return null;
  if ((nextNode.level ?? 0) <= (targetNode.level ?? 0)) return null;

  let lastChild =
    targetNode.lastChildKey != null ? collection.getItem(targetNode.lastChildKey) : null;

  // Step back over any trailing non-item rows inside the subtree.
  while (lastChild && (lastChild.type ?? "item") !== "item" && lastChild.prevKey != null) {
    lastChild = collection.getItem(lastChild.prevKey) ?? null;
  }

  if (!lastChild) return null;

  return { dropPosition: "after", key: lastChild.key, type: "item" };
};

const nextDropTarget = (
  keyboardDelegate: DragKeyboardDelegate,
  collection: DragCollection,
  target: DropTarget | null | undefined,
  wrap: boolean,
  horizontal: "left" | "right" | null,
): DropTarget | null => {
  if (!target) return { type: "root" };

  if (target.type === "root") {
    const nextKey = keyboardDelegate.getFirstKey?.() ?? null;

    return nextKey != null ? { dropPosition: "before", key: nextKey, type: "item" } : null;
  }

  const nextKey = horizontal
    ? ((horizontal === "right"
        ? keyboardDelegate.getKeyRightOf?.(target.key)
        : keyboardDelegate.getKeyLeftOf?.(target.key)) ?? null)
    : (keyboardDelegate.getKeyBelow?.(target.key) ?? null);
  const nextCollectionKey = getNextItem(collection, target.key, (key) =>
    collection.getKeyAfter(key),
  );

  // The keyboard delegate may skip past the immediate next key — down a grid column, say. When
  // it does, jump straight there keeping the same position rather than walking positions here.
  if (nextKey != null && nextKey !== nextCollectionKey) {
    return { dropPosition: target.dropPosition, key: nextKey, type: "item" };
  }

  if (target.dropPosition === "before") {
    return { dropPosition: "on", key: target.key, type: "item" };
  }

  if (target.dropPosition === "on") {
    const targetNode = collection.getItem(target.key);
    const nextNode = nextKey != null ? collection.getItem(nextKey) : null;

    // A following row at the same depth or deeper: its "before" is this item's "after", so use
    // the one name rather than offering the position twice.
    if (targetNode && nextNode && (nextNode.level ?? 0) >= (targetNode.level ?? 0)) {
      return { dropPosition: "before", key: nextNode.key, type: "item" };
    }

    return { dropPosition: "after", key: target.key, type: "item" };
  }

  // "after": either continue among siblings, or climb out of this level.
  const targetNode = collection.getItem(target.key);
  let nextSibling = targetNode?.nextKey != null ? collection.getItem(targetNode.nextKey) : null;

  while (nextSibling && (nextSibling.type ?? "item") !== "item" && nextSibling.nextKey != null) {
    nextSibling = collection.getItem(nextSibling.nextKey) ?? null;
  }

  if (targetNode && nextSibling == null && targetNode.parentKey != null) {
    const parentNode = collection.getItem(targetNode.parentKey);
    const afterParent = parentNode?.nextKey != null ? collection.getItem(parentNode.nextKey) : null;

    if ((afterParent?.type ?? "item") === "item" && afterParent) {
      return { dropPosition: "before", key: afterParent.key, type: "item" };
    }

    if (parentNode && (parentNode.type ?? "item") === "item") {
      return { dropPosition: "after", key: parentNode.key, type: "item" };
    }
  }

  if (nextSibling) return { dropPosition: "on", key: nextSibling.key, type: "item" };

  return wrap ? { type: "root" } : null;
};

const previousDropTarget = (
  keyboardDelegate: DragKeyboardDelegate,
  collection: DragCollection,
  target: DropTarget | null | undefined,
  wrap: boolean,
  horizontal: "left" | "right" | null,
): DropTarget | null => {
  if (!target || (wrap && target.type === "root")) {
    // The keyboard delegate reports the deepest last item; walking up its ancestry gives the
    // shallowest, which is where a backwards walk should begin.
    let prevKey: DragKey | null = null;
    let lastKey = keyboardDelegate.getLastKey?.() ?? null;

    while (lastKey != null) {
      const node = collection.getItem(lastKey);

      if (!node || (node.type ?? "item") !== "item") break;

      prevKey = lastKey;
      lastKey = node.parentKey ?? null;
    }

    return prevKey != null ? { dropPosition: "after", key: prevKey, type: "item" } : null;
  }

  if (target.type === "item") {
    const prevKey = horizontal
      ? ((horizontal === "left"
          ? keyboardDelegate.getKeyLeftOf?.(target.key)
          : keyboardDelegate.getKeyRightOf?.(target.key)) ?? null)
      : (keyboardDelegate.getKeyAbove?.(target.key) ?? null);
    const prevCollectionKey = getNextItem(collection, target.key, (key) =>
      collection.getKeyBefore(key),
    );

    if (prevKey != null && prevKey !== prevCollectionKey) {
      return { dropPosition: target.dropPosition, key: prevKey, type: "item" };
    }

    if (target.dropPosition === "before") {
      const targetNode = collection.getItem(target.key);

      // Reverse of descending: land after the last child of the item above, so a subtree is
      // entered from its end.
      if (targetNode?.prevKey != null) {
        const lastChild = getLastChild(collection, targetNode.prevKey);

        if (lastChild) return lastChild;
      }

      if (prevKey != null) return { dropPosition: "on", key: prevKey, type: "item" };

      return { type: "root" };
    }

    if (target.dropPosition === "on") {
      return { dropPosition: "before", key: target.key, type: "item" };
    }

    const lastChild = getLastChild(collection, target.key);

    if (lastChild) return lastChild;

    return { dropPosition: "on", key: target.key, type: "item" };
  }

  return target.type !== "root" ? { type: "root" } : null;
};

/**
 * The drop target an arrow key moves to.
 *
 * @param wrap - Whether the ends join up through the collection's root, so the walk cycles.
 */
export const navigateDropTarget = (
  keyboardDelegate: DragKeyboardDelegate,
  collection: DragCollection,
  target: DropTarget | null | undefined,
  direction: "down" | "left" | "right" | "up",
  rtl = false,
  wrap = false,
): DropTarget | null => {
  switch (direction) {
    case "left":
      return rtl
        ? nextDropTarget(keyboardDelegate, collection, target, wrap, "left")
        : previousDropTarget(keyboardDelegate, collection, target, wrap, "left");
    case "right":
      return rtl
        ? previousDropTarget(keyboardDelegate, collection, target, wrap, "right")
        : nextDropTarget(keyboardDelegate, collection, target, wrap, "right");
    case "up":
      return previousDropTarget(keyboardDelegate, collection, target, wrap, null);
    case "down":
      return nextDropTarget(keyboardDelegate, collection, target, wrap, null);
  }
};
