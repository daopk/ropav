import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { computed, ref } from "vue";

import { useDragAndDrop } from "../../composables/use-drag-and-drop";
import { avatarSrc } from "../../utils/story-assets";
import { ListLayout } from "../../utils/virtualizer-list-layout";
import { AvatarFallback, AvatarImage, AvatarRoot } from "../avatar";
import { DescriptionRoot } from "../description";
import { HeaderRoot } from "../header";
import { KbdAbbr, KbdContent, KbdRoot } from "../kbd";
import { LabelRoot } from "../label";
import { ListBoxItemIndicator, ListBoxItemRoot } from "../list-box-item";
import { ListBoxSectionRoot } from "../list-box-section";
import { SeparatorRoot } from "../separator";
import { SurfaceRoot } from "../surface";
import { VirtualizerRoot } from "../virtualizer";

import { ListBoxDropIndicator, ListBoxRoot } from "./index";

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
  ListBoxDropIndicator,
  ListBoxItem: ListBoxItemRoot,
  ListBoxItemIndicator,
  ListBoxSection: ListBoxSectionRoot,
  Separator: SeparatorRoot,
  Surface: SurfaceRoot,
  Virtualizer: VirtualizerRoot,
};

const meta: StoryMeta = {
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
    email: "bob@ropav.com",
    id: "1",
    initial: "B",
    name: "Bob",
  },
  {
    color: "green",
    email: "fred@ropav.com",
    id: "2",
    initial: "F",
    name: "Fred",
  },
  {
    color: "purple",
    email: "martha@ropav.com",
    id: "3",
    initial: "M",
    name: "Martha",
  },
];

const avatarUrl = avatarSrc;

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
    setup: () => ({ avatarUrl, users: USERS.slice(0, 3) }),
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
    setup: () => ({ actions: FILE_ACTIONS }),
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
    setup: () => ({ actions: FILE_ACTIONS }),
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
    setup: () => ({ avatarUrl, users: USERS }),
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
    setup: () => ({ avatarUrl, users: USERS }),
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
    setup: () => ({ avatarUrl, selected: ref(new Set(["2"])), users: USERS }),
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

const FIRST_NAMES = [
  "Emma",
  "Liam",
  "Olivia",
  "Noah",
  "Ava",
  "James",
  "Sophia",
  "Oliver",
  "Isabella",
  "Lucas",
  "Mia",
  "Ethan",
  "Charlotte",
  "Mason",
  "Amelia",
  "Logan",
  "Harper",
  "Alexander",
  "Ella",
  "Benjamin",
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Anderson",
  "Taylor",
  "Thomas",
  "Jackson",
  "White",
  "Harris",
  "Clark",
  "Lewis",
  "Robinson",
  "Walker",
];

interface VirtualizedUser {
  id: number;
  name: string;
  email: string;
}

/** The same names in the same order as the React story, so the two can be compared row by row. */
const generateUsers = (count: number): VirtualizedUser[] =>
  Array.from({ length: count }, (_, index) => {
    const firstName = FIRST_NAMES[index % FIRST_NAMES.length]!;
    const lastName = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length]!;

    return {
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@acme.com`,
      id: index + 1,
      name: `${firstName} ${lastName}`,
    };
  });

export const Virtualization: Story = {
  render: () => ({
    components,
    setup: () => ({ layout: ListLayout, users: generateUsers(1000) }),
    template: `
      <Virtualizer :layout="layout" :layout-options="{rowHeight: 50}">
        <ListBox
          aria-label="Virtualized list with 1000 items"
          class="h-[400px] w-[300px] overflow-y-auto"
          :item-text-value="(user) => user.name"
          :items="users"
        >
          <template #default="{item}">
            <ListBoxItem :id="item.id" :text-value="item.name">
              <div class="flex flex-col">
                <Label>{{ item.name }}</Label>
                <Description>{{ item.email }}</Description>
              </div>
              <ListBoxItemIndicator />
            </ListBoxItem>
          </template>
        </ListBox>
      </Virtualizer>
    `,
  }),
};

/**
 * Reordering items, by pointer and by keyboard.
 *
 * The whole configuration is `useDragAndDrop`: `getItems` says what an item *is* on the drag, and
 * `onReorder` is what makes the listbox droppable at all — a listbox with nothing to do with an
 * arriving item is not a drop target.
 *
 * Unlike a table row, an option has no drag handle: it drags itself, so the keyboard gesture is
 * **Alt+Enter** rather than plain Enter, because Enter already selects. The option's own
 * description says so, and a screen reader reads it out on focus.
 *
 * The drop indicator carries no styling of its own — `@ropav/styles` has no rule for one, and
 * React Aria ships its own unstyled too — so the line is the indicator's own `class` here.
 */
export const DragAndDrop: Story = {
  render: () => ({
    components,
    setup: () => {
      const order = ref(USERS.slice(0, 3).map((user) => user.id));
      const byId = new Map(USERS.map((user) => [user.id, user]));

      const { dragAndDropHooks } = useDragAndDrop({
        getItems: (keys) =>
          [...keys].map((key) => ({ "text/plain": byId.get(String(key))?.name ?? "" })),
        onReorder(event) {
          const moving = [...event.keys].map(String);
          const rest = order.value.filter((key) => !moving.includes(key));
          const index = rest.indexOf(String(event.target.key));
          const at = event.target.dropPosition === "before" ? index : index + 1;

          order.value = [...rest.slice(0, at), ...moving, ...rest.slice(at)];
        },
      });

      return {
        dragAndDropHooks,
        items: computed(() => order.value.map((id) => byId.get(id)!)),
      };
    },
    template: `
      <ListBox
        aria-label="Reorderable users"
        class="w-[220px]"
        :drag-and-drop-hooks="dragAndDropHooks"
        selection-mode="multiple"
      >
        <template v-for="user of items" :key="user.id">
          <ListBoxDropIndicator
            class="h-0.5 data-[drop-target=true]:bg-accent"
            :target="{type: 'item', key: user.id, dropPosition: 'before'}"
          />
          <ListBoxItem :id="user.id" :text-value="user.name">{{ user.name }}</ListBoxItem>
        </template>
        <ListBoxDropIndicator
          class="h-0.5 data-[drop-target=true]:bg-accent"
          :target="{type: 'item', key: items[items.length - 1].id, dropPosition: 'after'}"
        />
      </ListBox>
    `,
  }),
};
