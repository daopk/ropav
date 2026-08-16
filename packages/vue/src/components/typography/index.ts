import Code from "./code.vue";
import Heading from "./heading.vue";
import Paragraph from "./paragraph.vue";
import Prose from "./prose.vue";
import TypographyRoot from "./typography-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Typography = Object.assign(TypographyRoot, {
  Code,
  Heading,
  Paragraph,
  Prose,
  Root: TypographyRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {Code, Heading, Paragraph, Prose, TypographyRoot};

export type {
  CodeProps,
  HeadingProps,
  ParagraphProps,
  ProseProps,
  TypographyAlign,
  TypographyColor,
  TypographyRootProps,
  TypographyRootProps as TypographyProps,
  TypographyType,
  TypographyWeight,
} from "./typography.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {typographyVariants} from "@heroui/styles";

export type {TypographyVariants} from "@heroui/styles";
