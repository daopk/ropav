import type {CardVariants} from "@heroui/styles";

export interface CardRootProps {
  class?: string;
  /** Visual variant. @default "default" */
  variant?: CardVariants["variant"];
}

export interface CardHeaderProps {
  class?: string;
}

export interface CardTitleProps {
  class?: string;
}

export interface CardDescriptionProps {
  class?: string;
}

export interface CardContentProps {
  class?: string;
}

export interface CardFooterProps {
  class?: string;
}
