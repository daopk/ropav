import type {Meta, StoryObj} from "@storybook/vue3";

import {Button} from "./index";

const meta: Meta = {
  argTypes: {
    size: {
      control: {type: "select"},
      options: ["sm", "md", "lg"],
    },
    variant: {
      control: {type: "select"},
      options: ["primary", "secondary", "tertiary", "outline", "ghost", "danger", "danger-soft"],
    },
  },
  component: Button,
  parameters: {
    layout: "centered",
  },
  title: "Components/Buttons/Button",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: {Button},
    setup: () => ({args}),
    template: `<Button v-bind="args">Button</Button>`,
  }),
};

export const Variants: Story = {
  render: () => ({
    components: {Button},
    setup: () => ({
      variants: ["primary", "secondary", "tertiary", "outline", "ghost", "danger", "danger-soft"],
    }),
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <Button v-for="variant in variants" :key="variant" :variant="variant">
          {{ variant }}
        </Button>
      </div>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components: {Button},
    setup: () => ({sizes: ["sm", "md", "lg"]}),
    template: `
      <div class="flex items-center gap-3">
        <Button v-for="size in sizes" :key="size" :size="size">{{ size }}</Button>
      </div>
    `,
  }),
};

export const States: Story = {
  render: () => ({
    components: {Button},
    template: `
      <div class="flex items-center gap-3">
        <Button>Default</Button>
        <Button is-disabled>Disabled</Button>
        <Button is-pending>Pending</Button>
      </div>
    `,
  }),
};

export const FullWidth: Story = {
  render: () => ({
    components: {Button},
    template: `
      <div class="w-80">
        <Button full-width>Full width</Button>
      </div>
    `,
  }),
};
