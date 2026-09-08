import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { avatarSrc } from "../../utils/story-assets";
import { Avatar, AvatarFallback, AvatarImage } from "../avatar";
import { Button } from "../button";
import { Link } from "../link";

import { AvatarGroup, AvatarGroupOverflow } from "./index";

/**
 * Runtime-compiled story templates cannot resolve `AvatarGroup.Overflow` — dot notation is an SFC
 * compiler feature. The parts are registered individually instead.
 */
const components = {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupOverflow,
  AvatarImage,
  Button,
  Link,
};

const members = [
  { id: 1, imageUrl: avatarSrc(3), name: "John" },
  { id: 2, imageUrl: avatarSrc(5), name: "Kate" },
  { id: 3, imageUrl: avatarSrc(20), name: "Emily" },
  { id: 4, imageUrl: avatarSrc(23), name: "Michael" },
];

const meta: StoryMeta = {
  argTypes: {
    front: { control: { type: "inline-radio" }, options: ["first", "last"] },
    orientation: { control: { type: "inline-radio" }, options: ["horizontal", "vertical"] },
    overlap: { control: { type: "select" }, options: ["none", "sm", "md", "lg"] },
    size: { control: { type: "select" }, options: ["sm", "md", "lg"] },
  },
  component: AvatarGroup,
  parameters: { layout: "centered" },
  title: "Components/Media/AvatarGroup",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args, members }),
    template: `
      <AvatarGroup v-bind="args">
        <Avatar v-for="member in members" :key="member.id">
          <AvatarImage :src="member.imageUrl" />
          <AvatarFallback>{{ member.name.charAt(0) }}</AvatarFallback>
        </Avatar>
        <AvatarGroupOverflow :count="5" />
      </AvatarGroup>
    `,
  }),
};

/**
 * The left-to-right order is the same in both. Only which avatar wins the overlap changes, so
 * `front` never reorders the people it is showing.
 */
export const Front: Story = {
  render: () => ({
    components,
    setup: () => ({ fronts: ["last", "first"], members }),
    template: `
      <div class="flex flex-col gap-4">
        <div v-for="front in fronts" :key="front" class="flex items-center gap-3">
          <code class="w-28 text-xs">front="{{ front }}"</code>
          <AvatarGroup :front="front">
            <Avatar v-for="member in members" :key="member.id">
              <AvatarImage :src="member.imageUrl" />
              <AvatarFallback>{{ member.name.charAt(0) }}</AvatarFallback>
            </Avatar>
            <AvatarGroupOverflow :count="5" />
          </AvatarGroup>
        </div>
      </div>
    `,
  }),
};

export const Overlap: Story = {
  render: () => ({
    components,
    setup: () => ({ members, overlaps: ["none", "sm", "md", "lg"] }),
    template: `
      <div class="flex flex-col gap-4">
        <div v-for="overlap in overlaps" :key="overlap" class="flex items-center gap-3">
          <code class="w-28 text-xs">overlap="{{ overlap }}"</code>
          <AvatarGroup :overlap="overlap">
            <Avatar v-for="member in members" :key="member.id">
              <AvatarImage :src="member.imageUrl" />
              <AvatarFallback>{{ member.name.charAt(0) }}</AvatarFallback>
            </Avatar>
          </AvatarGroup>
        </div>
      </div>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components,
    setup: () => ({ members, sizes: ["sm", "md", "lg"] }),
    template: `
      <div class="flex flex-col gap-4">
        <AvatarGroup v-for="size in sizes" :key="size" :size="size">
          <Avatar v-for="member in members" :key="member.id">
            <AvatarImage :src="member.imageUrl" />
            <AvatarFallback>{{ member.name.charAt(0) }}</AvatarFallback>
          </Avatar>
          <AvatarGroupOverflow :count="5" />
        </AvatarGroup>
      </div>
    `,
  }),
};

export const Vertical: Story = {
  render: () => ({
    components,
    setup: () => ({ members }),
    template: `
      <AvatarGroup orientation="vertical">
        <Avatar v-for="member in members" :key="member.id">
          <AvatarImage :src="member.imageUrl" />
          <AvatarFallback>{{ member.name.charAt(0) }}</AvatarFallback>
        </Avatar>
        <AvatarGroupOverflow :count="5" />
      </AvatarGroup>
    `,
  }),
};

/**
 * The ring is the surface behind the group showing through. It defaults to the page, so a group
 * on anything else has to be told what it is sitting on.
 */
export const OnASurface: Story = {
  render: () => ({
    components,
    setup: () => ({ members }),
    template: `
      <div class="flex flex-col gap-4">
        <div class="rounded-xl bg-[var(--rp-surface)] p-4">
          <AvatarGroup style="--avatar-group-ring-color: var(--rp-surface)">
            <Avatar v-for="member in members" :key="member.id">
              <AvatarImage :src="member.imageUrl" />
              <AvatarFallback>{{ member.name.charAt(0) }}</AvatarFallback>
            </Avatar>
            <AvatarGroupOverflow :count="5" />
          </AvatarGroup>
        </div>
        <div class="rounded-xl bg-[var(--rp-accent)] p-4">
          <AvatarGroup style="--avatar-group-ring-color: var(--rp-accent)">
            <Avatar v-for="member in members" :key="member.id">
              <AvatarImage :src="member.imageUrl" />
              <AvatarFallback>{{ member.name.charAt(0) }}</AvatarFallback>
            </Avatar>
            <AvatarGroupOverflow :count="5" />
          </AvatarGroup>
        </div>
      </div>
    `,
  }),
};

/**
 * Tab from the button into the group: the avatar holding focus rises, so its ring is not clipped
 * by the next one along.
 *
 * The name goes on the link, not on the image. An avatar's `alt` is empty by default because it
 * normally sits beside the name it belongs to, and a loaded image covers the initials — so a link
 * wrapping one has nothing left to be called.
 */
export const Interactive: Story = {
  render: () => ({
    components,
    setup: () => ({ members }),
    template: `
      <div class="flex items-center gap-4">
        <Button variant="secondary">Invite</Button>
        <AvatarGroup front="first">
          <Link
            v-for="member in members"
            :key="member.id"
            :aria-label="member.name"
            class="rounded-full"
            href="#"
          >
            <Avatar>
              <AvatarImage :src="member.imageUrl" />
              <AvatarFallback>{{ member.name.charAt(0) }}</AvatarFallback>
            </Avatar>
          </Link>
        </AvatarGroup>
      </div>
    `,
  }),
};
