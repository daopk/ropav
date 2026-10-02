import type { InputProps } from "@/components/input";

/**
 * Every tree the metrics suite measures, by the name its cases are reported under.
 *
 * The three `TextField > ` trees set the size on a `TextField` around the field rather than on the
 * field, which is the only way that size reaches the control's class.
 */
export type FieldMetricsTree =
  | "Input"
  | "TextArea"
  | "InputGroup"
  | "SearchField"
  | "NumberField"
  | "Select"
  | "Autocomplete"
  | "ComboBox"
  | "ColorField"
  | "DateField"
  | "TimeField"
  | "TextField > Input"
  | "TextField > TextArea"
  | "TextField > InputGroup";

export interface FieldMetricsFixtureProps {
  tree: FieldMetricsTree;
  /** Set wherever the tree takes it: the root, the group that draws the field, or the TextField. */
  size: NonNullable<InputProps["size"]>;
}
