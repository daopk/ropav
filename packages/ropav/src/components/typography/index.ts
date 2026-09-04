import type {
  CodeProps,
  HeadingProps,
  ParagraphProps,
  ProseProps,
  TypographyRootProps,
} from "./typography.types";

import Code from "./code.vue";
import Heading from "./heading.vue";
import Paragraph from "./paragraph.vue";
import Prose from "./prose.vue";
import TypographyRoot from "./typography-root.vue";

export type Typography = {
  CodeProps: CodeProps;
  HeadingProps: HeadingProps;
  ParagraphProps: ParagraphProps;
  ProseProps: ProseProps;
  Props: TypographyRootProps;
  RootProps: TypographyRootProps;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { Code, Heading, Paragraph, Prose, TypographyRoot as Typography };

export type {
  CodeProps,
  HeadingProps,
  ParagraphProps,
  ProseProps,
  TypographyAlign,
  TypographyColor,
  TypographyRootProps as TypographyProps,
  TypographyType,
  TypographyWeight,
} from "./typography.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { typographyVariants } from "@ropav/styles";

export type { TypographyVariants } from "@ropav/styles";
