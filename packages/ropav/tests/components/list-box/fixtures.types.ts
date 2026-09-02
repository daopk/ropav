export interface FixtureItem {
  id: string;
  isDisabled?: boolean;
  name: string;
  email?: string;
  /** Extra lines of content, which is what makes an item a height nobody declared. */
  lines?: number;
}
