/**
 * Whether two parts of the page can see each other's overlays.
 *
 * An overlay belongs to a region: the root its `PortalProvider` names, or the whole document
 * (`null`) without one. The page-wide stacks — which overlay is innermost, which one watches the
 * DOM, which one holds focus — are only shared between overlays whose regions overlap. Two regions
 * side by side are separate, so a modal in one is not stacked over a modal in the other; the whole
 * document overlaps everything, so without a provider nothing changes.
 */
export const regionsOverlap = (a: Element | null, b: Element | null): boolean =>
  a == null || b == null || a.contains(b) || b.contains(a);
