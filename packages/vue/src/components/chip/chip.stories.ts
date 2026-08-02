import type {Meta, StoryObj} from "@storybook/vue3";

import {Chip} from "./index";

const meta: Meta = {
  argTypes: {
    color: {
      control: {type: "select"},
      options: ["default", "accent", "success", "warning", "danger"],
    },
    size: {
      control: {type: "select"},
      options: ["sm", "md", "lg"],
    },
    variant: {
      control: {type: "select"},
      options: ["primary", "secondary", "tertiary", "soft"],
    },
  },
  component: Chip,
  parameters: {
    layout: "centered",
  },
  title: "Components/Data Display/Chip",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: {Chip},
    setup: () => ({args}),
    template: `<Chip label="Label" v-bind="args" />`,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components: {Chip},
    setup: () => ({sizes: ["sm", "md", "lg"]}),
    template: `
      <div class="flex items-center gap-3">
        <Chip v-for="size in sizes" :key="size" :label="size" :size="size" />
      </div>
    `,
  }),
};

export const Colors: Story = {
  render: () => ({
    components: {Chip},
    setup: () => ({colors: ["default", "accent", "success", "warning", "danger"]}),
    template: `
      <div class="flex items-center gap-3">
        <Chip v-for="color in colors" :key="color" :color="color" :label="color" />
      </div>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    components: {Chip},
    setup: () => ({variants: ["primary", "secondary", "tertiary", "soft"]}),
    template: `
      <div class="flex items-center gap-3">
        <Chip v-for="variant in variants" :key="variant" :label="variant" :variant="variant" />
      </div>
    `,
  }),
};

/**
 * Icons need the default slot, which means the label has to be explicit. The `label`
 * shorthand only renders when no slot content is passed.
 */
export const WithIcons: Story = {
  render: () => ({
    components: {Chip},
    template: `
      <Chip>
        <svg fill="none" height="12" viewBox="0 0 16 16" width="12">
          <circle cx="8" cy="8" fill="currentColor" r="4" />
        </svg>
        <Chip.Label>Label</Chip.Label>
      </Chip>
    `,
  }),
};
