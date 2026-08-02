import type {Meta, StoryObj} from "@storybook/vue3";

import {Avatar} from "./index";

const AVATAR_SRC = "https://i.pravatar.cc/150?u=heroui";

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
      options: ["default", "soft"],
    },
  },
  component: Avatar,
  parameters: {
    layout: "centered",
  },
  title: "Components/Media/Avatar",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: {Avatar},
    setup: () => ({args, src: AVATAR_SRC}),
    template: `
      <Avatar v-bind="args">
        <Avatar.Image alt="HeroUI" :src="src" />
        <Avatar.Fallback>HU</Avatar.Fallback>
      </Avatar>
    `,
  }),
};

/** With no `src`, the image never loads and the fallback stays. */
export const Fallback: Story = {
  render: (args) => ({
    components: {Avatar},
    setup: () => ({args}),
    template: `
      <Avatar v-bind="args">
        <Avatar.Fallback>HU</Avatar.Fallback>
      </Avatar>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components: {Avatar},
    setup: () => ({sizes: ["sm", "md", "lg"], src: AVATAR_SRC}),
    template: `
      <div class="flex items-center gap-3">
        <Avatar v-for="size in sizes" :key="size" :size="size">
          <Avatar.Image alt="HeroUI" :src="src" />
          <Avatar.Fallback>HU</Avatar.Fallback>
        </Avatar>
      </div>
    `,
  }),
};

export const FallbackColors: Story = {
  render: () => ({
    components: {Avatar},
    setup: () => ({colors: ["default", "accent", "success", "warning", "danger"]}),
    template: `
      <div class="flex items-center gap-3">
        <Avatar v-for="color in colors" :key="color" :color="color" variant="soft">
          <Avatar.Fallback>HU</Avatar.Fallback>
        </Avatar>
      </div>
    `,
  }),
};
