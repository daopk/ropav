import CardContent from "./card-content.vue";
import CardDescription from "./card-description.vue";
import CardFooter from "./card-footer.vue";
import CardHeader from "./card-header.vue";
import CardRoot from "./card-root.vue";
import CardTitle from "./card-title.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// Part order mirrors the DOM order of a card, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const Card = Object.assign(CardRoot, {
  Root: CardRoot,
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
  Footer: CardFooter,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {CardRoot, CardHeader, CardTitle, CardDescription, CardContent, CardFooter};

export type {
  CardRootProps,
  CardRootProps as CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
} from "./card.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {cardVariants} from "@ropav/styles";

export type {CardVariants} from "@ropav/styles";
