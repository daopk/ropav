import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3-vite";

import IconBell from "~icons/gravity-ui/bell";
import IconBookOpen from "~icons/gravity-ui/book-open";
import IconCubes from "~icons/gravity-ui/cubes-3";
import IconEnvelope from "~icons/gravity-ui/envelope";
import IconFlask from "~icons/gravity-ui/flask";
import IconGear from "~icons/gravity-ui/gear";
import IconHouse from "~icons/gravity-ui/house";
import IconMagnifier from "~icons/gravity-ui/magnifier";
import IconPalette from "~icons/gravity-ui/palette";
import IconPerson from "~icons/gravity-ui/person";
import IconPersons from "~icons/gravity-ui/persons";

import SidebarCollapsibleTrigger from "./sidebar-collapsible-trigger.vue";
import SidebarCollapsible from "./sidebar-collapsible.vue";
import SidebarContent from "./sidebar-content.vue";
import SidebarFooter from "./sidebar-footer.vue";
import SidebarGroupLabel from "./sidebar-group-label.vue";
import SidebarGroup from "./sidebar-group.vue";
import SidebarHeader from "./sidebar-header.vue";
import SidebarInset from "./sidebar-inset.vue";
import SidebarItemIcon from "./sidebar-item-icon.vue";
import SidebarItemIndicator from "./sidebar-item-indicator.vue";
import SidebarItemLabel from "./sidebar-item-label.vue";
import SidebarItemTooltip from "./sidebar-item-tooltip.vue";
import SidebarItemTrailing from "./sidebar-item-trailing.vue";
import SidebarItem from "./sidebar-item.vue";
import SidebarPanel from "./sidebar-panel.vue";
import SidebarRail from "./sidebar-rail.vue";
import SidebarRoot from "./sidebar-root.vue";
import SidebarSeparator from "./sidebar-separator.vue";
import SidebarSubMenu from "./sidebar-sub-menu.vue";
import SidebarTrigger from "./sidebar-trigger.vue";

// Registered under flat names: a story template is compiled at runtime with no binding metadata,
// so a dotted tag would be looked up as a component literally named "SidebarItem".
const components = {
  IconBell,
  IconBookOpen,
  IconCubes,
  IconEnvelope,
  IconFlask,
  IconGear,
  IconHouse,
  IconMagnifier,
  IconPalette,
  IconPerson,
  IconPersons,
  Sidebar: SidebarRoot,
  SidebarCollapsible,
  SidebarCollapsibleTrigger,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarItem,
  SidebarItemIcon,
  SidebarItemIndicator,
  SidebarItemLabel,
  SidebarItemTooltip,
  SidebarItemTrailing,
  SidebarPanel,
  SidebarRail,
  SidebarSeparator,
  SidebarSubMenu,
  SidebarTrigger,
};

/** The page beside the nav, so every story shows the sidebar against something. */
const page = `
  <SidebarInset>
    <div class="flex items-center gap-3 border-b border-separator/50 p-4">
      <SidebarTrigger />
      <span class="text-sm font-medium">Inbox</span>
    </div>
    <div class="p-4 text-small text-muted">Page content</div>
  </SidebarInset>
`;

/** The nav itself, shared so the stories differ only in the sidebar's own props. */
const nav = `
  <SidebarHeader v-slot="{ isCollapsed }">
    <span class="flex h-8 items-center gap-2 px-1.5 text-sm font-semibold">
      <span class="flex size-5 shrink-0 items-center justify-center rounded-sm bg-accent text-xs text-accent-foreground">A</span>
      <span v-if="!isCollapsed" class="truncate">Acme</span>
    </span>
  </SidebarHeader>
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <SidebarItem href="#" aria-current="page">
        <SidebarItemIcon><IconHouse /></SidebarItemIcon>
        <SidebarItemLabel>Home</SidebarItemLabel>
      </SidebarItem>
      <SidebarItem href="#">
        <SidebarItemIcon><IconEnvelope /></SidebarItemIcon>
        <SidebarItemLabel>Inbox</SidebarItemLabel>
        <SidebarItemTrailing><span class="text-xs text-muted">12</span></SidebarItemTrailing>
      </SidebarItem>
      <SidebarItem href="#">
        <SidebarItemIcon><IconMagnifier /></SidebarItemIcon>
        <SidebarItemLabel>Search</SidebarItemLabel>
      </SidebarItem>
    </SidebarGroup>
    <SidebarSeparator />
    <SidebarGroup>
      <SidebarGroupLabel>Account</SidebarGroupLabel>
      <SidebarItem href="#">
        <SidebarItemIcon><IconBell /></SidebarItemIcon>
        <SidebarItemLabel>Notifications</SidebarItemLabel>
      </SidebarItem>
      <SidebarItem is-disabled>
        <SidebarItemIcon><IconGear /></SidebarItemIcon>
        <SidebarItemLabel>Settings</SidebarItemLabel>
      </SidebarItem>
    </SidebarGroup>
  </SidebarContent>
  <SidebarFooter>
    <SidebarItem href="#">
      <SidebarItemIcon><IconPerson /></SidebarItemIcon>
      <SidebarItemLabel>Ada Lovelace</SidebarItemLabel>
    </SidebarItem>
  </SidebarFooter>
`;

const meta: StoryMeta = {
  argTypes: {
    collapsible: {
      control: { type: "select" },
      options: ["icon", "offcanvas", "none"],
    },
    side: {
      control: { type: "select" },
      options: ["left", "right"],
    },
    variant: {
      control: { type: "select" },
      options: ["sidebar", "floating", "inset"],
    },
  },
  component: SidebarRoot,
  // A sidebar fills whatever contains it, so without a sized box the panel has no height to run
  // down. The box clips, because the panel's own edge runs straight past a rounded corner.
  decorators: [
    () => ({
      template:
        '<div class="h-[32rem] w-[52rem] max-w-full overflow-hidden rounded-lg border border-separator/50"><story /></div>',
    }),
  ],
  parameters: {
    layout: "centered",
  },
  title: "Components/Navigation/Sidebar",
};

export default meta;

type Story = StoryObj<typeof meta>;

/* The shared box paints nothing, and a card standing on nothing reads as the whole box — the lift
 * these variants exist to show is only visible against a page. It also gives the forced-colors
 * sweep something to measure the card's outline against. */
const onPage = () => ({
  template: '<div class="size-full bg-background"><story /></div>',
});

export const Default: Story = {
  args: { collapsible: "icon", side: "left", variant: "sidebar" },
  render: (args) => ({
    components,
    setup: () => ({ args, nav, page }),
    template: `
      <Sidebar :collapsible="args.collapsible" :side="args.side" :variant="args.variant">
        <SidebarPanel>${nav}</SidebarPanel>
        <SidebarRail />
        ${page}
      </Sidebar>
    `,
  }),
};

/** Collapsed, the panel keeps its icons and drops every label to `sr-only`. */
export const IconRail: Story = {
  render: () => ({
    components,
    template: `
      <Sidebar collapsible="icon" :default-expanded="false">
        <SidebarPanel>${nav}</SidebarPanel>
        <SidebarRail />
        ${page}
      </Sidebar>
    `,
  }),
};

/** Collapsed, the panel goes entirely: zero width, and `inert` so nothing inside it is reachable. */
export const OffCanvas: Story = {
  render: () => ({
    components,
    template: `
      <Sidebar collapsible="offcanvas" :default-expanded="false">
        <SidebarPanel>${nav}</SidebarPanel>
        <SidebarRail />
        ${page}
      </Sidebar>
    `,
  }),
};

/** The shell reverses its row, so the same markup puts the nav on the trailing edge. */
export const RightSide: Story = {
  render: () => ({
    components,
    template: `
      <Sidebar side="right">
        <SidebarPanel>${nav}</SidebarPanel>
        <SidebarRail />
        ${page}
      </Sidebar>
    `,
  }),
};

/**
 * The panel as a card of its own, standing off the page on every side. The rail sits in the gap it
 * leaves, and the line it would otherwise draw goes quiet — the gap is already the division.
 */
export const Floating: Story = {
  decorators: [onPage],
  render: () => ({
    components,
    template: `
      <Sidebar variant="floating">
        <SidebarPanel>${nav}</SidebarPanel>
        <SidebarRail is-resizable />
        ${page}
      </Sidebar>
    `,
  }),
};

/**
 * The other way round: the panel is bared and the page beside it is the card. The shape an app
 * shell takes when the window behind both is the surface — a translucent one especially, where a
 * panel painting its own fill would stack a second tint over the first.
 */
export const Inset: Story = {
  decorators: [onPage],
  render: () => ({
    components,
    template: `
      <Sidebar variant="inset">
        <SidebarPanel>${nav}</SidebarPanel>
        <SidebarRail is-resizable />
        ${page}
      </Sidebar>
    `,
  }),
};

/**
 * Drag the rail to resize, double-click it to put the width back. Arrow keys move the edge once
 * the rail has focus, Shift for a larger step, Home and End for either extreme.
 */
export const Resizable: Story = {
  render: () => ({
    components,
    template: `
      <Sidebar default-width="18rem">
        <SidebarPanel>${nav}</SidebarPanel>
        <SidebarRail is-resizable :min-width="200" :max-width="400" />
        ${page}
      </Sidebar>
    `,
  }),
};

/** The width and the collapse survive a reload, stored under `ropav:sidebar:storybook`. */
export const Persisted: Story = {
  render: () => ({
    components,
    template: `
      <Sidebar auto-save-id="storybook" default-width="18rem">
        <SidebarPanel>${nav}</SidebarPanel>
        <SidebarRail is-resizable />
        ${page}
      </Sidebar>
    `,
  }),
};

/**
 * Below the breakpoint the panel is handed to a Drawer — backdrop, focus scope, dismiss and
 * swipe-to-close included. The breakpoint here is the story's own box rather than the viewport,
 * so it shows at any window size.
 */
export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
  render: () => ({
    components,
    template: `
      <Sidebar breakpoint="(min-width: 0px)">
        <SidebarPanel>${nav}</SidebarPanel>
        ${page}
      </Sidebar>
    `,
  }),
};

/**
 * A collapsed item keeps its name for a screen reader but shows only an icon, so a pointer user
 * has nothing to read. `SidebarItemTooltip` fills that in, and only there: it sits on the side
 * away from the panel, and it goes quiet the moment the label is back on screen — expand this from
 * the trigger and hovering an item says nothing, because the word is already next to the pointer.
 */
export const WithTooltips: Story = {
  render: () => ({
    components,
    template: `
      <Sidebar collapsible="icon" :default-expanded="false">
        <SidebarPanel>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarItemTooltip label="Home">
                <SidebarItem href="#" aria-current="page">
                  <SidebarItemIcon><IconHouse /></SidebarItemIcon>
                  <SidebarItemLabel>Home</SidebarItemLabel>
                </SidebarItem>
              </SidebarItemTooltip>
              <SidebarItemTooltip label="Inbox">
                <SidebarItem href="#">
                  <SidebarItemIcon><IconEnvelope /></SidebarItemIcon>
                  <SidebarItemLabel>Inbox</SidebarItemLabel>
                </SidebarItem>
              </SidebarItemTooltip>
              <SidebarItemTooltip label="Search">
                <SidebarItem href="#">
                  <SidebarItemIcon><IconMagnifier /></SidebarItemIcon>
                  <SidebarItemLabel>Search</SidebarItemLabel>
                </SidebarItem>
              </SidebarItemTooltip>
            </SidebarGroup>
          </SidebarContent>
        </SidebarPanel>
        <SidebarRail />
        ${page}
      </Sidebar>
    `,
  }),
};

/**
 * A nav item that opens rows of its own. The parent is an ordinary-looking row with a chevron; the
 * children indent under a line down the gutter they share, and the fold animates rather than jumps.
 *
 * On the icon rail the children are not rendered at all — a child row carries no icon, so at 56px
 * it would be a nameless blank. Pressing a parent there opens the sidebar and its rows together,
 * because that is what the press was asking for.
 */
export const NestedItems: Story = {
  render: () => ({
    components,
    template: `
      <Sidebar collapsible="icon">
        <SidebarPanel>
          <SidebarHeader v-slot="{ isCollapsed }">
            <span class="flex h-8 items-center gap-2 px-1.5 text-sm font-semibold">
              <span class="flex size-5 shrink-0 items-center justify-center rounded-sm bg-accent text-xs text-accent-foreground">R</span>
              <span v-if="!isCollapsed" class="truncate">Ropav</span>
            </span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Library</SidebarGroupLabel>
              <SidebarItem href="#" aria-current="page">
                <SidebarItemIcon><IconBookOpen /></SidebarItemIcon>
                <SidebarItemLabel>Guides</SidebarItemLabel>
              </SidebarItem>
              <SidebarCollapsible default-expanded>
                <SidebarCollapsibleTrigger>
                  <SidebarItemIcon><IconCubes /></SidebarItemIcon>
                  <SidebarItemLabel>Components</SidebarItemLabel>
                  <SidebarItemIndicator />
                </SidebarCollapsibleTrigger>
                <SidebarSubMenu>
                  <SidebarItem href="#">Buttons</SidebarItem>
                  <SidebarItem href="#">Inputs</SidebarItem>
                  <SidebarItem href="#">Overlays</SidebarItem>
                </SidebarSubMenu>
              </SidebarCollapsible>
              <SidebarCollapsible>
                <SidebarCollapsibleTrigger>
                  <SidebarItemIcon><IconPalette /></SidebarItemIcon>
                  <SidebarItemLabel>Tokens</SidebarItemLabel>
                  <SidebarItemIndicator />
                </SidebarCollapsibleTrigger>
                <SidebarSubMenu>
                  <SidebarItem href="#">Colour</SidebarItem>
                  <SidebarItem href="#">Spacing</SidebarItem>
                  <SidebarItem href="#">Type</SidebarItem>
                </SidebarSubMenu>
              </SidebarCollapsible>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarItem href="#">
                <SidebarItemIcon><IconFlask /></SidebarItemIcon>
                <SidebarItemLabel>Playground</SidebarItemLabel>
              </SidebarItem>
              <SidebarItem href="#">
                <SidebarItemIcon><IconPersons /></SidebarItemIcon>
                <SidebarItemLabel>Team</SidebarItemLabel>
                <SidebarItemTrailing><span class="text-xs text-muted">3</span></SidebarItemTrailing>
              </SidebarItem>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarItem href="#">
              <SidebarItemIcon><IconPerson /></SidebarItemIcon>
              <SidebarItemLabel>Ada Lovelace</SidebarItemLabel>
            </SidebarItem>
          </SidebarFooter>
        </SidebarPanel>
        <SidebarRail />
        ${page}
      </Sidebar>
    `,
  }),
};
