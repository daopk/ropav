import FieldGroup from "./field-group.vue";
import FieldsetActions from "./fieldset-actions.vue";
import FieldsetLegend from "./fieldset-legend.vue";
import FieldsetRoot from "./fieldset-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Fieldset = Object.assign(FieldsetRoot, {
  Actions: FieldsetActions,
  Group: FieldGroup,
  Legend: FieldsetLegend,
  Root: FieldsetRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {FieldGroup, FieldsetActions, FieldsetLegend, FieldsetRoot};

export type {
  FieldsetRootProps,
  FieldsetRootProps as FieldsetProps,
  FieldsetLegendProps,
  FieldGroupProps,
  FieldsetActionsProps,
} from "./fieldset.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {provideFieldsetContext, useFieldsetContext} from "./fieldset.context";

export type {FieldsetContext} from "./fieldset.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {fieldsetVariants} from "@ropav/styles";

export type {FieldsetVariants} from "@ropav/styles";
