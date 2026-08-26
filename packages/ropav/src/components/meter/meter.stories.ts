import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { Label } from "../label";

import { Meter, MeterFill, MeterOutput, MeterTrack } from "./index";

const components = { Label, Meter, MeterFill, MeterOutput, MeterTrack };

const meta: StoryMeta = {
  argTypes: {
    color: { control: "select", options: ["default", "accent", "success", "warning", "danger"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
  component: Meter,
  decorators: [() => ({ template: '<div class="w-96 p-8"><story /></div>' })],
  parameters: {
    /**
     * `role="meter progressbar"` is an ARIA fallback role list, and axe does not implement them:
     * measured, `role="meter"` and `role="progressbar"` each pass on their own, while any two-token
     * list is rejected - including `"progressbar meter"`, whose first token axe accepts alone. The
     * markup is right and the tool is short, so the rule is scoped off here rather than the
     * fallback being dropped for assistive technology that predates `meter`.
     */
    a11y: { options: { rules: { "aria-allowed-attr": { enabled: false } } } },
    layout: "centered",
  },
  title: "Components/Feedback/Meter",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <Meter v-bind="args" :value="60">
        <Label>Storage</Label>
        <MeterOutput />
        <MeterTrack><MeterFill /></MeterTrack>
      </Meter>
    `,
  }),
};

export const Sizes: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="flex w-full flex-col gap-6">
        <Meter v-bind="args" size="sm" :value="40">
          <Label>Small</Label><MeterOutput /><MeterTrack><MeterFill /></MeterTrack>
        </Meter>
        <Meter v-bind="args" size="md" :value="60">
          <Label>Medium</Label><MeterOutput /><MeterTrack><MeterFill /></MeterTrack>
        </Meter>
        <Meter v-bind="args" size="lg" :value="80">
          <Label>Large</Label><MeterOutput /><MeterTrack><MeterFill /></MeterTrack>
        </Meter>
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
        <Meter v-bind="args" color="default" :value="50">
          <Label>Default</Label><MeterOutput /><MeterTrack><MeterFill /></MeterTrack>
        </Meter>
        <Meter v-bind="args" color="accent" :value="50">
          <Label>Accent</Label><MeterOutput /><MeterTrack><MeterFill /></MeterTrack>
        </Meter>
        <Meter v-bind="args" color="success" :value="50">
          <Label>Success</Label><MeterOutput /><MeterTrack><MeterFill /></MeterTrack>
        </Meter>
        <Meter v-bind="args" color="warning" :value="50">
          <Label>Warning</Label><MeterOutput /><MeterTrack><MeterFill /></MeterTrack>
        </Meter>
        <Meter v-bind="args" color="danger" :value="50">
          <Label>Danger</Label><MeterOutput /><MeterTrack><MeterFill /></MeterTrack>
        </Meter>
      </div>
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
      <Meter
        v-bind="args"
        :format-options="formatOptions"
        :max-value="1000"
        :min-value="0"
        :value="750"
      >
        <Label>Revenue</Label><MeterOutput /><MeterTrack><MeterFill /></MeterTrack>
      </Meter>
    `,
  }),
};

export const WithoutLabel: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <Meter v-bind="args" aria-label="Storage usage" :value="45">
        <MeterTrack><MeterFill /></MeterTrack>
      </Meter>
    `,
  }),
};
