import type { CollectionSelection } from "../../composables/use-selection-manager";
import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3";

import { computed, shallowRef } from "vue";
import IconArrowRight from "~icons/gravity-ui/arrow-right";
import IconArrowRightFromSquare from "~icons/gravity-ui/arrow-right-from-square";
import IconBars from "~icons/gravity-ui/bars";
import IconEllipsisVertical from "~icons/gravity-ui/ellipsis-vertical";
import IconFloppyDisk from "~icons/gravity-ui/floppy-disk";
import IconFolderOpen from "~icons/gravity-ui/folder-open";
import IconGear from "~icons/gravity-ui/gear";
import IconPencil from "~icons/gravity-ui/pencil";
import IconPersons from "~icons/gravity-ui/persons";
import IconSquarePlus from "~icons/gravity-ui/square-plus";
import IconTrashBin from "~icons/gravity-ui/trash-bin";

import { avatarSrc } from "../../utils/story-assets";
import { AvatarFallback, AvatarImage, AvatarRoot } from "../avatar";
import { ButtonRoot } from "../button";
import { DescriptionRoot } from "../description";
import { HeaderRoot } from "../header";
import { KbdAbbr, KbdContent, KbdRoot } from "../kbd";
import { LabelRoot } from "../label";
import { MenuItemIndicator, MenuItemRoot, MenuItemSubmenuIndicator } from "../menu-item";
import { MenuSectionRoot } from "../menu-section";
import { SeparatorRoot } from "../separator";

import DropdownMenu from "./dropdown-menu.vue";
import DropdownPopover from "./dropdown-popover.vue";
import DropdownRoot from "./dropdown-root.vue";
import DropdownSubmenuTrigger from "./dropdown-submenu-trigger.vue";
import DropdownTrigger from "./dropdown-trigger.vue";

// Registered under flat names: a story template is compiled at runtime with no binding
// metadata, so a dotted tag would be looked up as a component literally named "Dropdown.Item".
const components = {
  Avatar: AvatarRoot,
  AvatarFallback,
  AvatarImage,
  Button: ButtonRoot,
  Description: DescriptionRoot,
  Dropdown: DropdownRoot,
  DropdownItem: MenuItemRoot,
  DropdownItemIndicator: MenuItemIndicator,
  DropdownMenu,
  DropdownPopover,
  DropdownSection: MenuSectionRoot,
  DropdownSubmenuIndicator: MenuItemSubmenuIndicator,
  DropdownSubmenuTrigger,
  DropdownTrigger,
  Header: HeaderRoot,
  Kbd: KbdRoot,
  KbdAbbr,
  KbdContent,
  Label: LabelRoot,
  Separator: SeparatorRoot,
};

const meta: StoryMeta = {
  component: DropdownRoot,
  parameters: {
    layout: "centered",
  },
  title: "Components/Collections/Dropdown",
};

export default meta;

type Story = StoryObj<typeof meta>;

const FRUITS = [
  { id: "apple", label: "Apple" },
  { id: "banana", label: "Banana" },
  { id: "cherry", label: "Cherry" },
];

const FILE_ACTIONS = [
  { icon: "IconSquarePlus", id: "new-file", label: "New file", letter: "N" },
  { icon: "IconFolderOpen", id: "open-file", label: "Open file", letter: "O" },
  { icon: "IconFloppyDisk", id: "save-file", label: "Save file", letter: "S" },
];

const DESCRIBED_ACTIONS = [
  {
    description: "Create a new file",
    icon: "IconSquarePlus",
    id: "new-file",
    label: "New file",
    letter: "N",
  },
  {
    description: "Open an existing file",
    icon: "IconFolderOpen",
    id: "open-file",
    label: "Open file",
    letter: "O",
  },
  {
    description: "Save the current file",
    icon: "IconFloppyDisk",
    id: "save-file",
    label: "Save file",
    letter: "S",
  },
];

export const Default: Story = {
  render: () => ({
    components,
    template: `
      <Dropdown>
        <Button aria-label="Menu" variant="secondary">Actions</Button>
        <DropdownPopover>
          <DropdownMenu>
            <DropdownSection>
              <DropdownItem id="new-file" text-value="New file">
                <Label>New file</Label>
              </DropdownItem>
              <DropdownItem id="copy-link" text-value="Copy link">
                <Label>Copy link</Label>
              </DropdownItem>
              <DropdownItem id="edit-file" text-value="Edit file">
                <Label>Edit file</Label>
              </DropdownItem>
            </DropdownSection>
            <Separator />
            <DropdownSection>
              <DropdownItem id="delete-file" text-value="Delete file" variant="danger">
                <Label>Delete file</Label>
              </DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </DropdownPopover>
      </Dropdown>
    `,
  }),
};

export const WithSingleSelection: Story = {
  render: () => ({
    components,
    setup: () => ({
      fruits: FRUITS,
      selected: shallowRef<CollectionSelection>(new Set(["apple"])),
    }),
    template: `
      <Dropdown>
        <Button aria-label="Menu" variant="secondary">Fruit</Button>
        <DropdownPopover class="min-w-[256px]">
          <DropdownMenu v-model:selected-keys="selected" selection-mode="single">
            <DropdownSection>
              <Header>Select a fruit</Header>
              <DropdownItem
                v-for="fruit in fruits"
                :id="fruit.id"
                :key="fruit.id"
                :text-value="fruit.label"
              >
                <DropdownItemIndicator />
                <Label>{{ fruit.label }}</Label>
              </DropdownItem>
            </DropdownSection>
            <DropdownItem id="orange" text-value="Orange">
              <DropdownItemIndicator />
              <Label>Orange</Label>
            </DropdownItem>
            <DropdownItem id="pear" text-value="Pear">
              <DropdownItemIndicator />
              <Label>Pear</Label>
            </DropdownItem>
          </DropdownMenu>
        </DropdownPopover>
      </Dropdown>
    `,
  }),
};

export const SingleWithCustomIndicator: Story = {
  render: () => ({
    components,
    setup: () => ({
      fruits: FRUITS,
      selected: shallowRef<CollectionSelection>(new Set(["apple"])),
    }),
    // The indicator's slot receives the item's own selected state, which is what a custom mark
    // needs in order to know whether to draw anything at all.
    template: `
      <Dropdown>
        <Button aria-label="Menu" variant="secondary">Fruits</Button>
        <DropdownPopover class="min-w-[256px]">
          <DropdownMenu v-model:selected-keys="selected" selection-mode="single">
            <DropdownSection>
              <Header>Select a fruit</Header>
              <DropdownItem
                v-for="fruit in fruits"
                :id="fruit.id"
                :key="fruit.id"
                :text-value="fruit.label"
              >
                <DropdownItemIndicator>
                  <template #default="{isSelected}">
                    <svg
                      v-if="isSelected"
                      height="16"
                      viewBox="0 0 16 16"
                      width="16"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        class="text-accent"
                        clip-rule="evenodd"
                        d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14m3.1-8.55a.75.75 0 1 0-1.2-.9L7.419 8.858L6.03 7.47a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.13-.08z"
                        fill="currentColor"
                        fill-rule="evenodd"
                      />
                    </svg>
                  </template>
                </DropdownItemIndicator>
                <Label>{{ fruit.label }}</Label>
              </DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </DropdownPopover>
      </Dropdown>
    `,
  }),
};

export const WithMultipleSelection: Story = {
  render: () => ({
    components,
    setup: () => ({
      fruits: FRUITS,
      selected: shallowRef<CollectionSelection>(new Set(["apple"])),
    }),
    template: `
      <Dropdown>
        <Button aria-label="Menu" variant="secondary">Preferred Fruits</Button>
        <DropdownPopover class="min-w-[256px]">
          <DropdownMenu v-model:selected-keys="selected" selection-mode="multiple">
            <DropdownSection>
              <Header>Select a fruit</Header>
              <DropdownItem
                v-for="fruit in fruits"
                :id="fruit.id"
                :key="fruit.id"
                :text-value="fruit.label"
              >
                <DropdownItemIndicator />
                <Label>{{ fruit.label }}</Label>
              </DropdownItem>
            </DropdownSection>
            <DropdownItem id="orange" text-value="Orange">
              <DropdownItemIndicator />
              <Label>Orange</Label>
            </DropdownItem>
            <DropdownItem id="pear" text-value="Pear">
              <DropdownItemIndicator />
              <Label>Pear</Label>
            </DropdownItem>
          </DropdownMenu>
        </DropdownPopover>
      </Dropdown>
    `,
  }),
};

const TEXT_STYLES = [
  { id: "bold", label: "Bold", letter: "B" },
  { id: "italic", label: "Italic", letter: "I" },
  { id: "underline", label: "Underline", letter: "U" },
];

const TEXT_ALIGNMENTS = [
  { id: "left", label: "Left", letter: "A" },
  { id: "center", label: "Center", letter: "H" },
  { id: "right", label: "Right", letter: "D" },
];

export const WithSectionLevelSelection: Story = {
  render: () => ({
    components,
    setup: () => ({
      alignments: TEXT_ALIGNMENTS,
      styles: TEXT_STYLES,
      textAlignment: shallowRef<CollectionSelection>(new Set(["left"])),
      textStyles: shallowRef<CollectionSelection>(new Set(["bold", "italic"])),
    }),
    // Each section carries its own selection while sharing the menu's focus, so arrowing runs
    // straight through all three without either selection interfering with the other.
    template: `
      <Dropdown>
        <Button aria-label="Menu" variant="secondary">Styles</Button>
        <DropdownPopover class="min-w-[256px]">
          <DropdownMenu>
            <DropdownSection>
              <Header>Actions</Header>
              <DropdownItem id="cut" text-value="Cut">
                <Label>Cut</Label>
                <Kbd class="ms-auto" variant="light">
                  <KbdAbbr key-value="command" />
                  <KbdContent>X</KbdContent>
                </Kbd>
              </DropdownItem>
              <DropdownItem id="copy" text-value="Copy">
                <Label>Copy</Label>
                <Kbd class="ms-auto" variant="light">
                  <KbdAbbr key-value="command" />
                  <KbdContent>C</KbdContent>
                </Kbd>
              </DropdownItem>
              <DropdownItem id="paste" text-value="Paste">
                <Label>Paste</Label>
                <Kbd class="ms-auto" variant="light">
                  <KbdAbbr key-value="command" />
                  <KbdContent>U</KbdContent>
                </Kbd>
              </DropdownItem>
            </DropdownSection>
            <Separator />
            <DropdownSection v-model:selected-keys="textStyles" selection-mode="multiple">
              <Header>Text Style</Header>
              <DropdownItem
                v-for="style in styles"
                :id="style.id"
                :key="style.id"
                :text-value="style.label"
              >
                <DropdownItemIndicator />
                <Label>{{ style.label }}</Label>
                <Kbd class="ms-auto" variant="light">
                  <KbdAbbr key-value="command" />
                  <KbdContent>{{ style.letter }}</KbdContent>
                </Kbd>
              </DropdownItem>
            </DropdownSection>
            <Separator />
            <DropdownSection v-model:selected-keys="textAlignment" selection-mode="single">
              <Header>Text Alignment</Header>
              <DropdownItem
                v-for="alignment in alignments"
                :id="alignment.id"
                :key="alignment.id"
                :text-value="alignment.label"
              >
                <DropdownItemIndicator type="dot" />
                <Label>{{ alignment.label }}</Label>
                <Kbd class="ms-auto" variant="light">
                  <KbdAbbr key-value="alt" />
                  <KbdContent>{{ alignment.letter }}</KbdContent>
                </Kbd>
              </DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </DropdownPopover>
      </Dropdown>
    `,
  }),
};

export const WithKeyboardShortcuts: Story = {
  render: () => ({
    components,
    setup: () => ({
      actions: [
        { id: "new", label: "New", letter: "N" },
        { id: "open", label: "Open", letter: "O" },
        { id: "save", label: "Save", letter: "S" },
      ],
    }),
    template: `
      <Dropdown>
        <Button aria-label="Menu" variant="secondary">Actions</Button>
        <DropdownPopover>
          <DropdownMenu>
            <DropdownItem
              v-for="action in actions"
              :id="action.id"
              :key="action.id"
              :text-value="action.label"
            >
              <Label>{{ action.label }}</Label>
              <Kbd class="ms-auto" variant="light">
                <KbdAbbr key-value="command" />
                <KbdContent>{{ action.letter }}</KbdContent>
              </Kbd>
            </DropdownItem>
            <DropdownItem id="delete" text-value="Delete" variant="danger">
              <Label>Delete</Label>
              <Kbd class="ms-auto" variant="light">
                <KbdAbbr key-value="command" />
                <KbdAbbr key-value="shift" />
                <KbdContent>D</KbdContent>
              </Kbd>
            </DropdownItem>
          </DropdownMenu>
        </DropdownPopover>
      </Dropdown>
    `,
  }),
};

export const WithIcons: Story = {
  render: () => ({
    components: { ...components, IconFloppyDisk, IconFolderOpen, IconSquarePlus, IconTrashBin },
    template: `
      <Dropdown>
        <Button aria-label="Menu" variant="secondary">Actions</Button>
        <DropdownPopover>
          <DropdownMenu>
            <DropdownItem id="new-file" text-value="New file">
              <IconSquarePlus class="size-4 shrink-0 text-muted" />
              <Label>New file</Label>
              <Kbd class="ms-auto" variant="light">
                <KbdAbbr key-value="command" />
                <KbdContent>N</KbdContent>
              </Kbd>
            </DropdownItem>
            <DropdownItem id="open-file" text-value="Open file">
              <IconFolderOpen class="size-4 shrink-0 text-muted" />
              <Label>Open file</Label>
              <Kbd class="ms-auto" variant="light">
                <KbdAbbr key-value="command" />
                <KbdContent>O</KbdContent>
              </Kbd>
            </DropdownItem>
            <DropdownItem id="save-file" text-value="Save file">
              <IconFloppyDisk class="size-4 shrink-0 text-muted" />
              <Label>Save file</Label>
              <Kbd class="ms-auto" variant="light">
                <KbdAbbr key-value="command" />
                <KbdContent>S</KbdContent>
              </Kbd>
            </DropdownItem>
            <DropdownItem id="delete-file" text-value="Delete file" variant="danger">
              <IconTrashBin class="size-4 shrink-0 text-danger" />
              <Label>Delete file</Label>
              <Kbd class="ms-auto" variant="light">
                <KbdAbbr key-value="command" />
                <KbdAbbr key-value="shift" />
                <KbdContent>D</KbdContent>
              </Kbd>
            </DropdownItem>
          </DropdownMenu>
        </DropdownPopover>
      </Dropdown>
    `,
  }),
};

export const LongPressTrigger: Story = {
  render: () => ({
    components,
    setup: () => ({ actions: FILE_ACTIONS }),
    // Nothing on screen says the press has to be held, so the trigger describes the gesture to
    // assistive technology and answers Alt+ArrowDown as the keyboard way in.
    template: `
      <Dropdown trigger="longPress">
        <Button aria-label="Menu" variant="secondary">Long Press</Button>
        <DropdownPopover>
          <DropdownMenu>
            <DropdownItem
              v-for="action in actions"
              :id="action.id"
              :key="action.id"
              :text-value="action.label"
            >
              <Label>{{ action.label }}</Label>
            </DropdownItem>
            <DropdownItem id="delete-file" text-value="Delete file" variant="danger">
              <Label>Delete file</Label>
            </DropdownItem>
          </DropdownMenu>
        </DropdownPopover>
      </Dropdown>
    `,
  }),
};

export const WithDescriptions: Story = {
  render: () => ({
    components: { ...components, IconFloppyDisk, IconFolderOpen, IconSquarePlus, IconTrashBin },
    setup: () => ({ actions: DESCRIBED_ACTIONS }),
    template: `
      <Dropdown>
        <Button aria-label="Menu" variant="secondary">Actions</Button>
        <DropdownPopover>
          <DropdownMenu>
            <DropdownItem
              v-for="action in actions"
              :id="action.id"
              :key="action.id"
              :text-value="action.label"
            >
              <div class="flex h-8 items-start justify-center pt-px">
                <component :is="action.icon" class="size-4 shrink-0 text-muted" />
              </div>
              <div class="flex flex-col">
                <Label>{{ action.label }}</Label>
                <Description>{{ action.description }}</Description>
              </div>
              <Kbd class="ms-auto" variant="light">
                <KbdAbbr key-value="command" />
                <KbdContent>{{ action.letter }}</KbdContent>
              </Kbd>
            </DropdownItem>
            <DropdownItem id="delete-file" text-value="Delete file" variant="danger">
              <div class="flex h-8 items-start justify-center pt-px">
                <IconTrashBin class="size-4 shrink-0 text-danger" />
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
            </DropdownItem>
          </DropdownMenu>
        </DropdownPopover>
      </Dropdown>
    `,
  }),
};

export const WithSections: Story = {
  render: () => ({
    components: { ...components, IconEllipsisVertical, IconPencil, IconSquarePlus, IconTrashBin },
    // A trigger of its own, for a control that is not a button: it carries the dropdown's own
    // trigger class and borrows the button's look through utilities.
    template: `
      <Dropdown>
        <DropdownTrigger
          aria-label="Menu"
          class="button button-md button--secondary button--icon-only data-[focus-visible=true]:status-focused"
        >
          <IconEllipsisVertical class="outline-none" />
        </DropdownTrigger>
        <DropdownPopover>
          <DropdownMenu>
            <DropdownSection>
              <Header>Actions</Header>
              <DropdownItem id="new-file" text-value="New file">
                <div class="flex h-8 items-start justify-center pt-px">
                  <IconSquarePlus class="size-4 shrink-0 text-muted" />
                </div>
                <div class="flex flex-col">
                  <Label>New file</Label>
                  <Description>Create a new file</Description>
                </div>
                <Kbd class="ms-auto" variant="light">
                  <KbdAbbr key-value="command" />
                  <KbdContent>N</KbdContent>
                </Kbd>
              </DropdownItem>
              <DropdownItem id="edit-file" text-value="Edit file">
                <div class="flex h-8 items-start justify-center pt-px">
                  <IconPencil class="size-4 shrink-0 text-muted" />
                </div>
                <div class="flex flex-col">
                  <Label>Edit file</Label>
                  <Description>Make changes</Description>
                </div>
                <Kbd class="ms-auto" variant="light">
                  <KbdAbbr key-value="command" />
                  <KbdContent>E</KbdContent>
                </Kbd>
              </DropdownItem>
            </DropdownSection>
            <Separator />
            <DropdownSection>
              <Header>Danger zone</Header>
              <DropdownItem id="delete-file" text-value="Delete file" variant="danger">
                <div class="flex h-8 items-start justify-center pt-px">
                  <IconTrashBin class="size-4 shrink-0 text-danger" />
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
              </DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </DropdownPopover>
      </Dropdown>
    `,
  }),
};

export const WithDisabledItems: Story = {
  render: () => ({
    components: { ...components, IconBars, IconPencil, IconSquarePlus, IconTrashBin },
    setup: () => ({ disabledKeys: ["delete-file"] }),
    template: `
      <Dropdown>
        <Button is-icon-only aria-label="Menu" variant="secondary">
          <IconBars class="outline-none" />
        </Button>
        <DropdownPopover class="min-w-[220px]">
          <DropdownMenu :disabled-keys="disabledKeys">
            <DropdownSection>
              <Header>Actions</Header>
              <DropdownItem id="new-file" text-value="New file">
                <div class="flex h-8 items-start justify-center pt-px">
                  <IconSquarePlus class="size-4 shrink-0 text-muted" />
                </div>
                <div class="flex flex-col">
                  <Label>New file</Label>
                  <Description>Create a new file</Description>
                </div>
                <Kbd class="ms-auto" variant="light">
                  <KbdAbbr key-value="command" />
                  <KbdContent>N</KbdContent>
                </Kbd>
              </DropdownItem>
              <DropdownItem id="edit-file" text-value="Edit file">
                <div class="flex h-8 items-start justify-center pt-px">
                  <IconPencil class="size-4 shrink-0 text-muted" />
                </div>
                <div class="flex flex-col">
                  <Label>Edit file</Label>
                  <Description>Make changes</Description>
                </div>
                <Kbd class="ms-auto" variant="light">
                  <KbdAbbr key-value="command" />
                  <KbdContent>E</KbdContent>
                </Kbd>
              </DropdownItem>
            </DropdownSection>
            <Separator />
            <DropdownSection>
              <Header>Danger zone</Header>
              <DropdownItem id="delete-file" text-value="Delete file" variant="danger">
                <div class="flex h-8 items-start justify-center pt-px">
                  <IconTrashBin class="size-4 shrink-0 text-danger" />
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
              </DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </DropdownPopover>
      </Dropdown>
    `,
  }),
};

export const WithSubmenus: Story = {
  render: () => ({
    components,
    // The trigger item and the submenu are siblings, wrapped together: only their common parent
    // knows the two belong to each other.
    template: `
      <Dropdown>
        <Button aria-label="Menu" variant="secondary">Share</Button>
        <DropdownPopover>
          <DropdownMenu>
            <DropdownItem id="copy-link" text-value="Copy Link">
              <Label>Copy Link</Label>
            </DropdownItem>
            <DropdownItem id="facebook" text-value="Facebook">
              <Label>Facebook</Label>
            </DropdownItem>
            <DropdownItem id="twitter" text-value="Twitter">
              <Label>X / Twitter</Label>
            </DropdownItem>
            <DropdownSubmenuTrigger>
              <DropdownItem id="share" text-value="Share">
                <Label>Other</Label>
                <DropdownSubmenuIndicator />
              </DropdownItem>
              <DropdownPopover>
                <DropdownMenu>
                  <DropdownItem id="whatsapp" text-value="WhatsApp">
                    <Label>WhatsApp</Label>
                  </DropdownItem>
                  <DropdownItem id="telegram" text-value="Telegram">
                    <Label>Telegram</Label>
                  </DropdownItem>
                  <DropdownItem id="discord" text-value="Discord">
                    <Label>Discord</Label>
                  </DropdownItem>
                  <DropdownSubmenuTrigger>
                    <DropdownItem id="email" text-value="Email">
                      <Label>Email</Label>
                      <DropdownSubmenuIndicator />
                    </DropdownItem>
                    <DropdownPopover>
                      <DropdownMenu>
                        <DropdownItem id="work" text-value="Work email">
                          <Label>Work email</Label>
                        </DropdownItem>
                        <DropdownItem id="personal" text-value="Personal email">
                          <Label>Personal email</Label>
                        </DropdownItem>
                      </DropdownMenu>
                    </DropdownPopover>
                  </DropdownSubmenuTrigger>
                </DropdownMenu>
              </DropdownPopover>
            </DropdownSubmenuTrigger>
          </DropdownMenu>
        </DropdownPopover>
      </Dropdown>
    `,
  }),
};

export const WithCustomSubmenuIndicator: Story = {
  render: () => ({
    components: { ...components, IconArrowRight },
    template: `
      <Dropdown>
        <Button aria-label="Menu" variant="secondary">Share</Button>
        <DropdownPopover>
          <DropdownMenu>
            <DropdownItem id="copy-link" text-value="Copy Link">
              <Label>Copy Link</Label>
            </DropdownItem>
            <DropdownItem id="facebook" text-value="Facebook">
              <Label>Facebook</Label>
            </DropdownItem>
            <DropdownSubmenuTrigger>
              <DropdownItem id="share" text-value="Share">
                <Label>More options</Label>
                <DropdownSubmenuIndicator>
                  <IconArrowRight class="size-3.5 text-muted" />
                </DropdownSubmenuIndicator>
              </DropdownItem>
              <DropdownPopover>
                <DropdownMenu>
                  <DropdownItem id="whatsapp" text-value="WhatsApp">
                    <Label>WhatsApp</Label>
                  </DropdownItem>
                  <DropdownItem id="telegram" text-value="Telegram">
                    <Label>Telegram</Label>
                  </DropdownItem>
                  <DropdownSubmenuTrigger>
                    <DropdownItem id="email" text-value="Email">
                      <Label>Email</Label>
                      <DropdownSubmenuIndicator>
                        <svg
                          class="size-3.5 text-muted"
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </DropdownSubmenuIndicator>
                    </DropdownItem>
                    <DropdownPopover>
                      <DropdownMenu>
                        <DropdownItem id="work" text-value="Work email">
                          <Label>Work email</Label>
                        </DropdownItem>
                        <DropdownItem id="personal" text-value="Personal email">
                          <Label>Personal email</Label>
                        </DropdownItem>
                      </DropdownMenu>
                    </DropdownPopover>
                  </DropdownSubmenuTrigger>
                  <DropdownItem id="discord" text-value="Discord">
                    <Label>Discord</Label>
                  </DropdownItem>
                </DropdownMenu>
              </DropdownPopover>
            </DropdownSubmenuTrigger>
            <DropdownSubmenuTrigger>
              <DropdownItem id="other" text-value="Other">
                <Label>Other (default indicator)</Label>
                <DropdownSubmenuIndicator />
              </DropdownItem>
              <DropdownPopover>
                <DropdownMenu>
                  <DropdownItem id="sms" text-value="SMS">
                    <Label>SMS</Label>
                  </DropdownItem>
                </DropdownMenu>
              </DropdownPopover>
            </DropdownSubmenuTrigger>
          </DropdownMenu>
        </DropdownPopover>
      </Dropdown>
    `,
  }),
};

export const Controlled: Story = {
  render: () => {
    const selected = shallowRef<CollectionSelection>(new Set(["bold"]));

    return {
      components,
      setup: () => ({
        selected,
        summary: computed(() => {
          const keys = selected.value === "all" ? [] : [...selected.value];

          return keys.length > 0 ? keys.join(", ") : "None";
        }),
      }),
      template: `
        <div class="min-w-sm space-y-4">
          <Dropdown>
            <Button aria-label="Menu" variant="secondary">Actions</Button>
            <DropdownPopover>
              <DropdownMenu v-model:selected-keys="selected" selection-mode="multiple">
                <DropdownItem id="bold" text-value="Bold">
                  <Label>Bold</Label>
                  <DropdownItemIndicator />
                </DropdownItem>
                <DropdownItem id="italic" text-value="Italic">
                  <Label>Italic</Label>
                  <DropdownItemIndicator />
                </DropdownItem>
                <DropdownItem id="underline" text-value="Underline">
                  <Label>Underline</Label>
                  <DropdownItemIndicator />
                </DropdownItem>
              </DropdownMenu>
            </DropdownPopover>
          </Dropdown>
          <p class="text-sm text-muted">Selected: {{ summary }}</p>
        </div>
      `,
    };
  },
};

export const ControlledOpenState: Story = {
  render: () => ({
    components,
    setup: () => ({ actions: FILE_ACTIONS, isOpen: shallowRef(false) }),
    template: `
      <div class="min-w-sm space-y-4">
        <p class="text-sm text-muted">
          Dropdown is: <strong>{{ isOpen ? "open" : "closed" }}</strong>
        </p>
        <Dropdown v-model:is-open="isOpen">
          <Button aria-label="Menu" variant="secondary">Actions</Button>
          <DropdownPopover>
            <DropdownMenu>
              <DropdownItem
                v-for="action in actions"
                :id="action.id"
                :key="action.id"
                :text-value="action.label"
              >
                <Label>{{ action.label }}</Label>
              </DropdownItem>
              <DropdownItem id="delete-file" text-value="Delete file" variant="danger">
                <Label>Delete file</Label>
              </DropdownItem>
            </DropdownMenu>
          </DropdownPopover>
        </Dropdown>
      </div>
    `,
  }),
};

export const CustomTrigger: Story = {
  render: () => ({
    components: { ...components, IconArrowRightFromSquare, IconGear, IconPersons },
    setup: () => ({
      avatarUrl: avatarSrc("orange"),
    }),
    template: `
      <Dropdown>
        <DropdownTrigger aria-label="Account" class="rounded-full">
          <Avatar>
            <AvatarImage alt="Junior Garcia" :src="avatarUrl" />
            <AvatarFallback :delay-ms="600">JD</AvatarFallback>
          </Avatar>
        </DropdownTrigger>
        <DropdownPopover>
          <div class="px-3 pt-3 pb-1">
            <div class="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarImage alt="Jane" :src="avatarUrl" />
                <AvatarFallback :delay-ms="600">JD</AvatarFallback>
              </Avatar>
              <div class="flex flex-col gap-0">
                <p class="text-sm leading-5 font-medium">Jane Doe</p>
                <p class="text-xs leading-none text-muted">jane@example.com</p>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownItem id="dashboard" text-value="Dashboard">
              <Label>Dashboard</Label>
            </DropdownItem>
            <DropdownItem id="profile" text-value="Profile">
              <Label>Profile</Label>
            </DropdownItem>
            <DropdownItem id="settings" text-value="Settings">
              <div class="flex w-full items-center justify-between gap-2">
                <Label>Settings</Label>
                <IconGear class="size-3.5 text-muted" />
              </div>
            </DropdownItem>
            <DropdownItem id="new-project" text-value="New project">
              <div class="flex w-full items-center justify-between gap-2">
                <Label>Create Team</Label>
                <IconPersons class="size-3.5 text-muted" />
              </div>
            </DropdownItem>
            <DropdownItem id="logout" text-value="Logout" variant="danger">
              <div class="flex w-full items-center justify-between gap-2">
                <Label>Log Out</Label>
                <IconArrowRightFromSquare class="size-3.5 text-danger" />
              </div>
            </DropdownItem>
          </DropdownMenu>
        </DropdownPopover>
      </Dropdown>
    `,
  }),
};
