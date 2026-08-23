import type { Color } from "../../utils/color-types";
import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { shallowRef } from "vue";

import { parseColor } from "../../utils/color";
import { ColorSwatchRoot } from "../color-swatch";
import { Label } from "../label";

import { ColorSliderOutput, ColorSliderRoot, ColorSliderThumb, ColorSliderTrack } from "./index";

// Registered part by part: a story template is compiled at runtime, with no binding metadata to
// resolve `ColorSlider.Track` through, so dot notation cannot be used here.
const components = {
  ColorSlider: ColorSliderRoot,
  ColorSliderOutput,
  ColorSliderThumb,
  ColorSliderTrack,
  ColorSwatch: ColorSwatchRoot,
  Label,
};

const meta: StoryMeta = {
  argTypes: {
    channel: {
      control: { type: "select" },
      options: ["hue", "saturation", "brightness", "lightness", "alpha", "red", "green", "blue"],
    },
    colorSpace: {
      control: { type: "select" },
      options: ["hsl", "hsb", "rgb"],
    },
    isDisabled: {
      control: { type: "boolean" },
    },
    orientation: {
      control: { type: "select" },
      options: ["horizontal", "vertical"],
    },
  },
  component: ColorSliderRoot,
  decorators: [() => ({ template: '<div class="w-64 p-8"><story /></div>' })],
  parameters: {
    layout: "centered",
  },
  title: "Components/Colors/ColorSlider",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    channel: "hue",
    colorSpace: "hsl",
    defaultValue: "hsl(0, 100%, 50%)",
    isDisabled: false,
    orientation: "horizontal",
  },
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div :class="args.orientation === 'vertical' ? 'h-64' : undefined">
        <ColorSlider v-bind="args">
          <Label>Hue</Label>
          <ColorSliderOutput />
          <ColorSliderTrack>
            <ColorSliderThumb />
          </ColorSliderTrack>
        </ColorSlider>
      </div>
    `,
  }),
};

export const SaturationChannel: Story = {
  args: {
    channel: "saturation",
    colorSpace: "hsl",
    defaultValue: "hsl(0, 100%, 50%)",
  },
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <ColorSlider v-bind="args">
        <Label>Saturation</Label>
        <ColorSliderOutput />
        <ColorSliderTrack>
          <ColorSliderThumb />
        </ColorSliderTrack>
      </ColorSlider>
    `,
  }),
};

export const LightnessChannel: Story = {
  args: {
    channel: "lightness",
    colorSpace: "hsl",
    defaultValue: "hsl(0, 100%, 50%)",
  },
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <ColorSlider v-bind="args">
        <Label>Lightness</Label>
        <ColorSliderOutput />
        <ColorSliderTrack>
          <ColorSliderThumb />
        </ColorSliderTrack>
      </ColorSlider>
    `,
  }),
};

export const AlphaChannel: Story = {
  args: {
    channel: "alpha",
    colorSpace: "hsl",
    defaultValue: "hsla(0, 100%, 50%, 0.5)",
  },
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <ColorSlider v-bind="args">
        <Label>Alpha</Label>
        <ColorSliderOutput />
        <ColorSliderTrack>
          <ColorSliderThumb />
        </ColorSliderTrack>
      </ColorSlider>
    `,
  }),
};

export const RGBChannels: Story = {
  render: () => ({
    components,
    setup: () => {
      const color = shallowRef<Color>(parseColor("rgb(255, 0, 0)"));

      return { color, onChange: (value: Color) => (color.value = value) };
    },
    template: `
      <div class="flex flex-col gap-4">
        <ColorSlider channel="red" color-space="rgb" :value="color" @change="onChange">
          <Label>Red</Label>
          <ColorSliderOutput />
          <ColorSliderTrack>
            <ColorSliderThumb />
          </ColorSliderTrack>
        </ColorSlider>
        <ColorSlider channel="green" color-space="rgb" :value="color" @change="onChange">
          <Label>Green</Label>
          <ColorSliderOutput />
          <ColorSliderTrack>
            <ColorSliderThumb />
          </ColorSliderTrack>
        </ColorSlider>
        <ColorSlider channel="blue" color-space="rgb" :value="color" @change="onChange">
          <Label>Blue</Label>
          <ColorSliderOutput />
          <ColorSliderTrack>
            <ColorSliderThumb />
          </ColorSliderTrack>
        </ColorSlider>
      </div>
    `,
  }),
};

export const Vertical: Story = {
  decorators: [() => ({ template: '<div class="flex h-64 gap-8 p-8"><story /></div>' })],
  render: () => ({
    components,
    template: `
      <ColorSlider channel="hue" default-value="hsl(0, 100%, 50%)" orientation="vertical">
        <ColorSliderTrack>
          <ColorSliderThumb />
        </ColorSliderTrack>
      </ColorSlider>
      <ColorSlider channel="saturation" default-value="hsl(0, 100%, 50%)" orientation="vertical">
        <ColorSliderTrack>
          <ColorSliderThumb />
        </ColorSliderTrack>
      </ColorSlider>
      <ColorSlider channel="lightness" default-value="hsl(0, 100%, 50%)" orientation="vertical">
        <ColorSliderTrack>
          <ColorSliderThumb />
        </ColorSliderTrack>
      </ColorSlider>
    `,
  }),
};

export const Disabled: Story = {
  args: {
    channel: "hue",
    defaultValue: "hsl(200, 100%, 50%)",
    isDisabled: true,
  },
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <ColorSlider v-bind="args">
        <Label>Hue</Label>
        <ColorSliderOutput />
        <ColorSliderTrack>
          <ColorSliderThumb />
        </ColorSliderTrack>
      </ColorSlider>
    `,
  }),
};

export const Controlled: Story = {
  render: () => ({
    components,
    setup: () => {
      const color = shallowRef<Color>(parseColor("hsl(0, 100%, 50%)"));

      return { color, onChange: (value: Color) => (color.value = value) };
    },
    template: `
      <div class="flex w-full flex-col gap-4">
        <div class="flex w-[200px] flex-col gap-4">
          <ColorSlider channel="hue" :value="color" @change="onChange">
            <Label>Hue</Label>
            <ColorSliderOutput />
            <ColorSliderTrack>
              <ColorSliderThumb />
            </ColorSliderTrack>
          </ColorSlider>
          <ColorSlider channel="saturation" :value="color" @change="onChange">
            <Label>Saturation</Label>
            <ColorSliderOutput />
            <ColorSliderTrack>
              <ColorSliderThumb />
            </ColorSliderTrack>
          </ColorSlider>
          <ColorSlider channel="lightness" :value="color" @change="onChange">
            <Label>Lightness</Label>
            <ColorSliderOutput />
            <ColorSliderTrack>
              <ColorSliderThumb />
            </ColorSliderTrack>
          </ColorSlider>
        </div>
        <div class="mt-3 flex w-[350px] items-center gap-3">
          <ColorSwatch :color="color" size="lg" />
          <p class="text-sm text-muted">
            Current color: <span class="font-mono">{{ color.toString("hsl") }}</span>
          </p>
        </div>
      </div>
    `,
  }),
};

export const WithoutLabel: Story = {
  args: {
    ariaLabel: "Hue",
    channel: "hue",
    defaultValue: "hsl(200, 100%, 50%)",
  },
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <ColorSlider v-bind="args">
        <ColorSliderTrack>
          <ColorSliderThumb />
        </ColorSliderTrack>
      </ColorSlider>
    `,
  }),
};
