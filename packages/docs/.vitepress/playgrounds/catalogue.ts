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

  avatar: {
    controls: ["variant", "color", "size"],
    file: "components/avatar/avatar-root.vue",
    node: {
      children: [{ children: ["JD"], tag: "AvatarFallback" }],
      root: true,
      tag: "Avatar",
    },
  },

  badge: {
    controls: ["variant", "color", "size", "placement"],
    file: "components/badge/badge-root.vue",
    node: {
      children: [
        {
          children: [{ children: ["JD"], tag: "AvatarFallback" }],
          tag: "Avatar",
        },
        {
          children: [{ children: ["5"], tag: "BadgeLabel" }],
          root: true,
          tag: "Badge",
        },
      ],
      tag: "BadgeAnchor",
    },
  },

  button: {
    controls: ["variant", "size", "isDisabled", "isPending", "isIconOnly", "fullWidth"],
    file: "components/button/button-root.vue",
    node: { children: ["Get started"], root: true, tag: "Button" },
  },

  "button-group": {
    controls: ["variant", "size", "orientation", "fullWidth", "isDisabled"],
    file: "components/button-group/button-group-root.vue",
    node: {
      children: [
        { children: ["Undo"], tag: "Button" },
        { children: [{ tag: "ButtonGroupSeparator" }, "Redo"], tag: "Button" },
      ],
      props: { "aria-label": "History" },
      root: true,
      tag: "ButtonGroup",
    },
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

  "checkbox-group": {
    controls: ["variant", "isDisabled", "isReadOnly", "isRequired", "isInvalid"],
    file: "components/checkbox-group/checkbox-group-root.vue",
    node: {
      children: [
        { children: ["Interests"], tag: "Label" },
        {
          children: [
            {
              children: [
                { children: [{ tag: "CheckboxIndicator" }], tag: "CheckboxControl" },
                "Coding",
              ],
              tag: "CheckboxContent",
            },
          ],
          props: { value: "coding" },
          tag: "Checkbox",
        },
        {
          children: [
            {
              children: [
                { children: [{ tag: "CheckboxIndicator" }], tag: "CheckboxControl" },
                "Design",
              ],
              tag: "CheckboxContent",
            },
          ],
          props: { value: "design" },
          tag: "Checkbox",
        },
      ],
      props: { name: "interests" },
      root: true,
      tag: "CheckboxGroup",
    },
  },

  chip: {
    controls: ["variant", "color", "size"],
    file: "components/chip/chip-root.vue",
    node: {
      children: [{ children: ["Label"], tag: "ChipLabel" }],
      root: true,
      tag: "Chip",
    },
  },

  "close-button": {
    controls: ["isDisabled", "isPending"],
    file: "components/close-button/close-button-root.vue",
    node: { root: true, tag: "CloseButton" },
  },

  "color-area": {
    controls: ["showDots", "isDisabled"],
    file: "components/color-area/color-area-root.vue",
    node: {
      children: [{ tag: "ColorAreaThumb" }],
      props: { "aria-label": "Brand", class: "w-64", "default-value": "hsl(200, 100%, 50%)" },
      root: true,
      tag: "ColorArea",
    },
  },

  "color-field": {
    controls: ["fullWidth", "isDisabled", "isReadOnly", "isRequired", "isInvalid"],
    file: "components/color-field/color-field-root.vue",
    node: {
      children: [
        { children: ["Brand colour"], tag: "Label" },
        {
          children: [
            { children: [{ tag: "ColorSwatch" }], tag: "ColorInputGroupPrefix" },
            { tag: "ColorInputGroupInput" },
          ],
          tag: "ColorInputGroup",
        },
      ],
      props: { class: "w-72", defaultValue: "#0485f7" },
      root: true,
      tag: "ColorField",
    },
  },

  "color-slider": {
    controls: ["orientation", "isDisabled"],
    file: "components/color-slider/color-slider-root.vue",
    node: {
      children: [
        { children: ["Hue"], tag: "Label" },
        { tag: "ColorSliderOutput" },
        { children: [{ tag: "ColorSliderThumb" }], tag: "ColorSliderTrack" },
      ],
      props: {
        channel: "hue",
        class: "w-72",
        colorSpace: "hsl",
        defaultValue: "hsl(200, 100%, 50%)",
      },
      root: true,
      tag: "ColorSlider",
    },
  },

  "color-swatch": {
    controls: ["shape", "size"],
    file: "components/color-swatch/color-swatch-root.vue",
    node: { props: { color: "#0485f7" }, root: true, tag: "ColorSwatch" },
  },

  "color-swatch-picker": {
    controls: ["variant", "size", "layout"],
    file: "components/color-swatch-picker/color-swatch-picker-root.vue",
    node: {
      children: [
        {
          children: [{ tag: "ColorSwatchPickerSwatch" }, { tag: "ColorSwatchPickerIndicator" }],
          props: { color: "#f43f5e" },
          tag: "ColorSwatchPickerItem",
        },
        {
          children: [{ tag: "ColorSwatchPickerSwatch" }, { tag: "ColorSwatchPickerIndicator" }],
          props: { color: "#8b5cf6" },
          tag: "ColorSwatchPickerItem",
        },
        {
          children: [{ tag: "ColorSwatchPickerSwatch" }, { tag: "ColorSwatchPickerIndicator" }],
          props: { color: "#3b82f6" },
          tag: "ColorSwatchPickerItem",
        },
        {
          children: [{ tag: "ColorSwatchPickerSwatch" }, { tag: "ColorSwatchPickerIndicator" }],
          props: { color: "#10b981" },
          tag: "ColorSwatchPickerItem",
        },
      ],
      props: { "aria-label": "Brand colour", defaultValue: "#3b82f6" },
      root: true,
      tag: "ColorSwatchPicker",
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

  "input-otp": {
    controls: ["variant", "isDisabled", "isInvalid"],
    file: "components/input-otp/input-otp-root.vue",
    node: {
      children: [
        {
          children: [
            { props: { index: 0 }, tag: "InputOTPSlot" },
            { props: { index: 1 }, tag: "InputOTPSlot" },
            { props: { index: 2 }, tag: "InputOTPSlot" },
            { props: { index: 3 }, tag: "InputOTPSlot" },
          ],
          tag: "InputOTPGroup",
        },
      ],
      props: { "aria-label": "Verification code", defaultValue: "04", maxLength: 4 },
      root: true,
      tag: "InputOTP",
    },
  },

  kbd: {
    controls: ["variant"],
    file: "components/kbd/kbd-root.vue",
    node: {
      children: [
        { props: { "key-value": "command" }, tag: "KbdAbbr" },
        { children: ["K"], tag: "KbdContent" },
      ],
      root: true,
      tag: "Kbd",
    },
  },

  meter: {
    controls: ["color", "size"],
    file: "components/meter/meter-root.vue",
    node: {
      children: [
        { children: ["Storage"], tag: "Label" },
        { tag: "MeterOutput" },
        { children: [{ tag: "MeterFill" }], tag: "MeterTrack" },
      ],
      props: { class: "w-80", value: 72 },
      root: true,
      tag: "Meter",
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

  "progress-bar": {
    controls: ["color", "size", "isStriped", "isAnimated", "isIndeterminate"],
    file: "components/progress-bar/progress-bar-root.vue",
    node: {
      children: [
        { children: ["Uploading"], tag: "Label" },
        { tag: "ProgressBarOutput" },
        { children: [{ tag: "ProgressBarFill" }], tag: "ProgressBarTrack" },
      ],
      props: { class: "w-80", value: 60 },
      root: true,
      tag: "ProgressBar",
    },
  },

  "progress-circle": {
    controls: ["color", "size", "isIndeterminate"],
    file: "components/progress-circle/progress-circle-root.vue",
    node: {
      children: [
        {
          children: [{ tag: "ProgressCircleTrackCircle" }, { tag: "ProgressCircleFillCircle" }],
          tag: "ProgressCircleTrack",
        },
      ],
      props: { "aria-label": "Uploading", value: 60 },
      root: true,
      tag: "ProgressCircle",
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

  "scroll-shadow": {
    controls: ["size", "offset", "hideScrollBar", "visibility"],
    file: "components/scroll-shadow/scroll-shadow-root.vue",
    node: {
      children: [
        {
          children: [
            "A scroll shadow is the edge of the box saying there is more where that came from.",
          ],
          tag: "Typography",
        },
        {
          children: [
            "It fades whichever edge has content past it, and only that edge — so the top stays sharp until something has been scrolled away.",
          ],
          tag: "Typography",
        },
        {
          children: [
            "Nothing here is painted over the content. The fade is a mask, which is why it works over any background the box happens to sit on.",
          ],
          tag: "Typography",
        },
      ],
      props: { class: "flex max-h-32 w-72 flex-col gap-3 p-4" },
      root: true,
      tag: "ScrollShadow",
    },
  },

  "search-field": {
    controls: ["variant", "size", "fullWidth", "isDisabled", "isReadOnly", "isInvalid"],
    file: "components/search-field/search-field-root.vue",
    node: {
      children: [
        { children: ["Search"], tag: "Label" },
        {
          children: [
            { tag: "SearchFieldSearchIcon" },
            { props: { class: "w-64", placeholder: "Search…" }, tag: "SearchFieldInput" },
            { tag: "SearchFieldClearButton" },
          ],
          tag: "SearchFieldGroup",
        },
      ],
      props: { defaultValue: "oklch" },
      root: true,
      tag: "SearchField",
    },
  },

  "segmented-control": {
    controls: ["size", "fullWidth", "isDisabled"],
    file: "components/segmented-control/segmented-control-root.vue",
    node: {
      children: [
        {
          children: ["Daily", { tag: "SegmentedControlIndicator" }],
          props: { id: "daily" },
          tag: "SegmentedControlItem",
        },
        {
          children: ["Weekly", { tag: "SegmentedControlIndicator" }],
          props: { id: "weekly" },
          tag: "SegmentedControlItem",
        },
        {
          children: ["Monthly", { tag: "SegmentedControlIndicator" }],
          props: { id: "monthly" },
          tag: "SegmentedControlItem",
        },
      ],
      props: { "aria-label": "Reporting range", defaultSelectedKey: "weekly" },
      root: true,
      tag: "SegmentedControl",
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

  separator: {
    controls: ["variant", "orientation"],
    file: "components/separator/separator-root.vue",
    node: {
      children: [
        { children: ["Undo"], props: { variant: "secondary" }, tag: "Button" },
        { root: true, tag: "Separator" },
        { children: ["Publish"], tag: "Button" },
      ],
      props: { "aria-label": "Document actions" },
      tag: "Toolbar",
    },
  },

  skeleton: {
    controls: ["animationType"],
    file: "components/skeleton/skeleton-root.vue",
    node: { props: { class: "h-24 w-64 rounded-xl" }, root: true, tag: "Skeleton" },
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

  spinner: {
    controls: ["color", "size"],
    file: "components/spinner/spinner-root.vue",
    node: { root: true, tag: "Spinner" },
  },

  splitter: {
    controls: ["orientation", "isDisabled"],
    file: "components/splitter/splitter-root.vue",
    node: {
      children: [
        {
          children: ["Sidebar"],
          props: {
            class: "grid h-full place-items-center text-sm",
            "default-size": "1fr",
            "min-size": "80px",
          },
          tag: "SplitterPanel",
        },
        { tag: "SplitterHandle" },
        {
          children: ["Editor"],
          props: {
            class: "grid h-full place-items-center text-sm",
            "default-size": "2fr",
            "min-size": "80px",
          },
          tag: "SplitterPanel",
        },
      ],
      props: {
        "aria-label": "Editor layout",
        class: "h-48 w-full max-w-sm overflow-hidden rounded-xl border border-[var(--border)]",
      },
      root: true,
      tag: "Splitter",
    },
  },

  surface: {
    controls: ["variant"],
    file: "components/surface/surface-root.vue",
    node: {
      children: [
        { children: ["Weekly report"], props: { type: "h4" }, tag: "Typography" },
        {
          children: ["Open rate held steady across the last four sends."],
          props: { color: "muted", type: "body-sm" },
          tag: "Typography",
        },
      ],
      props: { class: "flex w-72 flex-col gap-2 rounded-2xl p-6" },
      root: true,
      tag: "Surface",
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

  "tag-group": {
    controls: ["variant", "size", "selectionMode"],
    file: "components/tag-group/tag-group-root.vue",
    node: {
      children: [
        { children: ["Categories"], tag: "Label" },
        {
          children: [
            { children: ["News"], props: { id: "news" }, tag: "Tag" },
            { children: ["Travel"], props: { id: "travel" }, tag: "Tag" },
            { children: ["Gaming"], props: { id: "gaming" }, tag: "Tag" },
          ],
          tag: "TagGroupList",
        },
      ],
      root: true,
      tag: "TagGroup",
    },
  },

  textarea: {
    controls: ["variant", "size", "fullWidth"],
    file: "components/textarea/textarea-root.vue",
    node: {
      props: { placeholder: "What changed in this release?" },
      root: true,
      tag: "TextArea",
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

  "toggle-button": {
    controls: ["variant", "size", "isIconOnly", "isDisabled"],
    file: "components/toggle-button/toggle-button-root.vue",
    node: { children: ["Follow"], root: true, tag: "ToggleButton" },
  },

  "toggle-button-group": {
    controls: ["selectionMode", "size", "orientation", "isDetached", "fullWidth", "isDisabled"],
    file: "components/toggle-button-group/toggle-button-group-root.vue",
    node: {
      children: [
        { children: ["Bold"], props: { id: "bold" }, tag: "ToggleButton" },
        {
          children: [{ tag: "ToggleButtonGroupSeparator" }, "Italic"],
          props: { id: "italic" },
          tag: "ToggleButton",
        },
      ],
      props: { "aria-label": "Text style", defaultSelectedKeys: ["bold"] },
      root: true,
      tag: "ToggleButtonGroup",
    },
  },

  toolbar: {
    controls: ["orientation", "isAttached"],
    file: "components/toolbar/toolbar-root.vue",
    node: {
      children: [
        { children: ["Undo"], props: { variant: "secondary" }, tag: "Button" },
        { children: ["Redo"], props: { variant: "secondary" }, tag: "Button" },
        { tag: "Separator" },
        { children: ["Publish"], tag: "Button" },
      ],
      props: { "aria-label": "Document actions" },
      root: true,
      tag: "Toolbar",
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
  animationType: ["shimmer", "pulse", "none"],
  "button.type": ["button", "submit", "reset"],
  "card.variant": ["default", "secondary", "tertiary", "transparent"],
  color: ["default", "accent", "success", "warning", "danger"],
  "color-swatch-picker.size": ["xs", "sm", "md", "lg", "xl"],
  "color-swatch-picker.variant": ["circle", "square"],
  "color-swatch.size": ["xs", "sm", "md", "lg", "xl"],
  layout: ["grid", "stack"],
  placement: ["top-right", "top-left", "bottom-right", "bottom-left"],
  selectionMode: ["none", "single", "multiple"],
  "separator.variant": ["default", "secondary", "tertiary"],
  size: ["sm", "md", "lg"],
  status: ["default", "accent", "success", "warning", "danger"],
  "surface.variant": ["default", "secondary", "tertiary", "transparent"],
  // `ghost` is ranked by the shared list, which would otherwise put it ahead of the default.
  "toggle-button.variant": ["default", "ghost"],
  "typography.type": ["h1", "h2", "h3", "h4", "h5", "h6", "body", "body-sm", "body-xs", "code"],
  variant: ["primary", "secondary", "tertiary", "outline", "ghost", "danger", "danger-soft"],
  visibility: ["auto", "both", "top", "bottom", "left", "right", "none"],
  weight: ["normal", "medium", "semibold", "bold"],
};
