import FieldGroup from "./field-group.vue";
import FieldsetActions from "./fieldset-actions.vue";
import FieldsetLegend from "./fieldset-legend.vue";
import FieldsetRoot from "./fieldset-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// Part order mirrors the DOM order of a fieldset, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const Fieldset = Object.assign(FieldsetRoot, {
  Root: FieldsetRoot,
  Legend: FieldsetLegend,
  Group: FieldGroup,
  Actions: FieldsetActions,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
// `FieldGroup`, not `FieldsetGroup` — the name `@heroui/react` gives it.
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
export {fieldsetVariants} from "@heroui/styles";

export type {FieldsetVariants} from "@heroui/styles";
