# Public Styles API

The Public Styles API is the supported way to restyle Ropav without depending on component DOM nesting or internal selectors. Its compatibility baseline is commit `5102a40`.

## Typed component API

Each component in the [semantic part catalog](#semantic-part-catalog) exports a runtime `*Parts` constant and its matching `*Part` union from both `ropav` and the component subpath. `classNames` and `styles` accept only those keys.

This contract applies to the cataloged, styled components, not every export from their subpaths. Headless compound primitives such as `DropdownMenuRoot`, `DropdownMenuTrigger` and `DropdownMenuContent` do not export `*Parts` or accept `classNames` and `styles`. When a primitive renders a host, style it with the forwarded `class` and `style` attributes instead.

```vue
<Button
  :class-names="{ root: $style.action, label: $style.label }"
  :styles="{ root: { minWidth: '12rem' } }"
  loading
>
    Save
</Button>
```

Objects and their values may be reactive Vue values. Values are normal Vue class and style values; they do not receive a state callback. Use the documented state attributes for state-dependent CSS.

Ropav does not expose a `vars` prop. Public CSS variables are set through CSS, the root `style` attribute, or `styles.root`.

## Merge and forwarding contract

- Classes merge as internal classes, compatibility classes, `classNames`, then root `class` attributes.
- Styles merge as internal styles, compatibility styles, `styles`, then root `style` attributes. Later stages win a duplicate property.
- `inputAttrs` styling is a compatibility stage because this escape hatch also carries non-styling behavior.
- Attributes and native listeners are forwarded exactly once to the public root host. Internal native handlers run before consumer handlers.
- Declared component events remain component events. Component-owned roles, ARIA and behavioral attributes remain authoritative.
- Composite components do not copy root attributes into their child components. Teleported roots receive attributes on the rendered host, not on the virtual teleport node.

## Semantic part catalog

Only independently useful semantic elements are public parts. Conditional parts exist only when their slot or prop renders them; consumer-owned slot content is not automatically a part.

| Component                                | Public parts                                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Accordion                                | `root`                                                                                                                                      |
| AccordionItem                            | `root`, `trigger`, `title`, `icon`, `content`                                                                                               |
| Alert                                    | `root`, `icon`, `title`, `description`, `body`, `action`, `close`                                                                           |
| AspectRatio                              | `root`                                                                                                                                      |
| Avatar                                   | `root`, `image`, `fallback`                                                                                                                 |
| Badge                                    | `root`, `left`, `label`, `right`                                                                                                            |
| Button, ButtonLink                       | `root`, `loader`, `left`, `label`, `right`                                                                                                  |
| IconButton                               | `root`, `loader`, `icon`                                                                                                                    |
| ButtonGroup                              | `root`                                                                                                                                      |
| Card                                     | `root`, `header`, `title`, `description`, `body`, `footer`                                                                                  |
| Checkbox                                 | `root`, `input`, `indicator`, `label`                                                                                                       |
| Collapse                                 | `root`, `trigger`, `content`                                                                                                                |
| ColorInput                               | `root`, `control`, `input`, `preview`, `eyeDropper`, `content`, `picker`, `pickerControl`, `pickerHandle`, `pickerSwatches`, `pickerSwatch` |
| ColorPicker                              | `root`, `label`, `control`, `handle`, `swatches`, `swatch`                                                                                  |
| ColorSwatch                              | `root`                                                                                                                                      |
| DropdownMenu                             | `root`, `trigger`, `content`, `item`, `label`, `shortcut`, `submenu`, `submenuIndicator`, `empty`                                           |
| Field                                    | `root`, `label`, `required`, `control`, `description`                                                                                       |
| FocusTrap                                | `root`                                                                                                                                      |
| Input                                    | `root`, `input`, `left`, `right`                                                                                                            |
| Modal                                    | `root`, `overlay`, `panel`, `header`, `title`, `description`, `body`, `footer`, `close`                                                     |
| NumberInput                              | `root`, `input`, `control`                                                                                                                  |
| Overlay                                  | `root`                                                                                                                                      |
| Popover, Tooltip                         | `root`, `trigger`, `content`                                                                                                                |
| Progress                                 | `root`, `label`, `value`, `track`, `indicator`                                                                                              |
| Radio                                    | `root`, `input`, `indicator`, `label`                                                                                                       |
| RadioGroup                               | `root`                                                                                                                                      |
| Select                                   | `root`, `trigger`, `value`, `indicator`, `clear`, `content`, `option`, `empty`                                                              |
| Slider                                   | `root`, `label`, `value`, `track`, `range`, `input`, `thumb`, `mark`, `markLabel`, `tooltip`                                                |
| RangeSlider                              | `root`, `label`, `value`, `track`, `range`, `input`, `thumb`, `mark`, `markLabel`, `tooltip`                                                |
| Switch                                   | `root`, `input`, `track`, `thumb`, `label`                                                                                                  |
| Tabs, TabsList, TabsTrigger, TabsContent | `root` on each component                                                                                                                    |
| Textarea                                 | `root`, `input`                                                                                                                             |
| Toast                                    | `root`, `icon`, `title`, `description`, `body`, `action`, `close`                                                                           |
| ToastViewport                            | `root`, `item`, `toast`, `toastIcon`, `toastTitle`, `toastDescription`, `toastBody`, `toastAction`, `toastClose`                            |

`ToastProvider` renders no DOM and therefore has no Styles API.

## State attributes

Boolean states use presence semantics: the attribute value is empty when true and the attribute is absent when false or unknown. Enum values are lowercase kebab-case.

- `data-state="open|closed"`: AccordionItem, Collapse, DropdownMenu and submenus, Modal, Popover, Select and Tooltip.
- `data-state="checked|unchecked|indeterminate"`: Checkbox.
- `data-state="checked|unchecked"`: Radio and Switch.
- `data-state="active|inactive"`: TabsTrigger and TabsContent.
- `data-state="determinate|indeterminate"`: Progress.
- `data-disabled`: the effective disabled state on each applicable control, trigger, item or option.
- `data-readonly`: Input, Textarea, ColorInput and ColorPicker controls.
- `data-invalid`: form-control roots and their public input parts.
- `data-loading`: Button, ButtonLink and IconButton.
- `data-active` and `data-paused`: FocusTrap.
- `data-selected`: Select options and ColorPicker swatches.
- `data-highlighted`: Select options and DropdownMenu items.
- `data-filled`: Slider and RangeSlider marks.
- `data-track-hovered` and `data-dragging`: Slider track pointer interaction.
- `data-thumb-visibility="always|interaction|hidden"`: Slider thumb visibility behavior.
- `data-submenu`: DropdownMenu items that own children.
- `data-orientation="horizontal|vertical"`: ButtonGroup, RadioGroup, Slider, RangeSlider, Tabs and TabsList.
- `data-placement`: the final placement after collision handling; twelve placements for Popover and DropdownMenu, and a side (`top`, `right`, `bottom`, `left`) for Tooltip.
- `data-side="top|right|bottom|left"`: the side component of the final placement for Popover, DropdownMenu and Tooltip.
- `data-control="increment|decrement"`: NumberInput controls.
- `data-control="saturation|hue|opacity"`: ColorPicker controls and handles.
- `data-thumb="lower|upper|merged"`: RangeSlider inputs, thumbs and tooltips; `data-active-thumb="lower|upper"` is present on its root only while a thumb is active.
- `data-type="default|success|error|warning|info"`: toast items and Toast roots rendered by ToastViewport.
- `data-position="top-left|top-center|top-right|bottom-left|bottom-center|bottom-right"`: ToastViewport.

Active menu and listbox descendants use `data-highlighted`. Actual DOM keyboard focus should be styled with `:focus-visible`.

## Public CSS variables

The exact entries in [`styles-manifest.json`](../src/styles/styles-manifest.json) are the public contract. A design token enters that manifest only when it opts in with `$extensions.ropav.public: true`. Emitting a CSS variable is a separate runtime concern: neither emission nor a name prefix makes a variable public. Undocumented variables, underscore-prefixed variables, DOM structure and internal component selectors are not part of the public contract and may change.

The manifest contains design tokens plus a deliberately small component-geometry allowlist. Slider and RangeSlider share the `--rp-slider-*` namespace. Size presets provide fallbacks, while a consumer value wins for the individual dimension. See the generated [token table](./public-tokens.md).

Palette shades and their `*-contrast` companions are required override groups because `autoContrast` consumes the companion selected at build time. The [color override contract](./public-tokens.md#color-override-contract) documents the paired override and preset-role requirements.

## Cascade layers and migration

The layered stylesheet declares `ropav.tokens` before `ropav.components`. A layered application can establish its full order before imports:

```css
@layer reset, ropav.tokens, ropav.components, app;
```

Place global resets in `reset` and application overrides in `app`. Import order does not change precedence once the order is declared. Unlayered application rules still outrank named Ropav layers.

## Compatibility

- Typed parts, state attributes, manifest entries, geometry variables and cascade layers form the current Public Styles API.
- Renaming or removing a documented part, state attribute or variable changes the public contract.
- Adding a public part, state attribute or variable extends the public contract.
- `tokens:check` compares the current manifest with the latest reachable `v*` release tag that contains one. Until the first such release, it uses the immutable manifest from the initial Public Styles API commit (`f16e826`). Released variables cannot be removed, renamed or changed semantically; adding a variable requires incrementing the manifest's `contractVersion`.
- Release tags must be available in the Git checkout that runs the check. `PUBLIC_STYLES_BASELINE_REF` can explicitly pin a commit or tag that contains a manifest.
- Internal DOM, selectors and undocumented variables are outside the public contract.
