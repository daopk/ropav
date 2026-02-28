# Ropav Codebase Summary

## 1. Project Overview

**Ropav** (Vapor reversed) is an experimental Vue 3 UI component library built for **Vue Vapor** (Vue's new compiler/runtime mode). It uses design tokens and CSS custom properties for theming.

| Property | Value |
|----------|-------|
| **Package name** | `ropav` |
| **Version** | `0.1.0-alpha.2` |
| **Type** | ESM (`"type": "module"`) |
| **Package manager** | pnpm 10.30.1 |

**Peer dependencies:**
- `vue`: `^3.6.0-beta.4` (Vue 3 with Vapor)

**Dev dependencies:** TypeScript ~5.9.3, Vite (beta), vue-tsc, @vitejs/plugin-vue, vite-plugin-dts, sass-embedded, Storybook 10, @storybook/addon-themes.

---

## 2. Tech Stack

| Technology | Usage |
|------------|-------|
| **Vue 3** | Beta with Vapor mode (`<script setup vapor>`) |
| **TypeScript** | Strict mode, `erasableSyntaxOnly: true` for Vapor |
| **SCSS** | Styles with `sass-embedded` |
| **Vite** | Beta, library build |
| **Storybook** | 10.x with Vue 3 Vite, addon-themes for light/dark |
| **Vapor interop** | `vaporInteropPlugin` for Storybook (Vapor ↔ VDOM) |

---

## 3. Directory Structure

```
src/
├── index.ts                    # Main entry - re-exports all components
├── composables/
│   └── useClickOutside.ts      # Click-outside handler for dropdowns, modals, etc.
├── utils/
│   └── bem.ts                  # BEM class name helper
├── styles/
│   ├── base.scss               # Entry - loads tokens (CSS custom properties)
│   ├── _tokens.scss            # :root + html.dark token definitions
│   ├── _variables.scss         # SCSS variables (colors, spacing, typography, etc.)
│   └── _mixins.scss            # SCSS mixins (flex-center, focus-ring, visually-hidden)
└── components/
    ├── _internal/              # Internal-only (not exported)
    │   └── icons/
    │       ├── index.ts        # Icon exports
    │       ├── AlertIcon.vue
    │       ├── CheckIcon.vue
    │       ├── ChevronDownIcon.vue
    │       ├── ChevronLeftIcon.vue
    │       ├── ChevronRightIcon.vue
    │       ├── CloseIcon.vue
    │       ├── CopyIcon.vue
    │       ├── EllipsisIcon.vue
    │       ├── EyeIcon.vue
    │       ├── EyeOffIcon.vue
    │       ├── InfoIcon.vue
    │       ├── MinusIcon.vue
    │       └── SuccessIcon.vue
    ├── alert/
    ├── avatar/
    ├── badge/
    ├── button/
    ├── card/
    ├── checkbox/
    ├── collapse/
    ├── divider/
    ├── dropdown/
    ├── field/
    ├── input/
    ├── modal/
    ├── pagination/
    ├── radio/
    ├── select/
    ├── skeleton/
    ├── spinner/
    ├── switch/
    ├── tabs/
    ├── tag/
    ├── textarea/
    └── tooltip/
```

**Per-component pattern:**
- `types.ts` – Props interfaces, context types, injection keys
- `*.vue` – Main component(s)
- `index.ts` – Public exports
- `*.stories.ts` – Storybook stories (optional)

---

## 4. Design System

### Design Tokens (SCSS → CSS Custom Properties)

**Source:** `_variables.scss` → `_tokens.scss` → `base.scss`

**Pattern:** SCSS variables with `!default` → `:root` CSS vars with `--rp-*` prefix. Dark mode via `html.dark` overrides.

| Category | Tokens |
|----------|--------|
| **Font family** | `$font-family-base` → `--rp-font-family` (system font stack) |
| **Colors** | Primary, secondary, success, warning, danger, info; gray-50–900; text, border, background, focus-ring, surface, overlay |
| **Font sizes** | xs (12px), sm (14px), base (16px), lg (18px), xl (20px), 2xl (24px), 3xl (30px) |
| **Font weights** | normal (400), medium (500), semibold (600), bold (700) |
| **Spacing** | 0, 1 (4px), 2 (8px), 3 (12px), 4 (16px), 5 (20px), 6 (24px), 8 (32px), 10 (40px), 12 (48px) |
| **Border radius** | none, sm (2px), base (4px), md (6px), lg (8px), xl (12px), 2xl (16px), full |
| **Component sizes** | sm (32px), md (40px), lg (48px) |
| **Shadows** | sm, base, md, lg |
| **Transitions** | fast (150ms), base (200ms), slow (300ms) |

### SCSS Mixins (`_mixins.scss`)

- `@mixin flex-center` – inline-flex, center alignment
- `@mixin focus-ring` – primary border + focus ring
- `@mixin visually-hidden` – accessible hide

### CSS Custom Properties Pattern

- All tokens exposed as `--rp-*` on `:root`
- `html.dark` overrides for dark mode (text, background, surface, overlay, gray scale, shadows)
- Components use `var(--rp-*)` in scoped SCSS
- Vite injects `@use "@/styles/variables" as *` and `@use "@/styles/mixins" as *` into every SCSS file

---

## 5. Component Architecture

### File Pattern

| File | Purpose |
|------|---------|
| `types.ts` | Props interfaces, context types |
| `component.vue` | Main component |
| `index.ts` | `export { default as X } from "./x.vue"` and `export type { XProps } from "./types"` |
| `*.stories.ts` | Storybook stories |

Compound components (e.g. dropdown) use multiple `.vue` files and a single `types.ts`.

### Naming Conventions

- **Component names:** `RpXxx` (e.g. `RpButton`, `RpInput`)
- **CSS classes:** BEM with `rp-` prefix (e.g. `rp-button`, `rp-button__label`, `rp-button--solid`)
- **Design tokens:** `--rp-*` (e.g. `--rp-color-primary`, `--rp-spacing-2`)

### Props / Emits / Slots

- **Props:** `defineProps<XProps>()` with `withDefaults()`
- **Emits:** `defineEmits<{ 'event': [payload] }>()`
- **Slots:** Named slots (e.g. `prefix`, `suffix`, `icon`, `title`) and default slot
- **Vapor:** All components use `<script lang="ts" setup vapor>`

---

## 6. All Components

| Component | Description | Props |
|-----------|-------------|-------|
| **Alert** | Alert message with icon and optional close | `color`, `variant`, `closable`, `title` |
| **Avatar** | User avatar (image or initials) | `src`, `alt`, `name`, `size`, `shape` |
| **Badge** | Badge/count indicator | `content`, `max`, `dot`, `bordered`, `placement`, `color`, `size`, `show` |
| **Button** | Button with variants and loading | `variant`, `color`, `size`, `type`, `disabled`, `loading`, `block` |
| **Card** | Card container | `variant`, `size`, `header`, `footer`, `showHeader`, `showFooter` |
| **Checkbox** | Checkbox input | `modelValue`, `label`, `size`, `disabled`, `indeterminate` |
| **Collapse** | Accordion/collapsible content | `modelValue`, `accordion` |
| **CollapseItem** | Single collapsible item | `name`, `title`, `disabled` |
| **Divider** | Horizontal/vertical divider | `orientation`, `label`, `labelPosition` |
| **Dropdown** | Dropdown container | `size` |
| **DropdownContent** | Dropdown panel | `align` |
| **DropdownItem** | Dropdown menu item | `disabled`, `destructive`, `shortcut` |
| **DropdownCheckboxItem** | Checkbox item in dropdown | `modelValue`, `disabled` |
| **DropdownRadioGroup** | Radio group in dropdown | `modelValue` |
| **DropdownRadioItem** | Radio item in dropdown | `value`, `disabled` |
| **DropdownTrigger** | Dropdown trigger | — |
| **DropdownSeparator** | Separator in dropdown | — |
| **DropdownLabel** | Label in dropdown | — |
| **DropdownSub** | Nested submenu | — |
| **DropdownSubTrigger** | Submenu trigger | — |
| **DropdownSubContent** | Submenu content | — |
| **Field** | Form field wrapper (label, description, error) | `label`, `description`, `error`, `success`, `required`, `disabled`, `size` |
| **Input** | Text input | `modelValue`, `type`, `placeholder`, `size`, `disabled`, `readonly`, `clearable`, `copyable`, `viewable`, `block` |
| **Modal** | Modal dialog | `modelValue`, `title`, `footer`, `showFooter`, `size`, `closable`, `closeOnOverlay`, `closeOnEscape` |
| **Pagination** | Pagination controls | `modelValue`, `total`, `pageSize`, `siblingCount`, `size`, `disabled` |
| **Radio** | Radio option | `value`, `label`, `disabled` |
| **RadioGroup** | Radio group | `modelValue`, `size`, `disabled`, `direction` |
| **Select** | Select dropdown | `modelValue`, `options`, `placeholder`, `disabled`, `clearable`, `searchable`, `size`, `block` |
| **Skeleton** | Loading skeleton | `variant`, `width`, `height`, `animate` |
| **Spinner** | Loading spinner | `size`, `color` |
| **Switch** | Toggle switch | `modelValue`, `label`, `size`, `disabled` |
| **Tabs** | Tab container | `modelValue`, `size`, `variant` |
| **TabPanel** | Tab panel | `name`, `label`, `disabled` |
| **Tag** | Tag/chip | `variant`, `color`, `size`, `closable` |
| **Textarea** | Multi-line text input | `modelValue`, `placeholder`, `rows`, `size`, `disabled`, `readonly`, `resize`, `block` |
| **Tooltip** | Tooltip popover | `content`, `placement`, `delay`, `disabled` |

---

## 7. Shared Utilities

### `bem.ts`

```typescript
function bem(block: string, ...modifiers: BemModifier[]): string[]
```

- `BemModifier` = `string | Record<string, boolean | undefined>`
- Returns `[block, block--mod1, block--mod2, ...]` for truthy modifiers
- Used for root classes: `bem('rp-button', props.variant, props.color, props.size, { block: props.block })`

### `useClickOutside.ts`

```typescript
function useClickOutside(
  target: Ref<HTMLElement | null>,
  active: Ref<boolean>,
  callback: () => void
)
```

- Adds document click listener when `active` is true
- Calls `callback` when click is outside `target`
- Used by Dropdown, Modal, Select, Tooltip

### Internal Icons

SVG icons in `components/_internal/icons/`:
AlertIcon, CheckIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, CopyIcon, EllipsisIcon, EyeIcon, EyeOffIcon, InfoIcon, MinusIcon, SuccessIcon.

---

## 8. Build & Packaging

### Vite Config

- **Entry points:** `src/index.ts`, `src/styles/base.scss`, and per-component `src/components/*/index.ts`
- **Output:** ES modules only
- **CSS:** `cssCodeSplit: true` (per-component CSS chunks)
- **Plugins:** @vitejs/plugin-vue, vite-plugin-dts, custom `injectComponentCss`
- **SCSS:** `additionalData` injects `@use "@/styles/variables" as *` and `@use "@/styles/mixins" as *`
- **Alias:** `@` → `src/`
- **External:** `vue` marked external

### `injectComponentCss` Plugin

Runs in build when building a library. Injects `import './chunk.css'` at the top of each JS chunk that imports CSS. Ensures component CSS is loaded when importing individual components.

### Package.json Exports

```json
{
  ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
  "./*": { "types": "./dist/components/*/index.d.ts", "import": "./dist/components/*/index.js" },
  "./base.css": "./dist/base.css",
  "./scss/*": "./src/styles/*"
}
```

- `ropav` – full library
- `ropav/button`, `ropav/alert`, etc. – per-component imports
- `ropav/base.css` – design tokens
- `ropav/scss/_variables.scss`, `ropav/scss/_tokens.scss` – SCSS source for overrides

---

## 9. Styling Conventions

| Convention | Details |
|------------|---------|
| **Scoped SCSS** | All components use `<style lang="scss" scoped>` |
| **BEM + rp- prefix** | Block: `rp-button`, element: `rp-button__label`, modifier: `rp-button--solid` |
| **Design tokens** | Use `var(--rp-*)` (e.g. `var(--rp-color-primary)`, `var(--rp-spacing-2)`) |
| **Mixins** | `@include flex-center`, `@include focus-ring`, `@include visually-hidden` |
| **Dark mode** | `html.dark` overrides in `_tokens.scss`; Storybook uses `withThemeByClassName` |
| **No hardcoded values** | Colors, spacing, radius, etc. come from tokens |
