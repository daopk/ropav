export interface I18nProviderRootProps {
  /**
   * The [BCP 47](https://www.ietf.org/rfc/bcp/bcp47.txt) language tag to apply below.
   *
   * Omitted, or `null`, leaves the browser's own setting in force — so a value that is not chosen
   * yet does not pin the tree to the wrong language in the meantime.
   */
  locale?: string | null;
}
