/**
 * Overlay positioning, ported from React Aria's `calculatePosition`.
 *
 * Framework-agnostic DOM measurement and arithmetic, kept as one unit rather than reached for
 * through a positioning library. HeroUI's Vue and React builds are verified against each other
 * by comparing geometry, and a different algorithm would make every difference between them
 * unattributable.
 */

/** Where the overlay sits relative to its trigger, optionally aligned on the cross axis. */
export type Placement =
  | "bottom"
  | "bottom left"
  | "bottom right"
  | "bottom start"
  | "bottom end"
  | "top"
  | "top left"
  | "top right"
  | "top start"
  | "top end"
  | "left"
  | "left top"
  | "left bottom"
  | "start"
  | "start top"
  | "start bottom"
  | "right"
  | "right top"
  | "right bottom"
  | "end"
  | "end top"
  | "end bottom";

export type Axis = "top" | "bottom" | "left" | "right";
/**
 * The axis a placement resolves to, always named by its positive end: a placement above and a
 * placement below both work along `"top"`, differing only in which edge they position from.
 */
export type PositionAxis = "top" | "left";
export type SizeAxis = "width" | "height";
/** The side the overlay ended up on, after any flip. */
export type PlacementAxis = Axis | "center";

interface Position {
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
}

interface Dimensions {
  width: number;
  height: number;
  totalWidth: number;
  totalHeight: number;
  top: number;
  left: number;
  scroll: Position;
}

interface ParsedPlacement {
  placement: PlacementAxis;
  crossPlacement: PlacementAxis;
  axis: PositionAxis;
  crossAxis: PositionAxis;
  size: SizeAxis;
  crossSize: SizeAxis;
}

interface Offset {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface PositionOptions {
  placement: Placement;
  targetNode: Element;
  overlayNode: Element;
  /** Distance kept between the overlay and the edge of the boundary. */
  padding: number;
  shouldFlip: boolean;
  boundaryElement: Element;
  /** Distance along the main axis, between the overlay and its trigger. */
  offset: number;
  /** Distance along the cross axis. */
  crossOffset: number;
  maxHeight?: number;
  arrowSize?: number;
  arrowBoundaryOffset?: number;
  /** Overrides the trigger's rectangle, for positioning against a point such as the cursor. */
  targetRect?: Offset | null;
}

export interface PositionResult {
  position: Position;
  arrowOffsetLeft?: number;
  arrowOffsetTop?: number;
  /**
   * Where the trigger sits inside the overlay's own coordinate system, used as the
   * `transform-origin` so the overlay grows out of its trigger rather than out of its own
   * centre.
   */
  triggerAnchorPoint: {x: number; y: number};
  maxHeight: number;
  placement: PlacementAxis;
}

const AXIS = {bottom: "top", left: "left", right: "left", top: "top"} as const;
const FLIPPED_DIRECTION = {bottom: "top", left: "right", right: "left", top: "bottom"} as const;
const CROSS_AXIS = {left: "top", top: "left"} as const;
const AXIS_SIZE = {left: "width", top: "height"} as const;
const TOTAL_SIZE = {height: "totalHeight", width: "totalWidth"} as const;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getVisualViewport = () => (typeof document === "undefined" ? null : window.visualViewport);

/** Whether one node is the other, or contains it. */
const nodeContains = (node: Element | null, other: Element | null) =>
  Boolean(node && other && node.contains(other));

const isWebKit = () =>
  typeof navigator !== "undefined" &&
  /AppleWebKit/.test(navigator.userAgent) &&
  !/Chrome/.test(navigator.userAgent);

/** The element's rectangle, ignoring any scale transform when asked. */
export const getRect = (node: Element, ignoreScale: boolean): Offset => {
  let {height, width} = node.getBoundingClientRect();
  const {left, top} = node.getBoundingClientRect();

  // An entering overlay is mid-animation and usually scaled down, so measuring it through its
  // bounding rect would place it as if it were that smaller size.
  if (ignoreScale && node instanceof HTMLElement) {
    width = node.offsetWidth;
    height = node.offsetHeight;
  }

  return {height, left, top, width};
};

const getOffset = (node: Element, ignoreScale: boolean, overrideRect?: Offset | null): Offset => {
  const {height, left, top, width} = overrideRect ?? getRect(node, ignoreScale);
  const {clientLeft, clientTop, scrollLeft, scrollTop} = document.documentElement;

  return {height, left: left + scrollLeft - clientLeft, top: top + scrollTop - clientTop, width};
};

const getPosition = (
  node: Element,
  parent: Element,
  ignoreScale: boolean,
  overrideRect?: Offset | null,
): Offset => {
  const style = window.getComputedStyle(node);
  let offset: Offset;

  if (style.position === "fixed") {
    offset = overrideRect ?? getRect(node, ignoreScale);
  } else {
    offset = getOffset(node, ignoreScale, overrideRect);

    const parentOffset = getOffset(parent, ignoreScale);
    const parentStyle = window.getComputedStyle(parent);

    parentOffset.top += (parseInt(parentStyle.borderTopWidth, 10) || 0) - parent.scrollTop;
    parentOffset.left += (parseInt(parentStyle.borderLeftWidth, 10) || 0) - parent.scrollLeft;
    offset.top -= parentOffset.top;
    offset.left -= parentOffset.left;
  }

  offset.top -= parseInt(style.marginTop, 10) || 0;
  offset.left -= parseInt(style.marginLeft, 10) || 0;

  return offset;
};

/**
 * Whether the element establishes a containing block, which an absolutely positioned
 * descendant is placed relative to even when the element itself is not positioned.
 */
const isContainingBlock = (node: Element): boolean => {
  const style = window.getComputedStyle(node);

  return (
    style.transform !== "none" ||
    /transform|perspective/.test(style.willChange) ||
    style.filter !== "none" ||
    style.contain === "paint" ||
    ("backdropFilter" in style && style.backdropFilter !== "none")
  );
};

/** The element an absolutely positioned overlay is placed relative to. */
const getContainingBlock = (node: HTMLElement): Element => {
  let offsetParent = node.offsetParent;

  // `offsetParent` stops at the body even when the body is not a containing block, in which
  // case the real answer is the viewport.
  if (
    offsetParent &&
    offsetParent === document.body &&
    window.getComputedStyle(offsetParent).position === "static" &&
    !isContainingBlock(offsetParent)
  ) {
    offsetParent = document.documentElement as unknown as HTMLElement;
  }

  // A fixed element has no `offsetParent`, yet it is still placed relative to its containing
  // block, which is not always the viewport.
  if (offsetParent == null) {
    let candidate = node.parentElement;

    while (candidate && !isContainingBlock(candidate)) candidate = candidate.parentElement;

    return candidate ?? document.documentElement;
  }

  return offsetParent;
};

const getContainerDimensions = (
  containerNode: Element,
  visualViewport: VisualViewport | null,
): Dimensions => {
  let width = 0;
  let height = 0;
  let totalWidth = 0;
  let totalHeight = 0;
  let top = 0;
  let left = 0;
  const scroll: Position = {};
  const isPinchZoomedIn = (visualViewport?.scale ?? 1) > 1;

  // An absolutely positioned element inside an unpositioned `html`/`body` resolves against the
  // initial containing block, which is the viewport rather than the document.
  if (containerNode.tagName === "BODY" || containerNode.tagName === "HTML") {
    const documentElement = document.documentElement;

    totalWidth = documentElement.clientWidth;
    totalHeight = documentElement.clientHeight;
    width = visualViewport?.width ?? totalWidth;
    height = visualViewport?.height ?? totalHeight;
    scroll.top = documentElement.scrollTop || containerNode.scrollTop;
    scroll.left = documentElement.scrollLeft || containerNode.scrollLeft;

    if (visualViewport) {
      top = visualViewport.offsetTop;
      left = visualViewport.offsetLeft;
    }
  } else {
    ({height, left, top, width} = getOffset(containerNode, false));
    scroll.top = containerNode.scrollTop;
    scroll.left = containerNode.scrollLeft;
    totalWidth = width;
    totalHeight = height;
  }

  // Safari reports a non-zero scroll offset for a non-scrolling body while pinch zoomed in,
  // unlike every other browser, which would shift the overlay by that amount.
  if (
    isWebKit() &&
    (containerNode.tagName === "BODY" || containerNode.tagName === "HTML") &&
    isPinchZoomedIn
  ) {
    scroll.top = 0;
    scroll.left = 0;
    top = visualViewport?.pageTop ?? 0;
    left = visualViewport?.pageLeft ?? 0;
  }

  return {height, left, scroll, top, totalHeight, totalWidth, width};
};

/** How far the overlay must shift along `axis` to stay inside the boundary. */
const getDelta = (
  axis: PositionAxis,
  offset: number,
  size: number,
  boundaryDimensions: Dimensions,
  containerDimensions: Dimensions,
  padding: number,
  containerOffsetWithBoundary: Offset,
) => {
  const containerScroll = containerDimensions.scroll[axis] ?? 0;
  const boundarySize = boundaryDimensions[AXIS_SIZE[axis]];
  const boundaryScroll = boundaryDimensions.scroll[AXIS[axis]] ?? 0;

  const boundaryStartEdge = containerOffsetWithBoundary[axis] + boundaryScroll + padding;
  const boundaryEndEdge =
    containerOffsetWithBoundary[axis] + boundaryScroll + boundarySize - padding;
  const startEdgeOffset =
    offset -
    containerScroll +
    boundaryScroll +
    containerOffsetWithBoundary[axis] -
    boundaryDimensions[AXIS[axis]];
  const endEdgeOffset = startEdgeOffset + size;

  if (startEdgeOffset < boundaryStartEdge) return boundaryStartEdge - startEdgeOffset;

  if (endEdgeOffset > boundaryEndEdge) {
    // An overlay taller or wider than the boundary cannot satisfy both edges; aligning the
    // start edge is the lesser evil, since that is where reading begins.
    return Math.max(boundaryEndEdge - endEdgeOffset, boundaryStartEdge - startEdgeOffset);
  }

  return 0;
};

const getMargins = (node: Element): Position => {
  const style = window.getComputedStyle(node);

  return {
    bottom: parseInt(style.marginBottom, 10) || 0,
    left: parseInt(style.marginLeft, 10) || 0,
    right: parseInt(style.marginRight, 10) || 0,
    top: parseInt(style.marginTop, 10) || 0,
  };
};

const PARSED_PLACEMENT_CACHE: Record<string, ParsedPlacement> = {};

const parsePlacement = (input: Placement): ParsedPlacement => {
  const cached = PARSED_PLACEMENT_CACHE[input];

  if (cached) return cached;

  const [placement, rawCrossPlacement] = input.split(" ") as [PlacementAxis, string | undefined];
  // A placement that reached here unresolved — a logical `start`/`end` that was never
  // translated — is read as horizontal, which is what it means in a left-to-right document.
  // React Aria falls back to `"right"` here, which has no cross axis and produces `NaN`.
  const axis: PositionAxis = AXIS[placement as Axis] ?? "left";
  const crossAxis = CROSS_AXIS[axis];
  const crossPlacement = (
    rawCrossPlacement && AXIS[rawCrossPlacement as Axis] ? rawCrossPlacement : "center"
  ) as PlacementAxis;

  const parsed: ParsedPlacement = {
    axis,
    crossAxis,
    crossPlacement,
    crossSize: AXIS_SIZE[crossAxis],
    placement,
    size: AXIS_SIZE[axis],
  };

  PARSED_PLACEMENT_CACHE[input] = parsed;

  return parsed;
};

const computePosition = (
  childOffset: Offset,
  overlaySize: Offset,
  placementInfo: ParsedPlacement,
  offset: number,
  crossOffset: number,
  isContainerPositioned: boolean,
  arrowSize: number,
  arrowBoundaryOffset: number,
  containerDimensions: Dimensions,
) => {
  const {axis, crossAxis, crossPlacement, crossSize, placement, size} = placementInfo;
  const position: Position = {};

  position[crossAxis] = childOffset[crossAxis] ?? 0;

  if (crossPlacement === "center") {
    position[crossAxis]! += (childOffset[crossSize] - overlaySize[crossSize]) / 2;
  } else if (crossPlacement !== crossAxis) {
    position[crossAxis]! += childOffset[crossSize] - overlaySize[crossSize];
  }

  position[crossAxis]! += crossOffset;

  // Keeps the overlay overlapping its trigger on the cross axis, so an arrow pointing at the
  // trigger still lands on it.
  const minPosition =
    childOffset[crossAxis] - overlaySize[crossSize] + arrowSize + arrowBoundaryOffset;
  const maxPosition =
    childOffset[crossAxis] + childOffset[crossSize] - arrowSize - arrowBoundaryOffset;

  position[crossAxis] = clamp(position[crossAxis]!, minPosition, maxPosition);

  if (placement === axis) {
    // Positioned from the far edge, so the height it is measured against depends on whether
    // the container is itself positioned.
    const containerHeight = isContainerPositioned
      ? containerDimensions[size]
      : containerDimensions[TOTAL_SIZE[size]];

    position[FLIPPED_DIRECTION[axis]] = Math.floor(containerHeight - childOffset[axis] + offset);
  } else {
    position[axis] = Math.floor(childOffset[axis] + childOffset[size] + offset);
  }

  return position;
};

type HeightGrowthDirection = "top" | "bottom";

const getMaxHeight = (
  position: Position,
  boundaryDimensions: Dimensions,
  containerOffsetWithBoundary: Offset,
  margins: Position,
  padding: number,
  overlayHeight: number,
  heightGrowthDirection: HeightGrowthDirection,
  containerDimensions: Dimensions,
  isContainerDescendentOfBoundary: boolean,
  visualViewport: VisualViewport | null,
) => {
  const overlayTop =
    (position.top != null
      ? position.top
      : containerDimensions[TOTAL_SIZE.height] - (position.bottom ?? 0) - overlayHeight) -
    (containerDimensions.scroll.top ?? 0);

  const boundaryToContainerTransformOffset = isContainerDescendentOfBoundary
    ? containerOffsetWithBoundary.top
    : 0;

  // The tighter of the boundary and the visual viewport, so a pinch-zoomed page does not get
  // an overlay taller than what is on screen. Without a visual viewport the boundary is the
  // only answer available — React Aria treats a missing one as a zero-height viewport, which
  // would cap every overlay to nothing outside a real browser.
  const viewportTop = visualViewport?.offsetTop ?? boundaryDimensions.top;
  const viewportBottom = visualViewport
    ? visualViewport.offsetTop + visualViewport.height
    : boundaryDimensions.top + boundaryDimensions.height;

  const boundingRect = {
    bottom: Math.min(
      boundaryDimensions.top + boundaryDimensions.height + boundaryToContainerTransformOffset,
      viewportBottom,
    ),
    top: Math.max(
      boundaryDimensions.top + boundaryToContainerTransformOffset,
      viewportTop + boundaryToContainerTransformOffset,
    ),
  };

  const reserved = (margins.top ?? 0) + (margins.bottom ?? 0) + padding;

  return heightGrowthDirection !== "top"
    ? Math.max(0, boundingRect.bottom - overlayTop - reserved)
    : Math.max(0, overlayTop + overlayHeight - boundingRect.top - reserved);
};

/** How much room there is on the side the overlay wants to be on. */
const getAvailableSpace = (
  boundaryDimensions: Dimensions,
  containerOffsetWithBoundary: Offset,
  childOffset: Offset,
  margins: Position,
  padding: number,
  placementInfo: ParsedPlacement,
  containerDimensions: Dimensions,
  isContainerDescendentOfBoundary: boolean,
) => {
  const {axis, placement, size} = placementInfo;
  const containerOffset = isContainerDescendentOfBoundary ? containerOffsetWithBoundary[axis] : 0;

  if (placement === axis) {
    return Math.max(
      0,
      childOffset[axis] -
        (containerDimensions.scroll[axis] ?? 0) -
        (boundaryDimensions[axis] + containerOffset) -
        (margins[axis] ?? 0) -
        (margins[FLIPPED_DIRECTION[axis]] ?? 0) -
        padding,
    );
  }

  return Math.max(
    0,
    boundaryDimensions[size] +
      boundaryDimensions[axis] +
      containerOffset -
      childOffset[axis] -
      childOffset[size] +
      (containerDimensions.scroll[axis] ?? 0) -
      (margins[axis] ?? 0) -
      (margins[FLIPPED_DIRECTION[axis]] ?? 0) -
      padding,
  );
};

/** @private Exported for tests, which drive the arithmetic without a real layout. */
export const calculatePositionInternal = (
  placementInput: Placement,
  childOffset: Offset,
  overlaySize: Offset,
  margins: Position,
  padding: number,
  flip: boolean,
  boundaryDimensions: Dimensions,
  containerDimensions: Dimensions,
  containerOffsetWithBoundary: Offset,
  offset: number,
  crossOffset: number,
  isContainerPositioned: boolean,
  userSetMaxHeight: number | undefined,
  arrowSize: number,
  arrowBoundaryOffset: number,
  isContainerDescendentOfBoundary: boolean,
  visualViewport: VisualViewport | null,
): PositionResult => {
  let placementInfo = parsePlacement(placementInput);
  const {crossAxis, crossSize, size} = placementInfo;
  let {crossPlacement, placement} = placementInfo;

  let position = computePosition(
    childOffset,
    overlaySize,
    placementInfo,
    offset,
    crossOffset,
    isContainerPositioned,
    arrowSize,
    arrowBoundaryOffset,
    containerDimensions,
  );

  const space = getAvailableSpace(
    boundaryDimensions,
    containerOffsetWithBoundary,
    childOffset,
    margins,
    padding + offset,
    placementInfo,
    containerDimensions,
    isContainerDescendentOfBoundary,
  );

  if (flip && overlaySize[size] > space) {
    const flippedPlacementInfo = parsePlacement(
      `${FLIPPED_DIRECTION[placement as Axis]} ${crossPlacement}` as Placement,
    );
    const flippedPosition = computePosition(
      childOffset,
      overlaySize,
      flippedPlacementInfo,
      offset,
      crossOffset,
      isContainerPositioned,
      arrowSize,
      arrowBoundaryOffset,
      containerDimensions,
    );
    const flippedSpace = getAvailableSpace(
      boundaryDimensions,
      containerOffsetWithBoundary,
      childOffset,
      margins,
      padding + offset,
      flippedPlacementInfo,
      containerDimensions,
      isContainerDescendentOfBoundary,
    );

    // Only worth flipping if the other side is actually roomier; otherwise a cramped overlay
    // would jump sides for nothing.
    if (flippedSpace > space) {
      placementInfo = flippedPlacementInfo;
      position = flippedPosition;
    }
  }

  let heightGrowthDirection: HeightGrowthDirection = "bottom";

  if (placementInfo.axis === "top") {
    if (placementInfo.placement === "top") heightGrowthDirection = "top";
  } else if (placementInfo.crossAxis === "top") {
    if (placementInfo.crossPlacement === "bottom") heightGrowthDirection = "top";
  }

  position[crossAxis]! += getDelta(
    crossAxis,
    position[crossAxis]!,
    overlaySize[crossSize],
    boundaryDimensions,
    containerDimensions,
    padding,
    containerOffsetWithBoundary,
  );

  let maxHeight = getMaxHeight(
    position,
    boundaryDimensions,
    containerOffsetWithBoundary,
    margins,
    padding,
    overlaySize.height,
    heightGrowthDirection,
    containerDimensions,
    isContainerDescendentOfBoundary,
    visualViewport,
  );

  if (userSetMaxHeight && userSetMaxHeight < maxHeight) maxHeight = userSetMaxHeight;

  overlaySize.height = Math.min(overlaySize.height, maxHeight);

  // Recomputed because capping the height can move an overlay that is positioned from its
  // bottom edge.
  position = computePosition(
    childOffset,
    overlaySize,
    placementInfo,
    offset,
    crossOffset,
    isContainerPositioned,
    arrowSize,
    arrowBoundaryOffset,
    containerDimensions,
  );
  position[crossAxis]! += getDelta(
    crossAxis,
    position[crossAxis]!,
    overlaySize[crossSize],
    boundaryDimensions,
    containerDimensions,
    padding,
    containerOffsetWithBoundary,
  );

  const arrowPosition: Position = {};

  // Everything below is in the overlay's own coordinate system, where 0 is its content edge —
  // hence subtracting the overlay's margin, since a child's absolute 0 starts inside it.
  let origin = childOffset[crossAxis] - position[crossAxis]! - (margins[AXIS[crossAxis]] ?? 0);
  const preferredArrowPosition = origin + 0.5 * childOffset[crossSize];

  const arrowMinPosition = arrowSize / 2 + arrowBoundaryOffset;
  const overlayMargin =
    AXIS[crossAxis] === "left"
      ? (margins.left ?? 0) + (margins.right ?? 0)
      : (margins.top ?? 0) + (margins.bottom ?? 0);
  const arrowMaxPosition =
    overlaySize[crossSize] - overlayMargin - arrowSize / 2 - arrowBoundaryOffset;

  const arrowOverlappingChildMinEdge =
    childOffset[crossAxis] +
    arrowSize / 2 -
    (position[crossAxis]! + (margins[AXIS[crossAxis]] ?? 0));
  const arrowOverlappingChildMaxEdge =
    childOffset[crossAxis] +
    childOffset[crossSize] -
    arrowSize / 2 -
    (position[crossAxis]! + (margins[AXIS[crossAxis]] ?? 0));

  arrowPosition[crossAxis] = clamp(
    clamp(preferredArrowPosition, arrowOverlappingChildMinEdge, arrowOverlappingChildMaxEdge),
    arrowMinPosition,
    arrowMaxPosition,
  );

  ({crossPlacement, placement} = placementInfo);

  // The overlay should appear to grow out of wherever it is anchored: the arrow if there is
  // one, otherwise the edge of the trigger it is aligned to.
  if (arrowSize) origin = arrowPosition[crossAxis]!;
  else if (crossPlacement === "right") origin += childOffset[crossSize];
  else if (crossPlacement === "center") origin += childOffset[crossSize] / 2;

  const crossOrigin = placement === "left" || placement === "top" ? overlaySize[size] : 0;

  return {
    arrowOffsetLeft: arrowPosition.left,
    arrowOffsetTop: arrowPosition.top,
    maxHeight,
    placement,
    position,
    triggerAnchorPoint: {
      x: placement === "top" || placement === "bottom" ? origin : crossOrigin,
      y: placement === "left" || placement === "right" ? origin : crossOrigin,
    },
  };
};

/**
 * Where to put an overlay so it sits next to its trigger and stays inside the boundary.
 *
 * Measures the DOM, then hands the arithmetic to {@link calculatePositionInternal}.
 */
export const calculatePosition = (options: PositionOptions): PositionResult => {
  const {
    arrowBoundaryOffset = 0,
    arrowSize = 0,
    boundaryElement,
    crossOffset,
    maxHeight,
    offset,
    overlayNode,
    padding,
    placement,
    shouldFlip,
    targetNode,
    targetRect,
  } = options;

  const visualViewport = getVisualViewport();
  const container =
    overlayNode instanceof HTMLElement ? getContainingBlock(overlayNode) : document.documentElement;
  const isViewportContainer = container === document.documentElement;
  const containerPositionStyle = window.getComputedStyle(container).position;
  const isContainerPositioned =
    Boolean(containerPositionStyle) && containerPositionStyle !== "static";

  const childOffset: Offset = isViewportContainer
    ? getOffset(targetNode, false, targetRect)
    : getPosition(targetNode, container, false, targetRect);

  if (!isViewportContainer) {
    const {marginLeft, marginTop} = window.getComputedStyle(targetNode);

    childOffset.top += parseInt(marginTop, 10) || 0;
    childOffset.left += parseInt(marginLeft, 10) || 0;
  }

  const overlaySize: Offset = getOffset(overlayNode, true);
  const margins = getMargins(overlayNode);

  overlaySize.width += (margins.left ?? 0) + (margins.right ?? 0);
  overlaySize.height += (margins.top ?? 0) + (margins.bottom ?? 0);

  const boundaryDimensions = getContainerDimensions(boundaryElement, visualViewport);
  const containerDimensions = getContainerDimensions(container, visualViewport);

  // The boundary's origin expressed in the container's coordinate system, which differs in
  // three distinguishable cases.
  let containerOffsetWithBoundary: Offset;
  const isBoundaryViewport =
    boundaryElement.tagName === "BODY" || boundaryElement.tagName === "HTML";

  if (isBoundaryViewport && !isViewportContainer) {
    // The boundary's dimensions are in viewport space rather than document space, so a rect
    // is the right measure here.
    const containerRect = getRect(container, false);

    containerOffsetWithBoundary = {
      height: 0,
      left: -(containerRect.left - boundaryDimensions.left),
      top: -(containerRect.top - boundaryDimensions.top),
      width: 0,
    };
  } else if (isBoundaryViewport && isViewportContainer) {
    containerOffsetWithBoundary = {height: 0, left: 0, top: 0, width: 0};
  } else {
    containerOffsetWithBoundary = getPosition(boundaryElement, container, false);
  }

  return calculatePositionInternal(
    placement,
    childOffset,
    overlaySize,
    margins,
    padding,
    shouldFlip,
    boundaryDimensions,
    containerDimensions,
    containerOffsetWithBoundary,
    offset,
    crossOffset,
    isContainerPositioned,
    maxHeight,
    arrowSize,
    arrowBoundaryOffset,
    nodeContains(boundaryElement, container),
    visualViewport,
  );
};

/** Resolves the logical `start`/`end` in a placement against the writing direction. */
export const translateRTL = (placement: Placement, direction: "ltr" | "rtl"): Placement =>
  (direction === "rtl"
    ? placement.replace("start", "right").replace("end", "left")
    : placement.replace("start", "left").replace("end", "right")) as Placement;
