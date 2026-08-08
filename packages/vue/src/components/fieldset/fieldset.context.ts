import type {fieldsetVariants} from "@heroui/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface FieldsetContext {
  /** Slot classes the parts pull their own class from. */
  slots: ComputedRef<ReturnType<typeof fieldsetVariants>>;
  /**
   * Whether the fieldset disables everything inside it.
   *
   * Handed down rather than left to the browser because half the fields do not benefit from the
   * native cascade: a slider, a radio group and a checkbox group all render as a `<div>`, which
   * `<fieldset disabled>` does not reach. The ones that *are* reached natively still need to
   * know, or their own disabled state — the `data-*` the stylesheet reads, and what they report
   * to a caller — would disagree with the browser.
   */
  isDisabled: ComputedRef<boolean>;
}

/**
 * Loose: every field that reads this works perfectly well with no fieldset around it.
 */
export const [useFieldsetContext, provideFieldsetContext] = createContext<FieldsetContext | null>({
  defaultValue: null,
  name: "FieldsetContext",
  strict: false,
});
