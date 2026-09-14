import type { PlaygroundNode, PlaygroundSpec, PlaygroundState } from "../../playgrounds/types.ts";

/** The same value on the server and in the browser, so the markup hydrates. */
export const defaultState = (spec: PlaygroundSpec): PlaygroundState =>
  Object.fromEntries(spec.controls.map((control) => [control.name, control.defaultValue]));

/** The case a node's `follows` names for the control's current value, if it names one. */
export const followed = (
  node: PlaygroundNode,
  state: PlaygroundState,
): Readonly<Record<string, unknown>> | undefined => {
  if (!node.follows) return undefined;

  const value = state[node.follows.control];

  return typeof value === "string" ? node.follows.cases[value] : undefined;
};
