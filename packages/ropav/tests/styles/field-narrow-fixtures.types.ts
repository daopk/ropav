/**
 * Every tree the narrow-field suite lays out, by the name its cases are reported under. Each is a
 * flex row with an `<input>` in it and something after it that has to stay inside the field.
 */
export type FieldNarrowTree =
  | "SearchField"
  | "InputGroup"
  | "TextField > InputGroup"
  | "NumberField"
  | "ComboBox"
  | "ColorField";

export interface FieldNarrowFixtureProps {
  tree: FieldNarrowTree;
}
