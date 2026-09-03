import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { Label } from "../label";

import { ProgressBar, ProgressBarFill, ProgressBarOutput, ProgressBarTrack } from "./index";

const components = { Label, ProgressBar, ProgressBarFill, ProgressBarOutput, ProgressBarTrack };

const meta: StoryMeta = {
  argTypes: {
    color: { control: "select", options: ["default", "accent", "success", "warning", "danger"] },
    isAnimated: { control: "boolean" },
    isStriped: { control: "boolean" },
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
  component: ProgressBar,
  decorators: [() => ({ template: '<div class="w-96 p-8"><story /></div>' })],
  parameters: { layout: "centered" },
  title: "Components/Feedback/ProgressBar",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <ProgressBar v-bind="args" :value="60">
        <Label>Loading</Label><ProgressBarOutput />
        <ProgressBarTrack><ProgressBarFill /></ProgressBarTrack>
      </ProgressBar>
    `,
  }),
};

export const Sizes: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="flex w-full flex-col gap-6">
        <ProgressBar v-bind="args" size="sm" :value="40">
          <Label>Small</Label><ProgressBarOutput /><ProgressBarTrack><ProgressBarFill /></ProgressBarTrack>
        </ProgressBar>
        <ProgressBar v-bind="args" size="md" :value="60">
          <Label>Medium</Label><ProgressBarOutput /><ProgressBarTrack><ProgressBarFill /></ProgressBarTrack>
        </ProgressBar>
        <ProgressBar v-bind="args" size="lg" :value="80">
          <Label>Large</Label><ProgressBarOutput /><ProgressBarTrack><ProgressBarFill /></ProgressBarTrack>
        </ProgressBar>
      </div>
    `,
  }),
};

export const Colors: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="flex w-full flex-col gap-6">
        <ProgressBar v-bind="args" color="default" :value="50">
          <Label>Default</Label><ProgressBarOutput /><ProgressBarTrack><ProgressBarFill /></ProgressBarTrack>
        </ProgressBar>
        <ProgressBar v-bind="args" color="accent" :value="50">
          <Label>Accent</Label><ProgressBarOutput /><ProgressBarTrack><ProgressBarFill /></ProgressBarTrack>
        </ProgressBar>
        <ProgressBar v-bind="args" color="success" :value="50">
          <Label>Success</Label><ProgressBarOutput /><ProgressBarTrack><ProgressBarFill /></ProgressBarTrack>
        </ProgressBar>
        <ProgressBar v-bind="args" color="warning" :value="50">
          <Label>Warning</Label><ProgressBarOutput /><ProgressBarTrack><ProgressBarFill /></ProgressBarTrack>
        </ProgressBar>
        <ProgressBar v-bind="args" color="danger" :value="50">
          <Label>Danger</Label><ProgressBarOutput /><ProgressBarTrack><ProgressBarFill /></ProgressBarTrack>
        </ProgressBar>
      </div>
    `,
  }),
};

export const Indeterminate: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <ProgressBar v-bind="args" is-indeterminate>
        <Label>Loading...</Label><ProgressBarTrack><ProgressBarFill /></ProgressBarTrack>
      </ProgressBar>
    `,
  }),
};

export const CustomValue: Story = {
  render: (args) => ({
    components,
    setup: () => ({
      args,
      formatOptions: { currency: "USD", style: "currency" } as Intl.NumberFormatOptions,
    }),
    template: `
      <ProgressBar
        v-bind="args"
        :format-options="formatOptions"
        :max-value="1000"
        :min-value="0"
        :value="750"
      >
        <Label>Revenue</Label><ProgressBarOutput />
        <ProgressBarTrack><ProgressBarFill /></ProgressBarTrack>
      </ProgressBar>
    `,
  }),
};

export const WithoutLabel: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <ProgressBar v-bind="args" aria-label="Loading progress" :value="45">
        <ProgressBarTrack><ProgressBarFill /></ProgressBarTrack>
      </ProgressBar>
    `,
  }),
};

/** The band without the travel — and what `Animated` settles into under reduced motion. */
export const Striped: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="flex w-full flex-col gap-6">
        <ProgressBar v-bind="args" is-striped size="sm" :value="60">
          <Label>Small</Label><ProgressBarOutput /><ProgressBarTrack><ProgressBarFill /></ProgressBarTrack>
        </ProgressBar>
        <ProgressBar v-bind="args" is-striped size="md" :value="60">
          <Label>Medium</Label><ProgressBarOutput /><ProgressBarTrack><ProgressBarFill /></ProgressBarTrack>
        </ProgressBar>
        <ProgressBar v-bind="args" is-striped size="lg" :value="60">
          <Label>Large</Label><ProgressBarOutput /><ProgressBarTrack><ProgressBarFill /></ProgressBarTrack>
        </ProgressBar>
      </div>
    `,
  }),
};

/** Every colour, to see whether the band separates from each fill it is mixed from. */
export const Animated: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args, colors: ["default", "accent", "success", "warning", "danger"] }),
    template: `
      <div class="flex w-full flex-col gap-6">
        <ProgressBar v-for="color in colors" :key="color" v-bind="args" :color="color" is-animated :value="65">
          <Label class="capitalize">{{ color }}</Label><ProgressBarOutput />
          <ProgressBarTrack><ProgressBarFill /></ProgressBarTrack>
        </ProgressBar>
      </div>
    `,
  }),
};

/**
 * Two animations on one bar: the fill slides, the band travels across it. They sit on different
 * boxes, so neither displaces the other.
 */
export const AnimatedIndeterminate: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="flex w-full flex-col gap-6">
        <ProgressBar v-bind="args" is-indeterminate>
          <Label>Plain</Label><ProgressBarTrack><ProgressBarFill /></ProgressBarTrack>
        </ProgressBar>
        <ProgressBar v-bind="args" is-animated is-indeterminate>
          <Label>Animated</Label><ProgressBarTrack><ProgressBarFill /></ProgressBarTrack>
        </ProgressBar>
      </div>
    `,
  }),
};
