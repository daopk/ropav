import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import IconBell from "~icons/gravity-ui/bell";

import { avatarSrc } from "../../utils/story-assets";
import { Avatar, AvatarImage } from "../avatar";
import { SeparatorRoot } from "../separator";

import { Badge, BadgeAnchor, BadgeLabel } from "./index";

/** Runtime-compiled stories register compound parts individually instead of using dot notation. */
const components = {
  Avatar,
  AvatarImage,
  Badge,
  BadgeAnchor,
  BadgeLabel,
  IconBell,
  Separator: SeparatorRoot,
};

const AVATAR_URL = avatarSrc("green");

const meta: StoryMeta = {
  argTypes: {
    color: {
      control: { type: "select" },
      options: ["default", "accent", "success", "warning", "danger"],
    },
    placement: {
      control: { type: "select" },
      options: ["top-right", "top-left", "bottom-right", "bottom-left"],
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
    },
    variant: {
      control: { type: "select" },
      options: ["primary", "secondary", "soft"],
    },
  },
  component: Badge,
  parameters: {
    layout: "centered",
  },
  title: "Components/Data Display/Badge",
};

export default meta;

type Story = StoryObj<typeof meta>;

const defaultArgs = {
  color: "accent",
  placement: "top-right",
  size: "sm",
  variant: "primary",
};

export const Default: Story = {
  args: defaultArgs,
  render: (args) => ({
    components,
    setup: () => ({ args, avatarUrl: AVATAR_URL }),
    template: `
      <BadgeAnchor>
        <Avatar><AvatarImage :src="avatarUrl" /></Avatar>
        <Badge v-bind="args"><BadgeLabel>5</BadgeLabel></Badge>
      </BadgeAnchor>
    `,
  }),
};

export const Sizes: Story = {
  args: defaultArgs,
  render: (args) => ({
    components,
    setup: () => ({
      args,
      avatarUrl: AVATAR_URL,
      sizes: [
        { label: "Large", value: "lg" },
        { label: "Medium", value: "md" },
        { label: "Small", value: "sm" },
      ],
    }),
    template: `
      <div class="flex items-center gap-8">
        <div v-for="size in sizes" :key="size.value" class="flex flex-col items-center gap-2">
          <BadgeAnchor>
            <Avatar :size="size.value"><AvatarImage :src="avatarUrl" /></Avatar>
            <Badge v-bind="args" :size="size.value"><BadgeLabel>99+</BadgeLabel></Badge>
          </BadgeAnchor>
          <span class="text-xs text-muted">{{ size.label }}</span>
        </div>
      </div>
    `,
  }),
};

export const Colors: Story = {
  args: defaultArgs,
  render: (args) => ({
    components,
    setup: () => ({
      args,
      avatarUrl: AVATAR_URL,
      colors: ["accent", "default", "success", "warning", "danger"],
    }),
    template: `
      <div class="flex items-center gap-8">
        <div v-for="color in colors" :key="color" class="flex flex-col items-center gap-2">
          <BadgeAnchor>
            <Avatar><AvatarImage :src="avatarUrl" /></Avatar>
            <Badge v-bind="args" :color="color" />
          </BadgeAnchor>
          <span class="text-xs text-muted capitalize">{{ color }}</span>
        </div>
      </div>
    `,
  }),
};

export const WithContent: Story = {
  args: defaultArgs,
  render: (args) => ({
    components,
    setup: () => ({
      args,
      avatarUrl: AVATAR_URL,
      items: [
        { color: "danger", content: "5", label: "Number" },
        { color: "danger", content: "New", label: "Text" },
        { color: "danger", content: "99+", label: "Overflow" },
      ],
    }),
    template: `
      <div class="flex items-center gap-8">
        <div v-for="item in items" :key="item.label" class="flex flex-col items-center gap-2">
          <BadgeAnchor>
            <Avatar><AvatarImage :src="avatarUrl" /></Avatar>
            <Badge v-bind="args" :color="item.color"><BadgeLabel>{{ item.content }}</BadgeLabel></Badge>
          </BadgeAnchor>
          <span class="text-xs text-muted">{{ item.label }}</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <BadgeAnchor>
            <Avatar><AvatarImage :src="avatarUrl" /></Avatar>
            <Badge v-bind="args" color="accent"><IconBell /></Badge>
          </BadgeAnchor>
          <span class="text-xs text-muted">Icon</span>
        </div>
      </div>
    `,
  }),
};

export const Placements: Story = {
  render: () => ({
    components,
    setup: () => ({
      avatarUrl: AVATAR_URL,
      placements: ["top-right", "top-left", "bottom-right", "bottom-left"],
    }),
    template: `
      <div class="flex items-center gap-8">
        <div
          v-for="placement in placements"
          :key="placement"
          class="flex flex-col items-center gap-2"
        >
          <BadgeAnchor>
            <Avatar><AvatarImage :src="avatarUrl" /></Avatar>
            <Badge color="accent" :placement="placement" size="sm" />
          </BadgeAnchor>
          <span class="text-xs text-muted">{{ placement }}</span>
        </div>
      </div>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    components,
    setup: () => ({
      avatarUrl: AVATAR_URL,
      colors: ["accent", "default", "success", "warning", "danger"],
      variants: ["primary", "secondary", "soft"],
    }),
    template: `
      <div class="flex flex-col gap-8">
        <template v-for="(variant, index) in variants" :key="variant">
          <div class="flex flex-col gap-4">
            <h3 class="text-sm font-semibold text-muted capitalize">{{ variant }}</h3>
            <div class="flex items-center gap-8">
              <div v-for="color in colors" :key="color" class="flex flex-col items-center gap-2">
                <BadgeAnchor>
                  <Avatar><AvatarImage :src="avatarUrl" /></Avatar>
                  <Badge :color="color" size="sm" :variant="variant">
                    <BadgeLabel>5</BadgeLabel>
                  </Badge>
                </BadgeAnchor>
                <span class="text-xs text-muted capitalize">{{ color }}</span>
              </div>
            </div>
          </div>
          <Separator v-if="index < variants.length - 1" />
        </template>
      </div>
    `,
  }),
};

export const DotBadge: Story = {
  render: () => ({
    components,
    setup: () => ({
      avatarUrl: AVATAR_URL,
      colors: ["accent", "success", "warning", "danger"],
      sizes: [
        { label: "Large", value: "lg" },
        { label: "Medium", value: "md" },
        { label: "Small", value: "sm" },
      ],
    }),
    template: `
      <div class="flex flex-col gap-8">
        <div class="flex flex-col gap-4">
          <h3 class="text-sm font-semibold text-muted">Status Indicators</h3>
          <div class="flex items-center gap-8">
            <BadgeAnchor v-for="color in colors" :key="color">
              <Avatar size="sm"><AvatarImage :src="avatarUrl" /></Avatar>
              <Badge :color="color" placement="bottom-right" size="sm" />
            </BadgeAnchor>
          </div>
        </div>
        <Separator />
        <div class="flex flex-col gap-4">
          <h3 class="text-sm font-semibold text-muted">Sizes</h3>
          <div class="flex items-center gap-8">
            <div v-for="size in sizes" :key="size.value" class="flex flex-col items-center gap-2">
              <BadgeAnchor>
                <Avatar :size="size.value"><AvatarImage :src="avatarUrl" /></Avatar>
                <Badge color="success" placement="bottom-right" :size="size.value" />
              </BadgeAnchor>
              <span class="text-xs text-muted">{{ size.label }}</span>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};
