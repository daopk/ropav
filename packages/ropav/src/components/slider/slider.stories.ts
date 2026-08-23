import type {StoryMeta} from "../../utils/story-meta";
import type {StoryObj} from "@storybook/vue3";

import {Label} from "../label";

import {Slider, SliderFill, SliderOutput, SliderThumb, SliderTrack} from "./index";

// Registered part by part: a story template is compiled at runtime, with no binding metadata
// to resolve `Slider.Track` through, so dot notation cannot be used here.
const components = {Label, Slider, SliderFill, SliderOutput, SliderThumb, SliderTrack};

const meta: StoryMeta = {
  argTypes: {
    isDisabled: {
      control: {type: "boolean"},
    },
    orientation: {
      control: {type: "select"},
      options: ["horizontal", "vertical"],
    },
  },
  component: Slider,
  decorators: [() => ({template: '<div class="w-96 p-8"><story /></div>'})],
  parameters: {
    layout: "centered",
  },
  title: "Components/Controls/Slider",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({args}),
    template: `
      <Slider :default-value="30" :is-disabled="args.isDisabled" :orientation="args.orientation">
        <Label>Volume</Label>
        <SliderOutput />
        <SliderTrack>
          <SliderFill />
          <SliderThumb />
        </SliderTrack>
      </Slider>
    `,
  }),
};

export const Vertical: Story = {
  decorators: [() => ({template: '<div class="h-96 p-8"><story /></div>'})],
  render: (args) => ({
    components,
    setup: () => ({args}),
    template: `
      <Slider :default-value="30" :is-disabled="args.isDisabled" orientation="vertical">
        <Label>Volume</Label>
        <SliderOutput />
        <SliderTrack>
          <SliderFill />
          <SliderThumb />
        </SliderTrack>
      </Slider>
    `,
  }),
};

export const Disabled: Story = {
  render: (args) => ({
    components,
    setup: () => ({args}),
    template: `
      <Slider is-disabled :default-value="30" :orientation="args.orientation">
        <Label>Volume</Label>
        <SliderOutput />
        <SliderTrack>
          <SliderFill />
          <SliderThumb />
        </SliderTrack>
      </Slider>
    `,
  }),
};

export const Range: Story = {
  render: (args) => ({
    components,
    setup: () => ({
      args,
      formatOptions: {currency: "USD", style: "currency"} as Intl.NumberFormatOptions,
    }),
    template: `
      <Slider
        :default-value="[100, 500]"
        :format-options="formatOptions"
        :is-disabled="args.isDisabled"
        :max-value="1000"
        :min-value="0"
        :orientation="args.orientation"
        :step="50"
      >
        <Label>Price Range</Label>
        <SliderOutput />
        <SliderTrack v-slot="{values}">
          <SliderFill />
          <SliderThumb v-for="(_, index) in values" :key="index" :index="index" />
        </SliderTrack>
      </Slider>
    `,
  }),
};
