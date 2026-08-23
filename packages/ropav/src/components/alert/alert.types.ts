import type { AlertVariants } from "@ropav/styles";

export interface AlertRootProps {
  class?: string;
  /** Alert status. @default "default" */
  status?: AlertVariants["status"];
}

export interface AlertIndicatorProps {
  class?: string;
}

export interface AlertContentProps {
  class?: string;
}

export interface AlertTitleProps {
  class?: string;
}

export interface AlertDescriptionProps {
  class?: string;
}
