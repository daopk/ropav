import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3";

import { Label } from "../label";

import {
  ProgressCircle,
  ProgressCircleFillCircle,
  ProgressCircleTrack,
  ProgressCircleTrackCircle,
} from "./index";

const components = {
  Label,
  ProgressCircle,
  ProgressCircleFillCircle,
  ProgressCircleTrack,
  ProgressCircleTrackCircle,
};

const meta: StoryMeta = {
  argTypes: {
    color: { control: "select", options: ["default", "accent", "success", "warning", "danger"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
  component: ProgressCircle,
  parameters: { layout: "centered" },
  title: "Components/Feedback/ProgressCircle",
};

export default meta;

type Story = StoryObj<typeof meta>;

const template = (rootProps: string) => `
  <ProgressCircle v-bind="args" aria-label="Loading" ${rootProps}>
    <ProgressCircleTrack>
      <ProgressCircleTrackCircle />
      <ProgressCircleFillCircle />
    </ProgressCircleTrack>
  </ProgressCircle>
`;

export const Default: Story = {
  render: (args) => ({ components, setup: () => ({ args }), template: template(':value="60"') }),
};

export const Sizes: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="flex items-center gap-6">
        ${template('size="sm" :value="40"')}
        ${template('size="md" :value="60"')}
        ${template('size="lg" :value="80"')}
      </div>
    `,
  }),
};

export const Colors: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="flex items-center gap-6">
        ${template('color="default" :value="60"')}
        ${template('color="accent" :value="60"')}
        ${template('color="success" :value="60"')}
        ${template('color="warning" :value="60"')}
        ${template('color="danger" :value="60"')}
      </div>
    `,
  }),
};

export const Indeterminate: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: template("is-indeterminate"),
  }),
};

export const WithLabel: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="flex items-center gap-3">
        ${template(':value="75"')}
        <Label>75% Complete</Label>
      </div>
    `,
  }),
};
