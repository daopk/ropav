export type Booleanish = boolean | "true" | "false";

/**
 * Render a boolean as a `data-*` attribute value.
 *
 * `true` becomes `"true"`; anything falsy becomes `undefined` so the attribute is
 * omitted entirely. HeroUI CSS keys on the presence of `data-*="true"`, never on
 * `data-*="false"`.
 */
export const dataAttr = (condition: boolean | undefined) =>
  (condition ? "true" : undefined) as Booleanish | undefined;
