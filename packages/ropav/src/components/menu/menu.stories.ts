import type { CollectionSelection } from "../../composables/use-selection-manager";
import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import { shallowRef } from "vue";

import { Description } from "../description";
import { EmptyState } from "../empty-state";
import { Header } from "../header";
import { KbdAbbr, KbdContent, Kbd } from "../kbd";
import { Label } from "../label";
import { MenuItemIndicator, MenuItem } from "../menu-item";
import { MenuSection } from "../menu-section";
import { Separator } from "../separator";
import { Surface } from "../surface";

import MenuRoot from "./menu-root.vue";

// Registered under flat names: a story template is compiled at runtime with no binding
// metadata, so a dotted tag would be looked up as a component literally named "Menu.Item".
const components = {
  Description: Description,
  EmptyState: EmptyState,
  Header: Header,
  Kbd: Kbd,
  KbdAbbr,
  KbdContent,
  Label: Label,
  Menu: MenuRoot,
  MenuItem: MenuItem,
  MenuItemIndicator,
  MenuSection: MenuSection,
  Separator: Separator,
  Surface: Surface,
};

const meta: StoryMeta = {
  component: MenuRoot,
  parameters: {
    layout: "centered",
  },
  title: "Components/Collections/Menu",
};

export default meta;

type Story = StoryObj<typeof meta>;

const VIEWS = [
  { id: "list", label: "List" },
  { id: "grid", label: "Grid" },
  { id: "gallery", label: "Gallery" },
];

/**
 * The menu with no trigger over it, which is what separates `Menu` from `Dropdown`: it is already
 * open because there is nothing to open it, so it needs a surface of its own to sit on and a name of
 * its own to answer to.
 */
export const Default: Story = {
  render: () => ({
    components,
    template: `
      <Surface class="w-64 p-0">
        <Menu aria-label="File actions">
          <MenuItem id="new-file" text-value="New file">
            <Label>New file</Label>
          </MenuItem>
          <MenuItem id="copy-link" text-value="Copy link">
            <Label>Copy link</Label>
          </MenuItem>
          <MenuItem id="edit-file" text-value="Edit file">
            <Label>Edit file</Label>
          </MenuItem>
          <Separator />
          <MenuItem id="delete-file" text-value="Delete file" variant="danger">
            <Label>Delete file</Label>
          </MenuItem>
        </Menu>
      </Surface>
    `,
  }),
};

/**
 * Named by an element instead of by a string, which is how a menu under a heading takes its name
 * without repeating it.
 */
/** A row as tall as a field of the same size, for a menu standing beside one. */
export const Sizes: Story = {
  render: () => ({
    components,
    setup: () => ({ sizes: ["sm", "md", "lg"] as const }),
    template: `
      <div class="flex items-start gap-4">
        <Surface v-for="size in sizes" :key="size" class="w-52 p-0">
          <Menu :aria-label="'File actions ' + size" :size="size">
            <MenuItem id="new-file" text-value="New file">
              <Label>New file</Label>
            </MenuItem>
            <MenuItem id="copy-link" text-value="Copy link">
              <Label>Copy link</Label>
            </MenuItem>
            <Separator />
            <MenuItem id="delete-file" text-value="Delete file" variant="danger">
              <Label>Delete file</Label>
            </MenuItem>
          </Menu>
        </Surface>
      </div>
    `,
  }),
};

export const NamedByAHeading: Story = {
  render: () => ({
    components,
    template: `
      <Surface class="w-64 p-0">
        <h3 class="px-3 pt-3 text-sm font-medium" id="menu-story-heading">Edit</h3>
        <Menu aria-labelledby="menu-story-heading">
          <MenuItem id="cut" text-value="Cut">
            <Label>Cut</Label>
            <Kbd class="ms-auto"><KbdAbbr>⌘</KbdAbbr><KbdContent>X</KbdContent></Kbd>
          </MenuItem>
          <MenuItem id="copy" text-value="Copy">
            <Label>Copy</Label>
            <Kbd class="ms-auto"><KbdAbbr>⌘</KbdAbbr><KbdContent>C</KbdContent></Kbd>
          </MenuItem>
          <MenuItem id="paste" text-value="Paste">
            <Label>Paste</Label>
            <Kbd class="ms-auto"><KbdAbbr>⌘</KbdAbbr><KbdContent>V</KbdContent></Kbd>
          </MenuItem>
        </Menu>
      </Surface>
    `,
  }),
};

export const WithSections: Story = {
  render: () => ({
    components,
    template: `
      <Surface class="w-64 p-0">
        <Menu aria-label="Document">
          <MenuSection>
            <Header>File</Header>
            <MenuItem id="new-file" text-value="New file">
              <Label>New file</Label>
            </MenuItem>
            <MenuItem id="open-file" text-value="Open file">
              <Label>Open file</Label>
            </MenuItem>
          </MenuSection>
          <Separator />
          <MenuSection>
            <Header>Share</Header>
            <MenuItem id="copy-link" text-value="Copy link">
              <Label>Copy link</Label>
              <Description>Anyone with the link can view</Description>
            </MenuItem>
          </MenuSection>
        </Menu>
      </Surface>
    `,
  }),
};

export const WithSingleSelection: Story = {
  render: () => ({
    components,
    setup: () => ({
      selected: shallowRef<CollectionSelection>(new Set(["list"])),
      views: VIEWS,
    }),
    template: `
      <Surface class="w-64 p-0">
        <Menu aria-label="View" v-model:selected-keys="selected" selection-mode="single">
          <MenuItem
            v-for="view in views"
            :id="view.id"
            :key="view.id"
            :text-value="view.label"
          >
            <MenuItemIndicator />
            <Label>{{ view.label }}</Label>
          </MenuItem>
        </Menu>
      </Surface>
    `,
  }),
};

export const WithMultipleSelection: Story = {
  render: () => ({
    components,
    setup: () => ({
      selected: shallowRef<CollectionSelection>(new Set(["grid"])),
      views: VIEWS,
    }),
    template: `
      <Surface class="w-64 p-0">
        <Menu aria-label="Columns" v-model:selected-keys="selected" selection-mode="multiple">
          <MenuItem
            v-for="view in views"
            :id="view.id"
            :key="view.id"
            :text-value="view.label"
          >
            <MenuItemIndicator />
            <Label>{{ view.label }}</Label>
          </MenuItem>
        </Menu>
      </Surface>
    `,
  }),
};

export const WithDisabledItems: Story = {
  render: () => ({
    components,
    template: `
      <Surface class="w-64 p-0">
        <Menu aria-label="File actions" :disabled-keys="['edit-file']">
          <MenuItem id="new-file" text-value="New file">
            <Label>New file</Label>
          </MenuItem>
          <MenuItem id="edit-file" text-value="Edit file">
            <Label>Edit file</Label>
          </MenuItem>
          <MenuItem id="delete-file" is-disabled text-value="Delete file" variant="danger">
            <Label>Delete file</Label>
          </MenuItem>
        </Menu>
      </Surface>
    `,
  }),
};

/**
 * Rendered beside the items rather than instead of them, so the collection is never emptied.
 *
 * This story is why the empty slot is a disabled `menuitem` rather than a `presentation` wrapper:
 * a menu owning anything else is not a valid menu, and no story had ever rendered an empty
 * collection before, so nothing had said so.
 */
export const Empty: Story = {
  render: () => ({
    components,
    template: `
      <Surface class="w-64 p-0">
        <Menu aria-label="Search results">
          <template #empty>
            <EmptyState>No results</EmptyState>
          </template>
        </Menu>
      </Surface>
    `,
  }),
};
