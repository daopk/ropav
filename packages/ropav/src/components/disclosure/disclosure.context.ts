import type {disclosureVariants} from "@ropav/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface DisclosureContext {
  slots: ComputedRef<ReturnType<typeof disclosureVariants>>;
  isExpanded: ComputedRef<boolean>;
  isDisabled: ComputedRef<boolean>;
  /** Id of the trigger, referenced by the panel's `aria-labelledby`. */
  triggerId: ComputedRef<string>;
  /** Id of the panel, referenced by the trigger's `aria-controls`. */
  panelId: ComputedRef<string>;
  toggle: () => void;
  /** Registers the trigger element for keyboard navigation. Returns its cleanup. */
  registerTrigger: (element: HTMLElement) => () => void;
  onTriggerKeydown: (event: KeyboardEvent) => void;
}

export const [useDisclosureContext, provideDisclosureContext] = createContext<DisclosureContext>({
  name: "DisclosureContext",
});
