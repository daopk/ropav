/**
 * The connected entries, in the order their elements appear in the document.
 *
 * Two details carry the weight, and both are easy to lose in a rewrite.
 *
 * A disconnected node makes `compareDocumentPosition` report `DISCONNECTED` in both directions,
 * which leaves the comparator **non-transitive** — enough to throw inside the engine's sort on
 * some shapes. Filtering on `isConnected` first is what keeps the comparison total.
 *
 * The element arrives through a getter rather than as a value, so a registry can hold one entry
 * per item for that item's whole life and still be sorted against wherever its element sits now.
 * Nothing has to re-register when the DOM moves.
 */
export const sortByDocumentOrder = <T>(
  entries: Iterable<T>,
  getElement: (entry: T) => HTMLElement | null | undefined,
): T[] =>
  [...entries]
    .filter((entry) => getElement(entry)?.isConnected)
    .sort((a, b) =>
      getElement(a)!.compareDocumentPosition(getElement(b)!) & Node.DOCUMENT_POSITION_FOLLOWING
        ? -1
        : 1,
    );
