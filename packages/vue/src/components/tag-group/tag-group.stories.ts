import type {StoryMeta} from "../../utils/story-meta";
import type {StoryObj} from "@storybook/vue3";

import {ref} from "vue";

import {DescriptionRoot} from "../description";
import {EmptyStateRoot} from "../empty-state";
import {ErrorMessageRoot} from "../error-message";
import {LabelRoot} from "../label";
import {TagRemoveButton, TagRoot} from "../tag";

import {TagGroupList, TagGroupRoot} from "./index";

// Registered under flat names: a story template is compiled at runtime with no binding metadata,
// so a dotted tag would be looked up as a component literally named "TagGroup.List".
const components = {
  Description: DescriptionRoot,
  EmptyState: EmptyStateRoot,
  ErrorMessage: ErrorMessageRoot,
  Label: LabelRoot,
  Tag: TagRoot,
  TagGroup: TagGroupRoot,
  TagGroupList,
  TagRemoveButton,
};

const meta: StoryMeta = {
  component: TagGroupRoot,
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
    setup: () => ({categories: CATEGORIES}),
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
    setup: () => ({categories: CATEGORIES.slice(0, 3), sizes: ["sm", "md", "lg"]}),
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
    setup: () => ({categories: CATEGORIES.slice(0, 3), variants: ["default", "surface"]}),
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
    setup: () => ({categories: CATEGORIES}),
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
    setup: () => ({categories: CATEGORIES, modes: ["none", "single", "multiple"]}),
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
    setup: () => ({categories: CATEGORIES, selected: ref(new Set(["Travel"]))}),
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
    setup: () => ({categories: CATEGORIES.slice(0, 3)}),
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
    setup: () => ({categories: CATEGORIES}),
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
      const tags = ref(CATEGORIES.map((name) => ({id: name, name})));

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
