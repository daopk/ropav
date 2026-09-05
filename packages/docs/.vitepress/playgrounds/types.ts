export type ControlKind = "boolean" | "enum" | "number" | "string";

export type ControlValue = boolean | number | string | undefined;

export type PlaygroundState = Record<string, ControlValue>;

export interface ControlSpec {
  /** The `@default` tag as written, when it is prose rather than a value. */
  defaultText?: string;
  /** Left out of the generated code while the state still holds this. */
  defaultValue?: boolean | number | string;
  description: string;
  kind: ControlKind;
  /** Declared name, camelCase. */
  name: string;
  /** Members in presentation order, for an enum. */
  options?: readonly string[];
}

export interface PlaygroundNode {
  children?: readonly (PlaygroundNode | string)[];
  /** Written as-is, ahead of the controlled props. */
  props?: Readonly<Record<string, boolean | number | string>>;
  /** Carries the controlled props. Exactly one node in a tree has it. */
  root?: true;
  tag: string;
}

export interface PlaygroundSpec {
  controls: readonly ControlSpec[];
  id: string;
  node: PlaygroundNode;
}
