import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3";

import { shallowRef } from "vue";
import IconBookmark from "~icons/gravity-ui/bookmark";
import IconBookmarkFill from "~icons/gravity-ui/bookmark-fill";
import IconHeart from "~icons/gravity-ui/heart";
import IconHeartFill from "~icons/gravity-ui/heart-fill";
import IconPin from "~icons/gravity-ui/pin";
import IconPinFill from "~icons/gravity-ui/pin-fill";

import { ToggleButton } from "./index";

const components = { IconBookmark, IconBookmarkFill, IconHeart, IconHeartFill, ToggleButton };

const meta: StoryMeta = {
  argTypes: {
    isDisabled: {
      control: { type: "boolean" },
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
    },
    variant: {
      control: { type: "select" },
      options: ["default", "ghost"],
    },
  },
  component: ToggleButton,
  parameters: {
    layout: "centered",
  },
  title: "Components/Buttons/ToggleButton",
};

export default meta;

type Story = StoryObj<typeof meta>;

const defaultArgs = { size: "md" };

export const Default: Story = {
  args: defaultArgs,
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="flex gap-3">
        <ToggleButton :is-disabled="args.isDisabled" :size="args.size" :variant="args.variant">
          <IconHeart />
          Like
        </ToggleButton>
        <ToggleButton
          :is-disabled="args.isDisabled"
          :size="args.size"
          :variant="args.variant ?? 'ghost'"
        >
          <IconHeart />
          Like
        </ToggleButton>
      </div>
    `,
  }),
};

export const Variants: Story = {
  args: defaultArgs,
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <p class="text-sm font-medium text-muted">Default</p>
          <div class="flex gap-3">
            <ToggleButton :is-disabled="args.isDisabled" :size="args.size">
              <IconHeart />
              Like
            </ToggleButton>
            <ToggleButton default-selected :is-disabled="args.isDisabled" :size="args.size">
              <IconHeartFill />
              Like
            </ToggleButton>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <p class="text-sm font-medium text-muted">Ghost</p>
          <div class="flex gap-3">
            <ToggleButton :is-disabled="args.isDisabled" :size="args.size" variant="ghost">
              <IconHeart />
              Like
            </ToggleButton>
            <ToggleButton
              default-selected
              :is-disabled="args.isDisabled"
              :size="args.size"
              variant="ghost"
            >
              <IconHeartFill />
              Like
            </ToggleButton>
          </div>
        </div>
      </div>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components,
    setup: () => ({ sizes: ["sm", "md", "lg"] }),
    template: `
      <div class="flex flex-col gap-6">
        <div class="flex items-center gap-3">
          <ToggleButton v-for="size in sizes" :key="size" :size="size">
            <IconHeart />
            {{ size }}
          </ToggleButton>
        </div>
        <div class="flex items-center gap-3">
          <ToggleButton
            v-for="size in sizes"
            :key="size"
            :aria-label="'Like (' + size + ')'"
            is-icon-only
            :size="size"
          >
            <IconHeart />
          </ToggleButton>
        </div>
      </div>
    `,
  }),
};

export const IconOnly: Story = {
  args: defaultArgs,
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="flex gap-3">
        <ToggleButton
          aria-label="Like"
          is-icon-only
          :is-disabled="args.isDisabled"
          :size="args.size"
          :variant="args.variant"
        >
          <IconHeart />
        </ToggleButton>
        <ToggleButton
          aria-label="Save"
          is-icon-only
          :is-disabled="args.isDisabled"
          :size="args.size"
          :variant="args.variant ?? 'ghost'"
        >
          <IconBookmark />
        </ToggleButton>
      </div>
    `,
  }),
};

/**
 * The selected state reaches the content through a slot prop, which is how a Vapor
 * component stands in for React's render-prop children.
 */
export const Controlled: Story = {
  render: () => ({
    components,
    setup: () => {
      const isSelected = shallowRef(false);

      return { isSelected };
    },
    template: `
      <div class="flex flex-col gap-4">
        <div class="flex gap-3">
          <ToggleButton :is-selected="isSelected" @change="isSelected = $event">
            <template #default="{isSelected: selected}">
              <IconHeartFill v-if="selected" />
              <IconHeart v-else />
              {{ selected ? 'Liked' : 'Like' }}
            </template>
          </ToggleButton>
        </div>
        <p class="text-sm text-muted">
          Status: <span class="font-medium">{{ isSelected ? 'Selected' : 'Not selected' }}</span>
        </p>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components,
    template: `
      <div class="flex gap-3">
        <ToggleButton is-disabled>
          <IconHeart />
          Like
        </ToggleButton>
        <ToggleButton default-selected is-disabled>
          <IconHeartFill />
          Like
        </ToggleButton>
      </div>
    `,
  }),
};

export const RealWorld: Story = {
  render: () => ({
    components: { ...components, IconPin, IconPinFill },
    setup: () => {
      const bookmarked = shallowRef(false);
      const liked = shallowRef(false);
      const pinned = shallowRef(true);

      return { bookmarked, liked, pinned };
    },
    template: `
      <div class="flex items-center gap-2">
        <ToggleButton :is-selected="liked" size="sm" @change="liked = $event">
          <template #default="{isSelected}">
            <IconHeartFill v-if="isSelected" />
            <IconHeart v-else />
            Like
          </template>
        </ToggleButton>
        <ToggleButton
          :is-selected="bookmarked"
          size="sm"
          variant="ghost"
          @change="bookmarked = $event"
        >
          <template #default="{isSelected}">
            <IconBookmarkFill v-if="isSelected" />
            <IconBookmark v-else />
            Save
          </template>
        </ToggleButton>
        <ToggleButton
          aria-label="Pin"
          is-icon-only
          :is-selected="pinned"
          size="sm"
          variant="ghost"
          @change="pinned = $event"
        >
          <template #default="{isSelected}">
            <IconPinFill v-if="isSelected" />
            <IconPin v-else />
          </template>
        </ToggleButton>
      </div>
    `,
  }),
};
