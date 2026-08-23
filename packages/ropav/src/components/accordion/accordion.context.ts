import type {UseDisclosureGroupReturn} from "../../composables/use-disclosure-group";
import type {accordionVariants} from "@ropav/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface AccordionContext {
  slots: ComputedRef<ReturnType<typeof accordionVariants>>;
  /** Shared by every item so the separator can be dropped group-wide. */
  hideSeparator: ComputedRef<boolean>;
  /** Expanded-key state and trigger keyboard navigation for the group. */
  group: UseDisclosureGroupReturn;
}

export const [useAccordionContext, provideAccordionContext] = createContext<AccordionContext>({
  name: "AccordionContext",
});

export interface AccordionItemContext {
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

export const [useAccordionItemContext, provideAccordionItemContext] =
  createContext<AccordionItemContext>({name: "AccordionItemContext"});
