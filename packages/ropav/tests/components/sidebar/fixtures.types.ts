/*
 * Declared out here rather than in the SFC: a type a `defineProps` generic names is part of the
 * component's exported shape, and `vue-tsc` refuses to emit one that is private to the file.
 */
export interface SidebarFixtureItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
  isDisabled?: boolean;
  /** Rendered in the item's trailing slot, which is the part that goes when the panel narrows. */
  badge?: string;
}
