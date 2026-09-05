import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { Skeleton } from "./index";

const components = { Skeleton };

const meta: StoryMeta = {
  argTypes: {
    animationType: {
      control: { type: "select" },
      options: ["shimmer", "pulse", "none"],
    },
  },
  component: Skeleton,
  parameters: {
    layout: "centered",
  },
  title: "Components/Feedback/Skeleton",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="bg-surface-1 w-[200px] space-y-5 rounded-3xl p-4 shadow-surface">
        <Skeleton class="h-24 rounded-xl" v-bind="args" />
        <div class="space-y-3">
          <Skeleton class="h-3 w-3/5 rounded-lg" v-bind="args" />
          <Skeleton class="h-3 w-4/5 rounded-lg" v-bind="args" />
          <Skeleton class="h-3 w-2/5 rounded-lg" v-bind="args" />
        </div>
      </div>
    `,
  }),
};

export const Grid: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="grid w-[450px] grid-cols-3 gap-4">
        <Skeleton class="h-24 rounded-xl" v-bind="args" />
        <Skeleton class="h-24 rounded-xl" v-bind="args" />
        <Skeleton class="h-24 rounded-xl" v-bind="args" />
      </div>
    `,
  }),
};

export const SingleShimmer: Story = {
  args: {
    animationType: "none",
  },
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div
        class="rp-skeleton--shimmer relative grid w-[450px] grid-cols-3 gap-4 overflow-hidden rounded-xl"
      >
        <Skeleton class="h-24 rounded-xl" v-bind="args" />
        <Skeleton class="h-24 rounded-xl" v-bind="args" />
        <Skeleton class="h-24 rounded-xl" v-bind="args" />
      </div>
    `,
  }),
};
