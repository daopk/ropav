import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3";

import { Spinner } from "./index";

const components = { Spinner };

const meta: StoryMeta = {
  argTypes: {
    color: {
      control: { type: "select" },
      options: ["accent", "current", "danger", "success", "warning"],
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg", "xl"],
    },
  },
  component: Spinner,
  parameters: {
    layout: "centered",
  },
  title: "Components/Feedback/Spinner",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `<Spinner v-bind="args" />`,
  }),
};

export const Colors: Story = {
  render: () => ({
    components,
    setup: () => ({ colors: ["accent", "danger", "success", "warning"] }),
    template: `
      <div class="flex items-center gap-3">
        <Spinner v-for="color in colors" :key="color" :color="color" />
      </div>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components,
    setup: () => ({ sizes: ["sm", "md", "lg", "xl"] }),
    template: `
      <div class="flex items-center gap-3">
        <Spinner v-for="size in sizes" :key="size" :size="size" />
      </div>
    `,
  }),
};

export const CurrentColor: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex items-center gap-2 text-muted">
        <Spinner color="current" size="sm" />
        <span class="text-sm">Inherits the surrounding text color</span>
      </div>
    `,
  }),
};
