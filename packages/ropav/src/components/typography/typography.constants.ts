import type {TypographyType} from "./typography.types";

/** The semantic element each visual type renders, shared by every Typography instance. */
export const DEFAULT_ELEMENT_BY_TYPE: Readonly<Record<TypographyType, string>> = {
  body: "p",
  "body-sm": "p",
  "body-xs": "p",
  code: "code",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
};
