import type {ProgressCircleVariants} from "@heroui/styles";

export interface ProgressCircleRootProps {
  class?: string;
  color?: ProgressCircleVariants["color"];
  size?: ProgressCircleVariants["size"];
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
  /** Explicit text announced for the current value. */
  valueLabel?: string;
  id?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
}

export interface ProgressCircleTrackProps {
  class?: string;
}

export interface ProgressCircleTrackCircleProps {
  class?: string;
}

export interface ProgressCircleFillCircleProps {
  class?: string;
}

export interface ProgressCircleSlotProps {
  percentage: number | undefined;
  valueText: string | undefined;
  isIndeterminate: boolean;
}
