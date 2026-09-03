import type { DragTypes } from "../../utils/dnd-types";

import { GENERIC_TYPE } from "../../utils/dnd-constants";

/** The tokens of an `accept` list, lowercased, with the empties dropped. */
export const parseAccept = (accept: string | undefined): string[] =>
  accept
    ?.split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean) ?? [];

const matchesMimeToken = (type: string, token: string): boolean =>
  token.endsWith("/*") ? type.startsWith(token.slice(0, -1)) : type === token;

/** Whether one file satisfies an `accept` list. An empty list accepts everything. */
export const isFileAccepted = (file: File, tokens: string[]): boolean =>
  tokens.length === 0 ||
  tokens.some((token) =>
    token.startsWith(".")
      ? file.name.toLowerCase().endsWith(token)
      : matchesMimeToken(file.type.toLowerCase(), token),
  );

/**
 * Whether a drag still in flight should be refused.
 *
 * A drag advertises mime types and nothing else — never a file name, and never how many files
 * it carries. So the answer is only ever "certainly not takeable"; everything unprovable is
 * left to the drop, which filters what it emits. Three cases are unprovable:
 *
 * - an `.ext` token, which needs a file name;
 * - {@link GENERIC_TYPE}, which is what a file with no known mime type reports — and also what
 *   a directory reports, since the two are indistinguishable until the drop;
 * - a transfer whose types are hidden, which `DragTypes` already answers `true` to for
 *   everything (Safari reports no items at all while dragging files).
 */
export const isDragRefused = (types: DragTypes, tokens: string[]): boolean => {
  if (tokens.length === 0) return false;
  if (tokens.some((token) => token.startsWith("."))) return false;
  if (types.has(GENERIC_TYPE)) return false;

  return !tokens.some((token) => types.has(token));
};
