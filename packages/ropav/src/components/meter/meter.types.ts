import type { MeterVariants } from "@ropav/styles";
import type { CSSProperties } from "vue";

export interface MeterRootProps {
  class?: string;
  color?: MeterVariants["color"];
  size?: MeterVariants["size"];
  /** Current quantity. @default 0 */
  value?: number;
  /** @default 0 */
  minValue?: number;
  /** @default 100 */
  maxValue?: number;
  /** Localized number formatting. @default {style: "percent"} */
  formatOptions?: Intl.NumberFormatOptions;
  /** Explicit text announced and rendered for the current value. */
  valueLabel?: string;
  id?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
}

export interface MeterOutputProps {
  class?: string;
}

export interface MeterTrackProps {
  class?: string;
}

export interface MeterFillProps {
  class?: string;
  style?: CSSProperties | string;
}

export interface MeterSlotProps {
  percentage: number;
  valueText: string | undefined;
}
