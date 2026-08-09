import type {DropEffect, DropOperation} from "./dnd-types";

/**
 * Constants of the HTML drag and drop API, ported from React Aria's `dnd/constants.ts`.
 *
 * Drop operations are a **bitmask** rather than a union, because a drag advertises a *set* of
 * operations it would accept and the drop side intersects that set with what it can do. React
 * Aria uses a TypeScript `enum` here; this package has none anywhere, so it is a frozen object
 * with an accompanying type.
 */
export const DROP_OPERATION = {
  all: (1 << 0) | (1 << 1) | (1 << 2),
  cancel: 0,
  copy: 1 << 1,
  link: 1 << 2,
  move: 1 << 0,
  none: 0,
} as const;

/** A bitmask of `DROP_OPERATION` members. */
export type DropOperationMask = number;

/**
 * `DataTransfer.effectAllowed` spelled as a bitmask.
 *
 * The native API names the combinations rather than composing them, so the pairs are spelled
 * out. `uninitialized` is what the browser reports before anyone sets `effectAllowed`, and it
 * means "no restriction" rather than "nothing allowed".
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/effectAllowed
 */
export const DROP_OPERATION_ALLOWED = {
  ...DROP_OPERATION,
  all: DROP_OPERATION.all,
  copyLink: DROP_OPERATION.copy | DROP_OPERATION.link,
  copyMove: DROP_OPERATION.copy | DROP_OPERATION.move,
  linkMove: DROP_OPERATION.link | DROP_OPERATION.move,
  uninitialized: DROP_OPERATION.all,
} as const;

/** The `effectAllowed` string for a given bitmask. */
export type EffectAllowed =
  | "none"
  | "move"
  | "copy"
  | "copyMove"
  | "link"
  | "linkMove"
  | "copyLink"
  | "all";

/**
 * `DROP_OPERATION_ALLOWED` read backwards: bitmask to the string the DOM wants.
 *
 * Built by inversion rather than written out so the two can never drift apart. Inversion loses
 * information wherever two names share a value, so both collisions are reasserted afterwards:
 * `all` over `uninitialized`, and `none` over `cancel`.
 *
 * **Deviation from React Aria**, which reasserts only `all`. Its `EFFECT_ALLOWED[0]` is
 * therefore `"cancel"` — verified against the shipped `react-aria@3.51.0` build, not inferred.
 * That is not one of the values `effectAllowed` accepts (`none`, `copy`, `copyLink`, `copyMove`,
 * `link`, `linkMove`, `move`, `all`, `uninitialized`), so a browser ignores the assignment and
 * leaves the transfer at `uninitialized` — which means *every* operation is permitted, the exact
 * opposite of the empty mask being written. Both collisions are the same mistake; upstream
 * simply patched one of them.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/effectAllowed
 */
export const EFFECT_ALLOWED: Record<number, EffectAllowed> = (() => {
  const inverted: Record<number, EffectAllowed> = {};

  for (const [name, mask] of Object.entries(DROP_OPERATION_ALLOWED)) {
    inverted[mask] = name as EffectAllowed;
  }
  inverted[DROP_OPERATION.all] = "all";
  inverted[DROP_OPERATION.none] = "none";

  return inverted;
})();

/** The DOM's `dropEffect` translated to the operation vocabulary. */
export const DROP_EFFECT_TO_DROP_OPERATION: Record<DropEffect, DropOperation> = {
  copy: "copy",
  link: "link",
  move: "move",
  none: "cancel",
};

/** The operation vocabulary translated back to the DOM's `dropEffect`. */
export const DROP_OPERATION_TO_DROP_EFFECT: Record<DropOperation, DropEffect> = {
  cancel: "none",
  copy: "copy",
  link: "link",
  move: "move",
};

/**
 * The only types that survive a drag between applications.
 *
 * Anything else is app-private: the browser will carry it within the page but a foreign drop
 * target will never see it, which is why multi-representation items are additionally serialized
 * under `CUSTOM_DRAG_TYPE`.
 */
export const NATIVE_DRAG_TYPES: Set<string> = new Set(["text/plain", "text/uri-list", "text/html"]);

/**
 * Where the full item list is stashed when the native API cannot express it.
 *
 * A `DataTransfer` holds at most one entry per type, so several items sharing a type — or one
 * item with several representations — cannot be written natively. Both cases are JSON-encoded
 * into this single custom type instead.
 */
export const CUSTOM_DRAG_TYPE = "application/vnd.react-aria.items+json";

/** Stand-in mime type for a file the browser could not identify. */
export const GENERIC_TYPE = "application/octet-stream";

/**
 * Marker for "this drag contains a directory".
 *
 * A symbol rather than a mime type because directories have none — the browser reports a
 * directory and an unidentified file identically until the drop actually happens.
 */
export const DIRECTORY_DRAG_TYPE: symbol = Symbol("directory drag type");
