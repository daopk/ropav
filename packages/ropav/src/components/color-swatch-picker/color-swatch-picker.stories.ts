import type { Color } from "../../utils/color-types";
import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3";

import { shallowRef } from "vue";
import IconStarFill from "~icons/gravity-ui/star-fill";

import { parseColor } from "../../utils/color";

import {
  ColorSwatchPickerIndicator,
  ColorSwatchPickerItem,
  ColorSwatchPickerRoot,
  ColorSwatchPickerSwatch,
} from "./index";

// Registered under flat names: a story template is compiled at runtime with no binding metadata,
// so a dotted tag would be looked up as a component literally named "ColorSwatchPicker.Item".
const components = {
  ColorSwatchPicker: ColorSwatchPickerRoot,
  ColorSwatchPickerIndicator,
  ColorSwatchPickerItem,
  ColorSwatchPickerSwatch,
};

const meta: StoryMeta = {
  argTypes: {
    layout: {
      control: "select",
      options: ["grid", "stack"],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
    },
    variant: {
      control: "select",
      options: ["circle", "square"],
    },
  },
  component: ColorSwatchPickerRoot,
  parameters: {
    layout: "centered",
  },
  title: "Components/Colors/ColorSwatchPicker",
};

export default meta;

type Story = StoryObj<typeof meta>;

const defaultColors = ["#F43F5E", "#D946EF", "#8B5CF6", "#3B82F6", "#06B6D4", "#10B981", "#84CC16"];

/** The swatches, written once — every story lays out the same set of items. */
const SWATCHES = `
  <ColorSwatchPickerItem v-for="color in colors" :key="color" :color="color">
    <ColorSwatchPickerSwatch />
    <ColorSwatchPickerIndicator />
  </ColorSwatchPickerItem>
`;

export const Default: Story = {
  args: { layout: "grid", size: "md", variant: "circle" },
  render: (args) => ({
    components,
    setup: () => ({ args, colors: defaultColors }),
    template: `
      <ColorSwatchPicker v-bind="args">${SWATCHES}</ColorSwatchPicker>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components,
    setup: () => ({ colors: defaultColors, sizes: ["xs", "sm", "md", "lg", "xl"] }),
    template: `
      <div class="flex flex-col gap-8">
        <div v-for="size in sizes" :key="size" class="flex flex-col gap-2">
          <span class="text-sm font-medium text-muted capitalize">{{ size }}</span>
          <ColorSwatchPicker :size="size">${SWATCHES}</ColorSwatchPicker>
        </div>
      </div>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    components,
    setup: () => ({ colors: defaultColors, variants: ["circle", "square"] }),
    template: `
      <div class="flex flex-col gap-8">
        <div v-for="variant in variants" :key="variant" class="flex flex-col gap-2">
          <span class="text-sm font-medium text-muted capitalize">{{ variant }}</span>
          <ColorSwatchPicker :variant="variant">${SWATCHES}</ColorSwatchPicker>
        </div>
      </div>
    `,
  }),
};

export const Layouts: Story = {
  render: () => ({
    components,
    setup: () => ({ colors: defaultColors, layouts: ["grid", "stack"] }),
    template: `
      <div class="flex flex-col gap-8">
        <div v-for="layout in layouts" :key="layout" class="flex flex-col gap-2">
          <span class="text-sm font-medium text-muted capitalize">{{ layout }}</span>
          <ColorSwatchPicker :layout="layout">${SWATCHES}</ColorSwatchPicker>
        </div>
      </div>
    `,
  }),
};

export const AllVariants: Story = {
  render: () => ({
    components,
    setup: () => ({
      colors: defaultColors,
      sizes: ["xs", "sm", "md", "lg", "xl"],
      variants: ["circle", "square"],
    }),
    template: `
      <div class="flex gap-16">
        <div v-for="variant in variants" :key="variant" class="flex flex-col gap-6">
          <span class="text-sm font-semibold text-muted capitalize">{{ variant }}</span>
          <div v-for="size in sizes" :key="size" class="flex items-center gap-4">
            <span class="w-8 text-sm text-muted">{{ size }}</span>
            <ColorSwatchPicker :size="size" :variant="variant">${SWATCHES}</ColorSwatchPicker>
          </div>
        </div>
      </div>
    `,
  }),
};

export const Controlled: Story = {
  render: () => ({
    components,
    setup: () => {
      const value = shallowRef<Color>(parseColor("#F43F5E"));

      return {
        colors: defaultColors,
        onChange: (next: Color) => (value.value = next),
        value,
      };
    },
    template: `
      <div class="flex flex-col gap-4">
        <ColorSwatchPicker :value="value" @change="onChange">${SWATCHES}</ColorSwatchPicker>
        <p class="text-sm text-muted">
          Selected: <span class="font-medium">{{ value.toString("hex") }}</span>
        </p>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components,
    setup: () => ({ colors: defaultColors }),
    template: `
      <ColorSwatchPicker>
        <ColorSwatchPickerItem v-for="color in colors" :key="color" is-disabled :color="color">
          <ColorSwatchPickerSwatch />
          <ColorSwatchPickerIndicator />
        </ColorSwatchPickerItem>
      </ColorSwatchPicker>
    `,
  }),
};

export const WithDefaultValue: Story = {
  render: () => ({
    components,
    setup: () => ({ colors: defaultColors }),
    template: `
      <ColorSwatchPicker default-value="#8B5CF6">${SWATCHES}</ColorSwatchPicker>
    `,
  }),
};

export const WithCustomIndicator: Story = {
  render: () => ({
    components: { ...components, IconStarFill },
    setup: () => ({ colors: defaultColors }),
    template: `
      <ColorSwatchPicker>
        <ColorSwatchPickerItem v-for="color in colors" :key="color" :color="color">
          <ColorSwatchPickerSwatch />
          <ColorSwatchPickerIndicator>
            <IconStarFill />
          </ColorSwatchPickerIndicator>
        </ColorSwatchPickerItem>
      </ColorSwatchPicker>
    `,
  }),
};

export const ExtendedPalette: Story = {
  render: () => ({
    components,
    setup: () => ({
      colors: [
        // Reds
        "#FEE2E2",
        "#FECACA",
        "#FCA5A5",
        "#F87171",
        "#EF4444",
        "#DC2626",
        // Oranges
        "#FFEDD5",
        "#FED7AA",
        "#FDBA74",
        "#FB923C",
        "#F97316",
        "#EA580C",
        // Yellows
        "#FEF3C7",
        "#FDE68A",
        "#FCD34D",
        "#FBBF24",
        "#F59E0B",
        "#D97706",
        // Greens
        "#DCFCE7",
        "#BBF7D0",
        "#86EFAC",
        "#4ADE80",
        "#22C55E",
        "#16A34A",
        // Blues
        "#DBEAFE",
        "#BFDBFE",
        "#93C5FD",
        "#60A5FA",
        "#3B82F6",
        "#2563EB",
        // Purples
        "#EDE9FE",
        "#DDD6FE",
        "#C4B5FD",
        "#A78BFA",
        "#8B5CF6",
        "#7C3AED",
        // White & Black
        "#FFFFFF",
        "#000000",
      ],
    }),
    template: `
      <div class="max-w-md">
        <ColorSwatchPicker class="gap-1" size="sm">${SWATCHES}</ColorSwatchPicker>
      </div>
    `,
  }),
};
