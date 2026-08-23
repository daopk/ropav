export interface FieldsetRootProps {
  class?: string;
  /**
   * Whether every field inside is disabled. Named after the native attribute rather than
   * `isDisabled`, because this is the one component with no React Aria wrapper under it —
   * the attribute goes on a real `<fieldset>` and the browser does half the work.
   */
  disabled?: boolean;
}

export interface FieldsetLegendProps {
  class?: string;
}

export interface FieldGroupProps {
  class?: string;
}

export interface FieldsetActionsProps {
  class?: string;
}
