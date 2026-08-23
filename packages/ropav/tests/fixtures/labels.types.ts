import type { UseLabelsReturn } from "@/composables/use-labels";
import type { ComputedRef } from "vue";

export interface LabelsHostProps {
  /**
   * Camel-cased rather than `aria-label`, because Vue normalises declared prop names and a
   * hyphenated one never resolves — it lands in `$attrs` instead and reads as absent.
   */
  ariaLabel?: string;
  ariaLabelledby?: string;
  /** The default name to use when the caller supplies none. */
  defaultLabel?: string;
  id?: string;
  onReady?: (labels: ComputedRef<UseLabelsReturn>) => void;
}
