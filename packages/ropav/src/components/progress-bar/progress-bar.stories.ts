import type {StoryMeta} from "../../utils/story-meta";
import type {StoryObj} from "@storybook/vue3";

import {Label} from "../label";

import {ProgressBar, ProgressBarFill, ProgressBarOutput, ProgressBarTrack} from "./index";

const components = {Label, ProgressBar, ProgressBarFill, ProgressBarOutput, ProgressBarTrack};

const meta: StoryMeta = {
  argTypes: {
    color: {control: "select", options: ["default", "accent", "success", "warning", "danger"]},
    size: {control: "select", options: ["sm", "md", "lg"]},
  },
  component: ProgressBar,
  decorators: [() => ({template: '<div class="w-96 p-8"><story /></div>'})],
  parameters: {layout: "centered"},
  title: "Components/Feedback/ProgressBar",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({args}),
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
    setup: () => ({args}),
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
    setup: () => ({args}),
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
    setup: () => ({args}),
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
      formatOptions: {currency: "USD", style: "currency"} as Intl.NumberFormatOptions,
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
    setup: () => ({args}),
    template: `
      <ProgressBar v-bind="args" aria-label="Loading progress" :value="45">
        <ProgressBarTrack><ProgressBarFill /></ProgressBarTrack>
      </ProgressBar>
    `,
  }),
};
