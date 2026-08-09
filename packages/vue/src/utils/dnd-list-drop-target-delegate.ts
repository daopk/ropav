import type {DragCollection, DragKey, DropTarget, DropTargetDelegate} from "./dnd-types";
import type {ShallowRef} from "vue";

export interface ListDropTargetDelegateOptions {
  /** Whether items are arranged in a single line or wrap into a grid. @default "stack" */
  layout?: "grid" | "stack";
  /** The direction the collection scrolls. @default "vertical" */
  orientation?: "horizontal" | "vertical";
  /** @default "ltr" */
  direction?: "ltr" | "rtl";
}

/**
 * Resolves a pointer position to a drop target, ported from React Aria's
 * `ListDropTargetDelegate`.
 *
 * Three axes are in play and keeping them straight is most of the work:
 *
 * - **Primary** — the direction the collection is arranged in, or for a grid the direction it
 *   scrolls.
 * - **Secondary** — the other one. Only a grid has it.
 * - **Flow** — the direction items follow one another, which is what a "before"/"after" drop
 *   position is relative to. For a stack that is the primary axis; for a grid it is the
 *   secondary one, because a grid's items flow across a row before moving down.
 */
export class ListDropTargetDelegate implements DropTargetDelegate {
  private collection: DragCollection;
  private element: ShallowRef<HTMLElement | null>;
  private layout: "grid" | "stack";
  private orientation: "horizontal" | "vertical";
  protected direction: "ltr" | "rtl";

  constructor(
    collection: DragCollection,
    element: ShallowRef<HTMLElement | null>,
    options: ListDropTargetDelegateOptions = {},
  ) {
    this.collection = collection;
    this.element = element;
    this.layout = options.layout ?? "stack";
    this.orientation = options.orientation ?? "vertical";
    this.direction = options.direction ?? "ltr";
  }

  private getPrimaryStart(rect: DOMRect): number {
    return this.orientation === "horizontal" ? rect.left : rect.top;
  }

  private getPrimaryEnd(rect: DOMRect): number {
    return this.orientation === "horizontal" ? rect.right : rect.bottom;
  }

  private getSecondaryStart(rect: DOMRect): number {
    return this.orientation === "horizontal" ? rect.top : rect.left;
  }

  private getSecondaryEnd(rect: DOMRect): number {
    return this.orientation === "horizontal" ? rect.bottom : rect.right;
  }

  private getFlowStart(rect: DOMRect): number {
    return this.layout === "stack" ? this.getPrimaryStart(rect) : this.getSecondaryStart(rect);
  }

  private getFlowEnd(rect: DOMRect): number {
    return this.layout === "stack" ? this.getPrimaryEnd(rect) : this.getSecondaryEnd(rect);
  }

  getDropTargetFromPoint(
    x: number,
    y: number,
    isValidDropTarget: (target: DropTarget) => boolean,
  ): DropTarget {
    const container = this.element.value;

    if (!container) return {type: "root"};

    // Only items are drop targets. A load-more sentinel carries no key and would otherwise
    // crash the search when the pointer passes over it.
    const items = [...this.collection.getKeys()].filter(
      (key) => (this.collection.getItem(key)?.type ?? "item") === "item",
    );

    if (items.length < 1) return {type: "root"};

    const containerRect = container.getBoundingClientRect();
    // The point arrives relative to the container; the rects below are viewport-relative.
    let primary = this.orientation === "horizontal" ? x : y;
    let secondary = this.orientation === "horizontal" ? y : x;

    primary += this.getPrimaryStart(containerRect);
    secondary += this.getSecondaryStart(containerRect);

    const flow = this.layout === "stack" ? primary : secondary;
    const isPrimaryRTL = this.orientation === "horizontal" && this.direction === "rtl";
    const isSecondaryRTL =
      this.layout === "grid" && this.orientation === "vertical" && this.direction === "rtl";
    const isFlowRTL = this.layout === "stack" ? isPrimaryRTL : isSecondaryRTL;

    const elementMap = this.buildElementMap(container);

    // Items are laid out in order, so the one under the pointer is found by bisection rather
    // than by measuring every row.
    let low = 0;
    let high = items.length;

    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      const key = items[mid];

      if (key == null) break;

      const element = elementMap.get(String(key));

      if (!element) break;

      const rect = element.getBoundingClientRect();
      const update = (isGreater: boolean) => {
        if (isGreater) low = mid + 1;
        else high = mid;
      };

      if (primary < this.getPrimaryStart(rect)) {
        update(isPrimaryRTL);
      } else if (primary > this.getPrimaryEnd(rect)) {
        update(!isPrimaryRTL);
      } else if (secondary < this.getSecondaryStart(rect)) {
        update(isSecondaryRTL);
      } else if (secondary > this.getSecondaryEnd(rect)) {
        update(!isSecondaryRTL);
      } else {
        return this.resolveWithinItem(key, rect, flow, isFlowRTL, isValidDropTarget);
      }
    }

    // The pointer fell between two items, or past the end. Attach to the nearest edge.
    const key = items[Math.min(low, items.length - 1)];

    if (key == null) return {type: "root"};

    const rect = elementMap.get(String(key))?.getBoundingClientRect();
    const isBefore =
      rect != null &&
      (primary < this.getPrimaryStart(rect) ||
        Math.abs(flow - this.getFlowStart(rect)) < Math.abs(flow - this.getFlowEnd(rect)));

    return {
      dropPosition: isBefore === isFlowRTL ? "after" : "before",
      key,
      type: "item",
    };
  }

  /**
   * Which position within the item the pointer means.
   *
   * When dropping *on* the item is allowed, before/after only win within 5px of an edge — the
   * body of the item stays a drop-on target. When it is not allowed, the item splits down the
   * middle instead, so every pixel resolves to one side or the other.
   */
  private resolveWithinItem(
    key: DragKey,
    rect: DOMRect,
    flow: number,
    isFlowRTL: boolean,
    isValidDropTarget: (target: DropTarget) => boolean,
  ): DropTarget {
    const target: DropTarget = {dropPosition: "on", key, type: "item"};
    const before = isFlowRTL ? ("after" as const) : ("before" as const);
    const after = isFlowRTL ? ("before" as const) : ("after" as const);

    if (isValidDropTarget(target)) {
      if (
        flow <= this.getFlowStart(rect) + 5 &&
        isValidDropTarget({...target, dropPosition: "before"})
      ) {
        return {...target, dropPosition: before};
      }

      if (
        flow >= this.getFlowEnd(rect) - 5 &&
        isValidDropTarget({...target, dropPosition: "after"})
      ) {
        return {...target, dropPosition: after};
      }

      return target;
    }

    const middle = this.getFlowStart(rect) + (this.getFlowEnd(rect) - this.getFlowStart(rect)) / 2;

    if (flow <= middle && isValidDropTarget({...target, dropPosition: "before"})) {
      return {...target, dropPosition: before};
    }

    if (flow >= middle && isValidDropTarget({...target, dropPosition: "after"})) {
      return {...target, dropPosition: after};
    }

    return target;
  }

  /**
   * Map each item key to the element currently rendering it.
   *
   * Scoped by `data-collection` when the container declares one, so a nested collection's rows
   * are not mistaken for this one's. Both attributes are already emitted by `ListBoxItem` and
   * `TableRow`.
   */
  private buildElementMap(container: HTMLElement): Map<string, HTMLElement> {
    const collectionId = container.dataset["collection"];
    const selector = collectionId
      ? `[data-collection="${CSS.escape(collectionId)}"]`
      : "[data-key]";
    const map = new Map<string, HTMLElement>();

    for (const element of container.querySelectorAll(selector)) {
      if (element instanceof HTMLElement && element.dataset["key"] != null) {
        map.set(element.dataset["key"], element);
      }
    }

    return map;
  }
}
