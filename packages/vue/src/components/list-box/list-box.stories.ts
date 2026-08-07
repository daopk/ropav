import type {Meta, StoryObj} from "@storybook/vue3";

import {ref} from "vue";

import {AvatarFallback, AvatarImage, AvatarRoot} from "../avatar";
import {DescriptionRoot} from "../description";
import {HeaderRoot} from "../header";
import {KbdAbbr, KbdContent, KbdRoot} from "../kbd";
import {LabelRoot} from "../label";
import {ListBoxItemIndicator, ListBoxItemRoot} from "../list-box-item";
import {ListBoxSectionRoot} from "../list-box-section";
import {SeparatorRoot} from "../separator";
import {SurfaceRoot} from "../surface";

import {ListBoxRoot} from "./index";

// Registered under flat names: a story template is compiled at runtime with no binding
// metadata, so a dotted tag would be looked up as a component literally named "ListBox.Item".
const components = {
  Avatar: AvatarRoot,
  AvatarFallback,
  AvatarImage,
  Description: DescriptionRoot,
  Header: HeaderRoot,
  Kbd: KbdRoot,
  KbdAbbr,
  KbdContent,
  Label: LabelRoot,
  ListBox: ListBoxRoot,
  ListBoxItem: ListBoxItemRoot,
  ListBoxItemIndicator,
  ListBoxSection: ListBoxSectionRoot,
  Separator: SeparatorRoot,
  Surface: SurfaceRoot,
};

const meta: Meta = {
  component: ListBoxRoot,
  parameters: {
    layout: "centered",
  },
  title: "Components/Collections/ListBox",
};

export default meta;

type Story = StoryObj<typeof meta>;

const USERS = [
  {
    color: "blue",
    email: "bob@heroui.com",
    id: "1",
    initial: "B",
    name: "Bob",
  },
  {
    color: "green",
    email: "fred@heroui.com",
    id: "2",
    initial: "F",
    name: "Fred",
  },
  {
    color: "purple",
    email: "martha@heroui.com",
    id: "3",
    initial: "M",
    name: "Martha",
  },
];

const avatarUrl = (color: string) =>
  `https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/${color}.jpg`;

const userItems = (withIndicator: boolean) => `
  <ListBoxItem v-for="user in users" :key="user.id" :id="user.id" :text-value="user.name">
    <Avatar size="sm">
      <AvatarImage :src="avatarUrl(user.color)" />
      <AvatarFallback>{{ user.initial }}</AvatarFallback>
    </Avatar>
    <div class="flex flex-col">
      <Label>{{ user.name }}</Label>
      <Description>{{ user.email }}</Description>
    </div>
    ${withIndicator ? "<ListBoxItemIndicator />" : ""}
  </ListBoxItem>
`;

export const Default: Story = {
  render: () => ({
    components,
    setup: () => ({avatarUrl, users: USERS.slice(0, 3)}),
    template: `
      <ListBox aria-label="Users" class="w-[220px]" selection-mode="single">
        ${userItems(true)}
      </ListBox>
    `,
  }),
};

const FILE_ACTIONS = [
  {
    description: "Create a new file",
    icon: "gravity-ui:square-plus",
    id: "new-file",
    keys: ["command"],
    letter: "N",
    title: "New file",
  },
  {
    description: "Make changes",
    icon: "gravity-ui:pencil",
    id: "edit-file",
    keys: ["command"],
    letter: "E",
    title: "Edit file",
  },
];

export const WithSections: Story = {
  render: () => ({
    components,
    setup: () => ({actions: FILE_ACTIONS}),
    template: `
      <Surface class="w-[256px] rounded-3xl shadow-surface">
        <ListBox aria-label="File actions" class="w-full p-2" selection-mode="none">
          <ListBoxSection>
            <Header>Actions</Header>
            <ListBoxItem
              v-for="action in actions"
              :key="action.id"
              :id="action.id"
              :text-value="action.title"
            >
              <div class="flex h-8 items-start justify-center pt-px">
                <span class="size-4 shrink-0 text-muted" />
              </div>
              <div class="flex flex-col">
                <Label>{{ action.title }}</Label>
                <Description>{{ action.description }}</Description>
              </div>
              <Kbd class="ms-auto" variant="light">
                <KbdAbbr v-for="key in action.keys" :key="key" :key-value="key" />
                <KbdContent>{{ action.letter }}</KbdContent>
              </Kbd>
            </ListBoxItem>
          </ListBoxSection>
          <Separator />
          <ListBoxSection>
            <Header>Danger zone</Header>
            <ListBoxItem id="delete-file" text-value="Delete file" variant="danger">
              <div class="flex h-8 items-start justify-center pt-px">
                <span class="size-4 shrink-0 text-danger" />
              </div>
              <div class="flex flex-col">
                <Label>Delete file</Label>
                <Description>Move to trash</Description>
              </div>
              <Kbd class="ms-auto" variant="light">
                <KbdAbbr key-value="command" />
                <KbdAbbr key-value="shift" />
                <KbdContent>D</KbdContent>
              </Kbd>
            </ListBoxItem>
          </ListBoxSection>
        </ListBox>
      </Surface>
    `,
  }),
};

export const WithDisabledItems: Story = {
  render: () => ({
    components,
    setup: () => ({actions: FILE_ACTIONS}),
    template: `
      <Surface class="w-[256px] rounded-3xl shadow-surface">
        <ListBox
          aria-label="File actions"
          class="w-full p-2"
          :disabled-keys="['delete-file']"
          selection-mode="none"
        >
          <ListBoxSection>
            <Header>Actions</Header>
            <ListBoxItem
              v-for="action in actions"
              :key="action.id"
              :id="action.id"
              :text-value="action.title"
            >
              <div class="flex flex-col">
                <Label>{{ action.title }}</Label>
                <Description>{{ action.description }}</Description>
              </div>
            </ListBoxItem>
          </ListBoxSection>
          <Separator />
          <ListBoxSection>
            <Header>Danger zone</Header>
            <ListBoxItem id="delete-file" text-value="Delete file" variant="danger">
              <div class="flex flex-col">
                <Label>Delete file</Label>
                <Description>Move to trash</Description>
              </div>
            </ListBoxItem>
          </ListBoxSection>
        </ListBox>
      </Surface>
    `,
  }),
};

export const MultiSelect: Story = {
  render: () => ({
    components,
    setup: () => ({avatarUrl, users: USERS}),
    template: `
      <Surface class="w-[256px] rounded-3xl shadow-surface">
        <ListBox aria-label="Users" selection-mode="multiple">
          ${userItems(true)}
        </ListBox>
      </Surface>
    `,
  }),
};

export const CustomCheckIcon: Story = {
  render: () => ({
    components,
    setup: () => ({avatarUrl, users: USERS}),
    template: `
      <Surface class="w-[256px] rounded-3xl shadow-surface">
        <ListBox aria-label="Users" selection-mode="multiple">
          <ListBoxItem v-for="user in users" :key="user.id" :id="user.id" :text-value="user.name">
            <Avatar size="sm">
              <AvatarImage :src="avatarUrl(user.color)" />
              <AvatarFallback>{{ user.initial }}</AvatarFallback>
            </Avatar>
            <div class="flex flex-col">
              <Label>{{ user.name }}</Label>
              <Description>{{ user.email }}</Description>
            </div>
            <ListBoxItemIndicator v-slot="{isSelected}">
              <span v-if="isSelected" class="text-accent">✓</span>
            </ListBoxItemIndicator>
          </ListBoxItem>
        </ListBox>
      </Surface>
    `,
  }),
};

export const Controlled: Story = {
  render: () => ({
    components,
    setup: () => ({avatarUrl, selected: ref(new Set(["2"])), users: USERS}),
    template: `
      <div class="flex flex-col gap-4">
        <Surface class="w-[256px] rounded-3xl shadow-surface">
          <ListBox
            v-model:selected-keys="selected"
            aria-label="Users"
            selection-mode="multiple"
          >
            ${userItems(true)}
          </ListBox>
        </Surface>
        <p class="text-sm text-muted">Selected: {{ [...selected].join(", ") || "none" }}</p>
      </div>
    `,
  }),
};
