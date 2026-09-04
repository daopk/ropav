import type { Color } from "../../utils/color-types";
import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { shallowRef } from "vue";

import { parseColor } from "../../utils/color";
import { ColorSwatch } from "../color-swatch";

import { ColorArea, ColorAreaThumb } from "./index";

// Registered part by part: a story template is compiled at runtime, with no binding metadata to
// resolve `ColorAreaThumb` through, so dot notation cannot be used here.
const components = {
  ColorArea: ColorArea,
  ColorAreaThumb,
  ColorSwatch: ColorSwatch,
};

const meta: StoryMeta = {
  argTypes: {
    showDots: {
      control: "boolean",
    },
  },
  component: ColorArea,
  parameters: {
    layout: "centered",
  },
  title: "Components/Colors/ColorArea",
};

export default meta;

type Story = StoryObj<typeof meta>;

const defaultArgs = { showDots: false };

export const Default: Story = {
  args: defaultArgs,
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="w-[300px]">
        <ColorArea v-bind="args">
          <ColorAreaThumb />
        </ColorArea>
      </div>
    `,
  }),
};

export const WithDots: Story = {
  args: defaultArgs,
  // `showDots` is forced into the bound object rather than written as a static `show-dots` beside
  // `v-bind="args"`: a story template is compiled at runtime, and there the bound object wins over
  // a static attribute — so the control's `false` would quietly beat the story's own intent.
  render: (args) => ({
    components,
    setup: () => ({ args: { ...args, showDots: true } }),
    template: `
      <div class="w-[300px]">
        <ColorArea v-bind="args">
          <ColorAreaThumb />
        </ColorArea>
      </div>
    `,
  }),
};

export const Controlled: Story = {
  args: defaultArgs,
  render: () => ({
    components,
    setup: () => {
      const color = shallowRef<Color>(parseColor("hsl(50, 100%, 50%)"));

      return { color, onChange: (value: Color) => (color.value = value) };
    },
    template: `
      <div class="flex w-full flex-col gap-4">
        <ColorArea :value="color" @change="onChange">
          <ColorAreaThumb />
        </ColorArea>
        <p class="w-full min-w-[300px] text-sm text-muted">
          Current color: <span class="font-medium">{{ color.toString("hsl") }}</span>
        </p>
      </div>
    `,
  }),
};

export const ColorChannels: Story = {
  args: defaultArgs,
  render: () => ({
    components,
    template: `
      <div class="flex flex-col gap-8">
        <div class="flex flex-col gap-2">
          <p class="text-sm font-medium text-muted">HSB: Saturation vs Brightness (default)</p>
          <ColorArea default-value="hsl(30, 100%, 50%)">
            <ColorAreaThumb />
          </ColorArea>
        </div>
        <div class="flex flex-col gap-2">
          <p class="text-sm font-medium text-muted">RGB: Red vs Green</p>
          <ColorArea default-value="rgb(255, 100, 50)" x-channel="red" y-channel="green">
            <ColorAreaThumb />
          </ColorArea>
        </div>
        <div class="flex flex-col gap-2">
          <p class="text-sm font-medium text-muted">RGB: Blue vs Green</p>
          <ColorArea default-value="rgb(50, 100, 255)" x-channel="blue" y-channel="green">
            <ColorAreaThumb />
          </ColorArea>
        </div>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  args: defaultArgs,
  render: () => ({
    components,
    template: `
      <div class="w-[300px]">
        <ColorArea default-value="hsl(200, 100%, 50%)" is-disabled>
          <ColorAreaThumb />
        </ColorArea>
      </div>
    `,
  }),
};

export const WithColorPreview: Story = {
  args: defaultArgs,
  render: () => ({
    components,
    setup: () => {
      const color = shallowRef<Color>(parseColor("hsl(200, 100%, 50%)"));

      return { color, onChange: (value: Color) => (color.value = value) };
    },
    template: `
      <div class="flex min-w-[300px] flex-col gap-4">
        <ColorArea show-dots :value="color" @change="onChange">
          <ColorAreaThumb />
        </ColorArea>
        <div class="flex items-center gap-3">
          <ColorSwatch :color="color.toString('css')" size="lg" />
          <div class="flex flex-col gap-0.5">
            <span class="text-sm font-medium">{{ color.toString("hsl") }}</span>
            <span class="text-xs text-muted">{{ color.toString("hex") }}</span>
          </div>
        </div>
      </div>
    `,
  }),
};
