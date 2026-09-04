import type { CollectionKey } from "../../composables/use-collection";
import type { CollectionSelection } from "../../composables/use-selection-manager";
import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { computed, ref } from "vue";

import { useListData } from "../../composables/use-list-data";
import { avatarSrc } from "../../utils/story-assets";
import { AvatarFallback, AvatarImage, Avatar } from "../avatar";
import { Description } from "../description";
import { EmptyState } from "../empty-state";
import { ErrorMessage } from "../error-message";
import { Label } from "../label";
import { TagRemoveButton, Tag } from "../tag";

import { TagGroupList, TagGroup } from "./index";

// Registered under flat names: a story template is compiled at runtime with no binding metadata,
// so a dotted tag would be looked up as a component literally named "TagGroupList".
const components = {
  Avatar: Avatar,
  AvatarFallback,
  AvatarImage,
  Description: Description,
  EmptyState: EmptyState,
  ErrorMessage: ErrorMessage,
  Label: Label,
  Tag: Tag,
  TagGroup: TagGroup,
  TagGroupList,
  TagRemoveButton,
};

const meta: StoryMeta = {
  component: TagGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "Components/Collections/TagGroup",
};

export default meta;

type Story = StoryObj<typeof meta>;

const CATEGORIES = ["News", "Travel", "Gaming", "Shopping"];

export const Default: Story = {
  render: () => ({
    components,
    setup: () => ({ categories: CATEGORIES }),
    template: `
      <TagGroup selection-mode="single">
        <TagGroupList aria-label="Tags">
          <Tag v-for="name in categories" :key="name" :id="name">{{ name }}</Tag>
        </TagGroupList>
      </TagGroup>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components,
    setup: () => ({ categories: CATEGORIES.slice(0, 3), sizes: ["sm", "md", "lg"] }),
    template: `
      <div class="flex flex-col gap-4">
        <TagGroup v-for="size in sizes" :key="size" :size="size" selection-mode="single">
          <TagGroupList :aria-label="size">
            <Tag v-for="name in categories" :key="name" :id="name">{{ name }}</Tag>
          </TagGroupList>
        </TagGroup>
      </div>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    components,
    setup: () => ({ categories: CATEGORIES.slice(0, 3), variants: ["default", "surface"] }),
    template: `
      <div class="flex flex-col gap-4">
        <TagGroup
          v-for="variant in variants"
          :key="variant"
          selection-mode="single"
          :variant="variant"
        >
          <TagGroupList :aria-label="variant">
            <Tag v-for="name in categories" :key="name" :id="name">{{ name }}</Tag>
          </TagGroupList>
        </TagGroup>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components,
    setup: () => ({ categories: CATEGORIES }),
    template: `
      <TagGroup :disabled-keys="['Travel', 'Gaming']" selection-mode="single">
        <TagGroupList aria-label="Tags">
          <Tag v-for="name in categories" :key="name" :id="name">{{ name }}</Tag>
        </TagGroupList>
      </TagGroup>
    `,
  }),
};

export const SelectionModes: Story = {
  render: () => ({
    components,
    setup: () => ({ categories: CATEGORIES, modes: ["none", "single", "multiple"] }),
    template: `
      <div class="flex flex-col gap-4">
        <TagGroup v-for="mode in modes" :key="mode" :selection-mode="mode">
          <Label>{{ mode }}</Label>
          <TagGroupList>
            <Tag v-for="name in categories" :key="name" :id="mode + name">{{ name }}</Tag>
          </TagGroupList>
        </TagGroup>
      </div>
    `,
  }),
};

export const Controlled: Story = {
  render: () => ({
    components,
    setup: () => ({ categories: CATEGORIES, selected: ref(new Set(["Travel"])) }),
    template: `
      <div class="flex flex-col gap-4">
        <TagGroup v-model:selected-keys="selected" selection-mode="multiple">
          <Label>Categories</Label>
          <TagGroupList>
            <Tag v-for="name in categories" :key="name" :id="name">{{ name }}</Tag>
          </TagGroupList>
        </TagGroup>
        <p class="text-sm text-muted">Selected: {{ [...selected].join(", ") || "none" }}</p>
      </div>
    `,
  }),
};

export const WithErrorMessage: Story = {
  render: () => ({
    components,
    setup: () => ({ categories: CATEGORIES.slice(0, 3) }),
    template: `
      <TagGroup selection-mode="single">
        <Label>Categories</Label>
        <TagGroupList>
          <Tag v-for="name in categories" :key="name" :id="name">{{ name }}</Tag>
        </TagGroupList>
        <ErrorMessage>Pick at least two categories</ErrorMessage>
      </TagGroup>
    `,
  }),
};

export const WithPrefix: Story = {
  render: () => ({
    components,
    setup: () => ({ categories: CATEGORIES }),
    template: `
      <TagGroup selection-mode="single">
        <Label>With Icons</Label>
        <TagGroupList>
          <Tag v-for="name in categories" :key="name" :id="name" :text-value="name">
            <span aria-hidden="true" class="size-3 shrink-0 rounded-full bg-current" />
            {{ name }}
          </Tag>
        </TagGroupList>
        <Description>Tags with icons</Description>
      </TagGroup>
    `,
  }),
};

export const WithRemoveButton: Story = {
  render: () => ({
    components,
    setup: () => {
      const tags = ref(CATEGORIES.map((name) => ({ id: name, name })));

      return {
        onRemove: (keys: Set<string>) => {
          tags.value = tags.value.filter((tag) => !keys.has(tag.id));
        },
        tags,
      };
    },
    template: `
      <div class="w-sm">
        <TagGroup :on-remove="onRemove" selection-mode="single">
          <Label>Default Remove Button</Label>
          <TagGroupList>
            <Tag v-for="tag in tags" :key="tag.id" :id="tag.id" :text-value="tag.name">
              {{ tag.name }}
            </Tag>
            <template #empty>
              <EmptyState class="p-1">No categories found</EmptyState>
            </template>
          </TagGroupList>
          <Description>Click the X to remove tags</Description>
        </TagGroup>
      </div>
    `,
  }),
};

interface TeamMember {
  id: string;
  name: string;
  avatarUrl: string;
  fallback: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    avatarUrl: avatarSrc("blue"),
    fallback: "F",
    id: "fred",
    name: "Fred",
  },
  {
    avatarUrl: avatarSrc("green"),
    fallback: "M",
    id: "michael",
    name: "Michael",
  },
  {
    avatarUrl: avatarSrc("purple"),
    fallback: "J",
    id: "jane",
    name: "Jane",
  },
  {
    avatarUrl: avatarSrc("red"),
    fallback: "A",
    id: "alice",
    name: "Alice",
  },
  {
    avatarUrl: avatarSrc("orange"),
    fallback: "B",
    id: "bob",
    name: "Bob",
  },
  {
    avatarUrl: avatarSrc("black"),
    fallback: "C",
    id: "charlie",
    name: "Charlie",
  },
];

export const WithListData: Story = {
  render: () => ({
    components,
    setup: () => {
      const list = useListData<TeamMember>({
        getKey: (item) => item.id,
        initialItems: TEAM_MEMBERS,
        initialSelectedKeys: ["fred", "michael"],
      });

      return {
        items: list.items,

        onRemove: (keys: Set<CollectionKey>) => list.remove(...keys),

        onSelectionChange: (keys: CollectionSelection) => list.setSelectedKeys(keys),

        selectedKeys: list.selectedKeys,
        // "all" carries no keys to look up, so the readout only has something to show for a
        // concrete set.
        selectedMembers: computed(() =>
          list.selectedKeys.value === "all"
            ? []
            : [...list.selectedKeys.value].flatMap((key) => list.getItem(key) ?? []),
        ),
      };
    },
    template: `
      <div class="w-sm">
        <TagGroup
          :on-remove="onRemove"
          :selected-keys="selectedKeys"
          selection-mode="multiple"
          @update:selected-keys="onSelectionChange"
        >
          <Label>Team Members</Label>
          <TagGroupList>
            <Tag v-for="user in items" :key="user.id" :id="user.id" :text-value="user.name">
              <Avatar class="size-4" size="sm">
                <AvatarImage :src="user.avatarUrl" />
                <AvatarFallback>{{ user.fallback }}</AvatarFallback>
              </Avatar>
              {{ user.name }}
            </Tag>
            <template #empty>
              <EmptyState class="p-1">No team members</EmptyState>
            </template>
          </TagGroupList>
          <Description>Select team members for your project</Description>
        </TagGroup>
        <div v-if="selectedMembers.length" class="mt-4 flex flex-col gap-2">
          <p class="text-sm font-medium text-muted">Selected:</p>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="user in selectedMembers"
              :key="user.id + '-selected'"
              class="flex items-center gap-2 rounded-lg bg-surface-tertiary px-2 py-1"
            >
              <Avatar class="size-4" size="sm">
                <AvatarImage :src="user.avatarUrl" />
                <AvatarFallback>{{ user.fallback }}</AvatarFallback>
              </Avatar>
              <span class="text-sm">{{ user.name }}</span>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};
