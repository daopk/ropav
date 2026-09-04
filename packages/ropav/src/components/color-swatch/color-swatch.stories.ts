import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { ColorSwatch } from "./index";

// Registered under a flat name: a story template is compiled at runtime with no binding metadata,
// so a dotted tag would be looked up as a component literally named "ColorSwatch".
const components = { ColorSwatch: ColorSwatch };

const meta: StoryMeta = {
  argTypes: {
    color: { control: "color" },
    shape: {
      control: "select",
      options: ["circle", "square"],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
    },
  },
  component: ColorSwatch,
  parameters: {
    layout: "centered",
  },
  title: "Components/Colors/ColorSwatch",
};

export default meta;

type Story = StoryObj<typeof meta>;

const defaultArgs = { color: "#0485F7" };

export const Default: Story = {
  args: defaultArgs,
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="flex items-center gap-3">
        <ColorSwatch class="h-5 w-5" v-bind="args" />
      </div>
    `,
  }),
};

export const Shapes: Story = {
  args: defaultArgs,
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="flex items-center gap-3">
        <ColorSwatch v-bind="args" shape="circle" />
        <ColorSwatch v-bind="args" shape="square" />
      </div>
    `,
  }),
};

export const Colors: Story = {
  args: defaultArgs,
  render: () => ({
    components,
    template: `
      <div class="flex items-center gap-3">
        <ColorSwatch aria-label="Blue" color="#0485F7" />
        <ColorSwatch aria-label="Red" color="#EF4444" />
        <ColorSwatch aria-label="Amber" color="#F59E0B" />
        <ColorSwatch aria-label="Green" color="#10B981" />
        <ColorSwatch aria-label="Fuchsia" color="#D946EF" />
      </div>
    `,
  }),
};

export const Sizes: Story = {
  args: defaultArgs,
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="flex items-center gap-3">
        <ColorSwatch v-bind="args" color="#0485F7" size="xs" />
        <ColorSwatch v-bind="args" color="#EF4444" size="sm" />
        <ColorSwatch v-bind="args" color="#F59E0B" size="md" />
        <ColorSwatch v-bind="args" color="#10B981" size="lg" />
        <ColorSwatch v-bind="args" color="#D946EF" size="xl" />
      </div>
    `,
  }),
};

export const Transparency: Story = {
  args: defaultArgs,
  render: () => ({
    components,
    template: `
      <div class="flex items-center gap-3">
        <ColorSwatch aria-label="100% opacity" color="rgba(4, 133, 247, 1)" />
        <ColorSwatch aria-label="75% opacity" color="rgba(4, 133, 247, 0.75)" />
        <ColorSwatch aria-label="50% opacity" color="rgba(4, 133, 247, 0.5)" />
        <ColorSwatch aria-label="25% opacity" color="rgba(4, 133, 247, 0.25)" />
        <ColorSwatch aria-label="0% opacity" color="rgba(4, 133, 247, 0)" />
      </div>
    `,
  }),
};

export const WithColorName: Story = {
  args: defaultArgs,
  render: () => ({
    components,
    template: `
      <div class="flex items-center gap-3">
        <ColorSwatch aria-label="Primary color" color="#0485F7" color-name="Primary blue" />
        <ColorSwatch aria-label="Danger color" color="#EF4444" color-name="Danger red" />
        <ColorSwatch aria-label="Warning color" color="#F59E0B" color-name="Warning amber" />
        <ColorSwatch aria-label="Success color" color="#10B981" color-name="Success green" />
        <ColorSwatch aria-label="Accent color" color="#D946EF" color-name="Accent fuchsia" />
      </div>
    `,
  }),
};

/**
 * React reaches the *parsed* colour through a `style` render prop. Here a caller's `style` falls
 * through and merges with the swatch's own, and the colour it needs is the one it just passed —
 * so the same three effects are written at the call site instead.
 */
export const CustomStyle: Story = {
  args: defaultArgs,
  render: () => ({
    components,
    setup: () => ({ colors: ["#0485F7", "#EF4444", "#F59E0B", "#10B981", "#D946EF"] }),
    template: `
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <h3 class="text-sm font-semibold text-muted">Custom Border</h3>
          <div class="flex items-center gap-3">
            <ColorSwatch
              v-for="color in colors"
              :key="color"
              :color="color"
              :style="{boxShadow: '0 0 0 3px ' + color + '40'}"
              size="lg"
            />
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <h3 class="text-sm font-semibold text-muted">Custom Shadow</h3>
          <div class="flex items-center gap-3">
            <ColorSwatch
              v-for="color in colors"
              :key="color"
              :color="color"
              :style="{boxShadow: '0 4px 14px ' + color + '80'}"
              size="lg"
            />
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <h3 class="text-sm font-semibold text-muted">Outline Style</h3>
          <div class="flex items-center gap-3">
            <ColorSwatch
              v-for="color in colors"
              :key="color"
              :color="color"
              :style="{boxShadow: 'inset 0 0 0 2px ' + color + ', inset 0 0 0 4px white'}"
              size="lg"
            />
          </div>
        </div>
      </div>
    `,
  }),
};

export const AllVariants: Story = {
  args: defaultArgs,
  render: () => ({
    components,
    setup: () => ({
      colors: ["#0485F7", "#EF4444", "#F59E0B", "#10B981", "#D946EF"],
      shapes: ["circle", "square"],
      sizes: ["xs", "sm", "md", "lg", "xl"],
    }),
    template: `
      <div class="flex flex-col gap-6">
        <div v-for="shape in shapes" :key="shape" class="flex flex-col gap-3">
          <h3 class="text-sm font-semibold text-muted capitalize">{{ shape }}</h3>
          <div class="flex flex-col gap-3">
            <div v-for="size in sizes" :key="size" class="flex items-center gap-3">
              <div class="w-12 text-sm text-muted">{{ size }}</div>
              <ColorSwatch
                v-for="color in colors"
                :key="color"
                :color="color"
                :shape="shape"
                :size="size"
              />
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};
