import type {TypographyVariants} from "@ropav/styles";
import type {HTMLAttributes} from "vue";

export type TypographyType = NonNullable<TypographyVariants["type"]>;
export type TypographyAlign = NonNullable<TypographyVariants["align"]>;
export type TypographyColor = NonNullable<TypographyVariants["color"]>;
export type TypographyWeight = NonNullable<TypographyVariants["weight"]>;

export interface TypographyRootProps extends /* @vue-ignore */ Omit<
  HTMLAttributes,
  "class" | "color"
> {
  class?: string;
  /** Text alignment. @default "start" */
  align?: TypographyAlign;
  /** Text colour. @default "default" */
  color?: TypographyColor;
  /** Semantic and visual text style. @default "body" */
  type?: TypographyType;
  /** Native slot name, matching the DOM prop accepted by the React primitive. */
  slot?: string;
  /** Truncates overflowing text to one line. */
  truncate?: boolean;
  weight?: TypographyWeight;
}

export interface HeadingProps extends Omit<TypographyRootProps, "type"> {
  /** Semantic heading level. @default 1 */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface ParagraphProps extends Omit<TypographyRootProps, "type"> {
  /** Body text size. @default "base" */
  size?: "base" | "sm" | "xs";
}

export interface CodeProps extends Omit<TypographyRootProps, "type"> {}

export interface ProseProps extends /* @vue-ignore */ Omit<HTMLAttributes, "class" | "color"> {
  class?: string;
  slot?: string;
}
