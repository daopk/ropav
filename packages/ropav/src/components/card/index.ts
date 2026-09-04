import CardContent from "./card-content.vue";
import CardDescription from "./card-description.vue";
import CardFooter from "./card-footer.vue";
import CardHeader from "./card-header.vue";
import CardRoot from "./card-root.vue";
import CardTitle from "./card-title.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { CardRoot as Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };

export type {
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
export { cardVariants } from "@ropav/styles";

export type { CardVariants } from "@ropav/styles";
