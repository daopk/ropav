import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3";

import IconPerson from "~icons/gravity-ui/person";
import IconPersonGear from "~icons/gravity-ui/person-gear";

import { avatarSrc } from "../../utils/story-assets";
import { SeparatorRoot } from "../separator";

import { Avatar, AvatarFallback, AvatarImage } from "./index";

/**
 * Runtime-compiled story templates cannot resolve `Avatar.Image` — dot notation is an SFC
 * compiler feature. The parts are registered individually instead.
 */
const components = {
  Avatar,
  AvatarFallback,
  AvatarImage,
  IconPerson,
  IconPersonGear,
  Separator: SeparatorRoot,
};

const users = [
  { id: 1, imageUrl: avatarSrc(3), name: "John" },
  { id: 2, imageUrl: avatarSrc(5), name: "Kate" },
  { id: 3, imageUrl: avatarSrc(20), name: "Emily" },
  { id: 4, imageUrl: avatarSrc(23), name: "Michael" },
  { id: 5, imageUrl: avatarSrc(16), name: "Olivia" },
];

const circles = [
  { id: 1, imageUrl: avatarSrc("red"), name: "R" },
  { id: 2, imageUrl: avatarSrc("orange"), name: "O" },
  { id: 3, imageUrl: avatarSrc("green"), name: "G" },
  { id: 4, imageUrl: avatarSrc("white"), name: "W" },
  { id: 5, imageUrl: avatarSrc("black"), name: "B" },
];

const meta: StoryMeta = {
  argTypes: {
    color: {
      control: { type: "select" },
      options: ["accent", "default", "success", "warning", "danger"],
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
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

/**
 * Three columns: fallbacks with nothing to load, images whose fallback is held back by a
 * delay so it never flashes, and images whose fallback shows immediately.
 */
export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({
      args,
      delayed: [
        { alt: "John Doe", label: "JD", src: avatarSrc(3) },
        { alt: "Junior Garcia", label: "JG", src: avatarSrc(4) },
        { alt: "Junior Garcia", label: "JG", src: avatarSrc(5) },
        { alt: "Paul", label: "PG", src: avatarSrc(8) },
      ],
      solid: [
        { alt: "Red", label: "R", src: avatarSrc("red") },
        { alt: "Orange", label: "O", src: avatarSrc("orange") },
        { alt: "Green", label: "G", src: avatarSrc("green") },
        { alt: "White", label: "W", src: avatarSrc("white") },
        { alt: "Black", label: "B", src: avatarSrc("black") },
      ],
    }),
    template: `
      <div class="flex items-start gap-4">
        <div class="flex flex-col gap-4">
          <Avatar v-bind="args">
            <AvatarFallback>PG</AvatarFallback>
          </Avatar>
          <Avatar v-bind="args">
            <AvatarFallback>JR</AvatarFallback>
          </Avatar>
          <Avatar v-bind="args">
            <AvatarFallback><IconPerson /></AvatarFallback>
          </Avatar>
          <Avatar v-bind="args">
            <AvatarFallback><IconPersonGear /></AvatarFallback>
          </Avatar>
        </div>

        <div class="flex flex-col gap-4">
          <Avatar v-for="item in delayed" :key="item.src" v-bind="args">
            <AvatarImage :alt="item.alt" :src="item.src" />
            <AvatarFallback :delay-ms="600">{{ item.label }}</AvatarFallback>
          </Avatar>
        </div>

        <div class="flex flex-col gap-4">
          <Avatar v-for="item in solid" :key="item.src" v-bind="args">
            <AvatarImage :alt="item.alt" :src="item.src" />
            <AvatarFallback>{{ item.label }}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    `,
  }),
};

/** A source deliberately held back, so the loading path is the one on screen. */
export const WithDelay: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args, src: `https://app.requestly.io/delay/300/${avatarSrc(3)}` }),
    template: `
      <div class="flex flex-col gap-4">
        <Avatar v-bind="args">
          <AvatarImage :src="src" />
        </Avatar>
      </div>
    `,
  }),
};

export const WithColors: Story = {
  render: () => ({
    components,
    setup: () => ({
      swatches: [
        { color: "default", label: "DF" },
        { color: "accent", label: "AC" },
        { color: "success", label: "SC" },
        { color: "warning", label: "WR" },
        { color: "danger", label: "DG" },
      ],
    }),
    template: `
      <div class="flex items-center gap-4">
        <Avatar v-for="item in swatches" :key="item.color" :color="item.color">
          <AvatarFallback>{{ item.label }}</AvatarFallback>
        </Avatar>
      </div>
    `,
  }),
};

export const Fallback: Story = {
  render: () => ({
    components,
    setup: () => ({ invalidSrc: "https://invalid-url-to-show-fallback.com/image.jpg" }),
    template: `
      <div class="flex items-center gap-4">
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback><IconPerson /></AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage alt="Delayed Avatar" :src="invalidSrc" />
          <AvatarFallback :delay-ms="600">NA</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback
            class="border-none bg-gradient-to-br from-pink-500 to-purple-500 text-white"
          >
            GB
          </AvatarFallback>
        </Avatar>
      </div>
    `,
  }),
};

/** There is no AvatarGroup: a group is overlap and a ring, which is CSS the caller owns. */
export const Group: Story = {
  render: () => ({
    components,
    setup: () => ({ circles, users }),
    template: `
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-center -space-x-2">
          <Avatar v-for="user in users" :key="user.id" class="ring-2 ring-background">
            <AvatarImage :src="user.imageUrl" />
            <AvatarFallback>{{ user.name.charAt(0) }}</AvatarFallback>
          </Avatar>
          <Avatar class="ring-2 ring-background">
            <AvatarFallback class="border-none">+5</AvatarFallback>
          </Avatar>
        </div>
        <div class="flex items-center justify-center -space-x-2">
          <Avatar v-for="circle in circles" :key="circle.id" class="ring-2 ring-background">
            <AvatarImage :src="circle.imageUrl" />
            <AvatarFallback>{{ circle.name }}</AvatarFallback>
          </Avatar>
          <Avatar class="ring-2 ring-background">
            <AvatarFallback class="border-none">+5</AvatarFallback>
          </Avatar>
        </div>
      </div>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components,
    setup: () => ({
      sizes: [
        { alt: "Small", label: "SM", size: "sm", src: avatarSrc(3) },
        { alt: "Medium", label: "MD", size: "md", src: avatarSrc(4) },
        { alt: "Large", label: "LG", size: "lg", src: avatarSrc(5) },
      ],
    }),
    template: `
      <div class="flex items-center gap-4">
        <Avatar v-for="item in sizes" :key="item.size" :size="item.size">
          <AvatarImage :alt="item.alt" :src="item.src" />
          <AvatarFallback>{{ item.label }}</AvatarFallback>
        </Avatar>
      </div>
    `,
  }),
};

/** Every color against every kind of content, which is where `soft` earns its keep. */
export const Variants: Story = {
  render: (args) => ({
    components,
    setup: () => ({
      args,
      colors: ["accent", "default", "success", "warning", "danger"],
      images: [
        avatarSrc("blue"),
        avatarSrc("black"),
        avatarSrc("green"),
        avatarSrc("orange"),
        avatarSrc("red"),
      ],
      rows: [
        { label: "letter", type: "letter" },
        { label: "letter soft", type: "letter-soft" },
        { label: "icon", type: "icon" },
        { label: "icon soft", type: "icon-soft" },
        { label: "img", type: "img" },
      ],
    }),
    template: `
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <div class="w-24 shrink-0" />
          <div
            v-for="color in colors"
            :key="color"
            class="flex w-20 shrink-0 items-center justify-center"
          >
            <span class="text-xs text-muted capitalize">{{ color }}</span>
          </div>
        </div>

        <Separator />

        <div v-for="row in rows" :key="row.label" class="flex items-center gap-3">
          <div class="w-24 shrink-0 text-sm text-muted">{{ row.label }}</div>
          <div
            v-for="(color, colorIndex) in colors"
            :key="color"
            class="flex w-20 shrink-0 items-center justify-center"
          >
            <Avatar
              v-bind="args"
              :color="color"
              :variant="row.type.includes('soft') ? 'soft' : undefined"
            >
              <template v-if="row.type === 'img'">
                <AvatarImage :alt="'Avatar ' + color" :src="images[colorIndex]" />
                <AvatarFallback>{{ color.charAt(0).toUpperCase() }}</AvatarFallback>
              </template>
              <AvatarFallback v-else-if="row.type.startsWith('icon')"><IconPerson /></AvatarFallback>
              <AvatarFallback v-else>AG</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    `,
  }),
};
