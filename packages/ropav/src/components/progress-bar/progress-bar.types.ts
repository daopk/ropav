import type { ProgressBarVariants } from "@ropav/styles";
import type { CSSProperties } from "vue";

export interface ProgressBarRootProps {
  class?: string;
  color?: ProgressBarVariants["color"];
  size?: ProgressBarVariants["size"];
  /** Current progress. @default 0 */
  value?: number;
  /** @default 0 */
  minValue?: number;
  /** @default 100 */
  maxValue?: number;
  /** Whether progress is not currently measurable. */
  isIndeterminate?: boolean;
  /** Localized number formatting. @default {style: "percent"} */
  formatOptions?: Intl.NumberFormatOptions;
  /** Explicit text announced and rendered for the current value. */
  valueLabel?: string;
  id?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
}

export interface ProgressBarOutputProps {
  class?: string;
}

export interface ProgressBarTrackProps {
  class?: string;
}

export interface ProgressBarFillProps {
  class?: string;
  style?: CSSProperties | string;
}

export interface ProgressBarSlotProps {
  percentage: number | undefined;
  valueText: string | undefined;
  isIndeterminate: boolean;
}
