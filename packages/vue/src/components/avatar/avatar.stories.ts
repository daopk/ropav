import type {Meta, StoryObj} from "@storybook/vue3";

import {Avatar, AvatarFallback, AvatarImage} from "./index";

/**
 * Runtime-compiled story templates cannot resolve `Avatar.Image` — dot notation is an SFC
 * compiler feature. The parts are registered individually instead.
 */
const components = {Avatar, AvatarFallback, AvatarImage};

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
    components,
    setup: () => ({args, src: AVATAR_SRC}),
    template: `
      <Avatar v-bind="args">
        <AvatarImage alt="HeroUI" :src="src" />
        <AvatarFallback>HU</AvatarFallback>
      </Avatar>
    `,
  }),
};

/** With no `src`, the image never loads and the fallback stays. */
export const Fallback: Story = {
  render: (args) => ({
    components,
    setup: () => ({args}),
    template: `
      <Avatar v-bind="args">
        <AvatarFallback>HU</AvatarFallback>
      </Avatar>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components,
    setup: () => ({sizes: ["sm", "md", "lg"], src: AVATAR_SRC}),
    template: `
      <div class="flex items-center gap-3">
        <Avatar v-for="size in sizes" :key="size" :size="size">
          <AvatarImage alt="HeroUI" :src="src" />
          <AvatarFallback>HU</AvatarFallback>
        </Avatar>
      </div>
    `,
  }),
};

export const FallbackColors: Story = {
  render: () => ({
    components,
    setup: () => ({colors: ["default", "accent", "success", "warning", "danger"]}),
    template: `
      <div class="flex items-center gap-3">
        <Avatar v-for="color in colors" :key="color" :color="color" variant="soft">
          <AvatarFallback>HU</AvatarFallback>
        </Avatar>
      </div>
    `,
  }),
};
