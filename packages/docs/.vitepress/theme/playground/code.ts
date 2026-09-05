import type { PlaygroundNode, PlaygroundSpec, PlaygroundState } from "../../playgrounds/types.ts";

const INDENT = "  ";
const WIDTH = 100;

const attrName = (name: string): string => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** `undefined` means the attribute is not written at all. */
const attribute = (name: string, value: unknown): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value ? attrName(name) : undefined;
  if (typeof value === "number") return `:${attrName(name)}="${value}"`;
  if (typeof value === "string") return `${attrName(name)}="${value}"`;

  // Single-quoted, because the JSON inside carries double quotes of its own.
  return `:${attrName(name)}='${JSON.stringify(value)}'`;
};

const isDefault = (spec: PlaygroundSpec, name: string, value: unknown): boolean => {
  const control = spec.controls.find((candidate) => candidate.name === name);

  return value === undefined || value === control?.defaultValue;
};

/** Sorted the way the library's own templates are, which ignores the binding colon. */
const attributes = (
  node: PlaygroundNode,
  spec: PlaygroundSpec,
  state: PlaygroundState,
): string[] => {
  const written = Object.entries(node.props ?? {}).map(([name, value]) => attribute(name, value));

  if (node.root) {
    for (const [name, value] of Object.entries(state)) {
      if (isDefault(spec, name, value) || value === undefined) continue;

      written.push(attribute(name, value));
    }
  }

  return written
    .filter((entry): entry is string => entry !== undefined)
    .sort((a, b) => a.replace(":", "").localeCompare(b.replace(":", "")));
};

const renderNode = (
  node: PlaygroundNode,
  spec: PlaygroundSpec,
  state: PlaygroundState,
  depth: number,
): string => {
  const pad = INDENT.repeat(depth);
  const attrs = attributes(node, spec, state);
  const inline = attrs.length > 0 ? ` ${attrs.join(" ")}` : "";
  const children = node.children ?? [];
  const fits = pad.length + node.tag.length + inline.length + 3 <= WIDTH;

  const open = fits
    ? `${pad}<${node.tag}${inline}`
    : [`${pad}<${node.tag}`, ...attrs.map((attr) => `${pad}${INDENT}${attr}`), pad].join("\n");

  if (children.length === 0) return `${open}${fits ? " />" : "/>"}`;

  // A lone label reads on one line, the way it would be written by hand.
  const only = children.length === 1 ? children[0] : undefined;

  if (fits && typeof only === "string") {
    const inlined = `${open}>${only}</${node.tag}>`;

    if (inlined.length <= WIDTH) return inlined;
  }

  const body = children
    .map((child) =>
      typeof child === "string"
        ? `${pad}${INDENT}${child}`
        : renderNode(child, spec, state, depth + 1),
    )
    .join("\n");

  return `${open}>\n${body}\n${pad}</${node.tag}>`;
};

/**
 * A prop still holding its own default is left out, so what the reader sees is the least they
 * would have to write themselves.
 */
export const renderCode = (spec: PlaygroundSpec, state: PlaygroundState): string =>
  renderNode(spec.node, spec, state, 0);
