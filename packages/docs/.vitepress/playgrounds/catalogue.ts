import type { PlaygroundNode } from "./types";

export interface CatalogueEntry {
  /** Props that earn a control, in the order the panel shows them. */
  controls: readonly string[];
  /** The SFC the props are declared on, relative to the library's `src`. */
  file: string;
  node: PlaygroundNode;
}

/**
 * The editorial half of a playground: which props are worth a control, what the demo is made
 * of, and what order the options read in. Everything factual — the members, the defaults, the
 * descriptions — comes from the compiler, and the generator fails if a name here has gone.
 *
 * The allowlist is the point. Unfiltered, a number field offers 27 controls, `form` and
 * `ariaLabelledby` among them, and a panel like that is worse than none.
 */
export const catalogue: Record<string, CatalogueEntry> = {
  alert: {
    controls: ["status"],
    file: "components/alert/alert-root.vue",
    node: {
      children: [
        {
          children: [
            { children: ["Update available"], tag: "AlertTitle" },
            { children: ["A new version is ready to install."], tag: "AlertDescription" },
          ],
          tag: "AlertContent",
        },
      ],
      root: true,
      tag: "Alert",
    },
  },

  button: {
    controls: ["variant", "size", "isDisabled", "isPending", "isIconOnly", "fullWidth"],
    file: "components/button/button-root.vue",
    node: { children: ["Get started"], root: true, tag: "Button" },
  },

  switch: {
    controls: ["size", "isDisabled", "isReadOnly"],
    file: "components/switch/switch-root.vue",
    node: {
      children: [
        {
          children: [{ children: [{ tag: "SwitchThumb" }], tag: "SwitchControl" }, "Notify me"],
          tag: "SwitchContent",
        },
      ],
      root: true,
      tag: "Switch",
    },
  },
};

/**
 * Presentation order for an enum, keyed by `<id>.<prop>` first and by `<prop>` after — a size
 * reads the same everywhere, a `type` does not.
 *
 * Needed because nothing in the toolchain can supply it: the compiler normalises a literal
 * union alphabetically, and the recipes are sorted by the linter, so `lg, md, sm` is the only
 * order either could produce. A member missing from a list sorts after the ranked ones.
 */
export const optionOrder: Record<string, readonly string[]> = {
  align: ["start", "center", "end", "justify"],
  "button.type": ["button", "submit", "reset"],
  size: ["sm", "md", "lg"],
  status: ["default", "accent", "success", "warning", "danger"],
  variant: ["primary", "secondary", "tertiary", "outline", "ghost", "danger", "danger-soft"],
  weight: ["normal", "medium", "semibold", "bold"],
};
