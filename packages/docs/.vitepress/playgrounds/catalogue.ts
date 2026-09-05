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

  card: {
    controls: ["variant"],
    file: "components/card/card-root.vue",
    node: {
      children: [
        {
          children: [
            { children: ["Weekly report"], tag: "CardTitle" },
            { children: ["Sent every Monday at 9am."], tag: "CardDescription" },
          ],
          tag: "CardHeader",
        },
        {
          children: ["Open rate held steady across the last four sends."],
          tag: "CardContent",
        },
      ],
      props: { class: "w-80" },
      root: true,
      tag: "Card",
    },
  },

  checkbox: {
    controls: ["variant", "isIndeterminate", "isDisabled", "isInvalid"],
    file: "components/checkbox/checkbox-root.vue",
    node: {
      children: [
        {
          children: [
            { children: [{ tag: "CheckboxIndicator" }], tag: "CheckboxControl" },
            "Accept the terms",
          ],
          tag: "CheckboxContent",
        },
      ],
      root: true,
      tag: "Checkbox",
    },
  },

  "input-group": {
    controls: ["variant", "size", "fullWidth", "isDisabled", "isInvalid"],
    file: "components/input-group/input-group-root.vue",
    node: {
      children: [
        { children: [{ tag: "IconSearch" }], tag: "InputGroupPrefix" },
        { props: { placeholder: "Anything at all" }, tag: "InputGroupInput" },
      ],
      props: { class: "w-72" },
      root: true,
      tag: "InputGroup",
    },
  },

  "number-field": {
    controls: ["variant", "size", "fullWidth", "isDisabled", "isReadOnly"],
    file: "components/number-field/number-field-root.vue",
    node: {
      children: [
        { children: ["Width"], tag: "Label" },
        {
          children: [
            { tag: "NumberFieldDecrementButton" },
            { tag: "NumberFieldInput" },
            { tag: "NumberFieldIncrementButton" },
          ],
          tag: "NumberFieldGroup",
        },
      ],
      props: { class: "w-48", "default-value": 1024, name: "width" },
      root: true,
      tag: "NumberField",
    },
  },

  "radio-group": {
    controls: ["variant", "orientation", "isDisabled"],
    file: "components/radio-group/radio-group-root.vue",
    node: {
      children: [
        { children: ["Plan"], tag: "Label" },
        {
          children: [
            {
              children: [{ children: [{ tag: "RadioIndicator" }], tag: "RadioControl" }, "Free"],
              tag: "RadioContent",
            },
          ],
          props: { value: "free" },
          tag: "Radio",
        },
        {
          children: [
            {
              children: [{ children: [{ tag: "RadioIndicator" }], tag: "RadioControl" }, "Premium"],
              tag: "RadioContent",
            },
          ],
          props: { value: "premium" },
          tag: "Radio",
        },
      ],
      props: { "default-value": "premium", name: "plan" },
      root: true,
      tag: "RadioGroup",
    },
  },

  select: {
    controls: ["variant", "size", "fullWidth", "isDisabled", "isInvalid"],
    file: "components/select/select-root.vue",
    node: {
      children: [
        { children: ["Destination"], tag: "Label" },
        {
          children: [{ tag: "SelectValue" }, { tag: "SelectIndicator" }],
          tag: "SelectTrigger",
        },
        {
          children: [
            {
              children: [
                {
                  children: ["Lisbon", { tag: "ListBoxItemIndicator" }],
                  props: { id: "lisbon", "text-value": "Lisbon" },
                  tag: "ListBoxItem",
                },
                {
                  children: ["Osaka", { tag: "ListBoxItemIndicator" }],
                  props: { id: "osaka", "text-value": "Osaka" },
                  tag: "ListBoxItem",
                },
              ],
              tag: "ListBox",
            },
          ],
          tag: "SelectPopover",
        },
      ],
      props: {
        class: "w-64",
        items: [
          { id: "lisbon", name: "Lisbon" },
          { id: "osaka", name: "Osaka" },
        ],
        placeholder: "Pick a city",
      },
      root: true,
      tag: "Select",
    },
  },

  slider: {
    controls: ["orientation", "isDisabled"],
    file: "components/slider/slider-root.vue",
    node: {
      children: [
        { children: ["Volume"], tag: "Label" },
        { tag: "SliderOutput" },
        { children: [{ tag: "SliderFill" }, { tag: "SliderThumb" }], tag: "SliderTrack" },
      ],
      props: { class: "w-64", "default-value": 30 },
      root: true,
      tag: "Slider",
    },
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
  tabs: {
    controls: ["variant", "orientation", "keyboardActivation", "isDisabled"],
    file: "components/tabs/tabs-root.vue",
    node: {
      children: [
        {
          children: [
            {
              children: [
                {
                  children: ["Activity", { tag: "TabsIndicator" }],
                  props: { id: "activity" },
                  tag: "TabsTab",
                },
                {
                  children: ["Access", { tag: "TabsIndicator" }],
                  props: { id: "access" },
                  tag: "TabsTab",
                },
              ],
              props: { "aria-label": "Project settings" },
              tag: "TabsList",
            },
          ],
          tag: "TabsListContainer",
        },
        {
          children: ["Everything that happened while you were away."],
          props: { class: "pt-4", id: "activity" },
          tag: "TabsPanel",
        },
        {
          children: ["Who can see this, and what they can do."],
          props: { class: "pt-4", id: "access" },
          tag: "TabsPanel",
        },
      ],
      props: { class: "w-full max-w-md" },
      root: true,
      tag: "Tabs",
    },
  },

  textfield: {
    controls: ["variant", "size", "fullWidth", "isDisabled", "isReadOnly", "isInvalid"],
    file: "components/textfield/textfield-root.vue",
    node: {
      children: [
        { children: ["Email address"], tag: "Label" },
        { props: { placeholder: "name@example.com" }, tag: "Input" },
      ],
      props: { class: "w-72", name: "email" },
      root: true,
      tag: "TextField",
    },
  },

  typography: {
    controls: ["type", "weight", "align", "color", "truncate"],
    file: "components/typography/typography-root.vue",
    node: {
      children: ["The quick brown fox jumps over the lazy dog."],
      props: { class: "w-80" },
      root: true,
      tag: "Typography",
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
  "card.variant": ["default", "secondary", "tertiary", "transparent"],
  size: ["sm", "md", "lg"],
  status: ["default", "accent", "success", "warning", "danger"],
  "typography.type": ["h1", "h2", "h3", "h4", "h5", "h6", "body", "body-sm", "body-xs", "code"],
  variant: ["primary", "secondary", "tertiary", "outline", "ghost", "danger", "danger-soft"],
  weight: ["normal", "medium", "semibold", "bold"],
};
