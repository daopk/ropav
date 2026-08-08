export interface FieldsetFixtureProps {
  class?: string;
  disabled?: boolean;
  legendClass?: string;
  groupClass?: string;
  actionsClass?: string;
  withLegend?: boolean;
  withGroup?: boolean;
  withActions?: boolean;
}

export interface FieldsetFieldsFixtureProps {
  /** Whether the fieldset disables everything inside it. */
  disabled?: boolean;
  /** Set on each field, to check its own prop wins over the fieldset. */
  fieldIsDisabled?: boolean;
}
