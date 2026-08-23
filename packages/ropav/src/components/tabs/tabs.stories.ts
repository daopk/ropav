import type { StoryMeta } from "../../utils/story-meta";
import type { StoryObj } from "@storybook/vue3";

import { shallowRef } from "vue";

import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsListContainer,
  TabsPanel,
  TabsSeparator,
  TabsTab,
} from "./index";

/**
 * Story templates are compiled at runtime, where Vue resolves a tag like `Tabs.Tab` as a
 * component literally named "Tabs.Tab" and fails. Dot notation only works in an SFC, whose
 * compiler resolves it against the setup scope. So the parts are registered individually here —
 * in application code `<Tabs.Tab>` inside an SFC is fine.
 */
const components = {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsListContainer,
  TabsPanel,
  TabsSeparator,
  TabsTab,
};

const meta: StoryMeta = {
  argTypes: {
    isDisabled: { control: { type: "boolean" } },
    keyboardActivation: { control: { type: "radio" }, options: ["automatic", "manual"] },
    orientation: { control: { type: "radio" }, options: ["horizontal", "vertical"] },
    variant: { control: { type: "radio" }, options: ["primary", "secondary"] },
  },
  args: {
    isDisabled: false,
  },
  component: Tabs,
  parameters: {
    layout: "centered",
  },
  title: "Components/Navigation/Tabs",
};

export default meta;

type Story = StoryObj<typeof meta>;

const setupArgs = (args: Record<string, unknown>) => () => ({ args });

const OVERVIEW_ITEMS = [
  { body: "View your project overview and recent activity.", id: "overview", label: "Overview" },
  { body: "Track your metrics and analyze performance data.", id: "analytics", label: "Analytics" },
  { body: "Generate and download detailed reports.", id: "reports", label: "Reports" },
];

const overviewTemplate = (extraRootProps = "") => `
  <div class="w-[600px]">
    <Tabs
      :is-disabled="args.isDisabled"
      :keyboard-activation="args.keyboardActivation"
      :orientation="args.orientation"
      :variant="args.variant"${extraRootProps}
    >
      <TabsListContainer>
        <TabsList aria-label="Options">
          <TabsTab v-for="item in items" :id="item.id" :key="item.id">
            {{ item.label }}
            <TabsIndicator />
          </TabsTab>
        </TabsList>
      </TabsListContainer>
      <TabsPanel v-for="item in items" :id="item.id" :key="item.id" class="pt-4">
        <p>{{ item.body }}</p>
      </TabsPanel>
    </Tabs>
  </div>
`;

export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args, items: OVERVIEW_ITEMS }),
    template: overviewTemplate(),
  }),
};

const OVERFLOW_ITEMS = [
  "Overview",
  "Analytics",
  "Reports",
  "Performance",
  "Engagement",
  "Audience",
  "Acquisition",
  "Retention",
  "Settings",
].map((label) => ({ id: label.toLowerCase(), label }));

export const Overflow: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args, items: OVERFLOW_ITEMS }),
    template: `
      <div class="w-[400px]">
        <Tabs
          :is-disabled="args.isDisabled"
          :keyboard-activation="args.keyboardActivation"
          :orientation="args.orientation"
          :variant="args.variant"
        >
          <TabsListContainer>
            <TabsList aria-label="Overflow options">
              <TabsTab v-for="item in items" :id="item.id" :key="item.id">
                {{ item.label }}
                <TabsIndicator />
              </TabsTab>
            </TabsList>
          </TabsListContainer>
          <TabsPanel v-for="item in items" :id="item.id" :key="item.id" class="pt-4">
            <p>{{ item.label }} panel content.</p>
          </TabsPanel>
        </Tabs>
      </div>
    `,
  }),
};

const SETTINGS_ITEMS = [
  {
    body: "Manage your account information and preferences.",
    heading: "Account Settings",
    id: "account",
    label: "Account",
  },
  {
    body: "Configure two-factor authentication and password settings.",
    heading: "Security Settings",
    id: "security",
    label: "Security",
  },
  {
    body: "Choose how and when you want to receive notifications.",
    heading: "Notification Preferences",
    id: "notifications",
    label: "Notifications",
  },
  {
    body: "View and manage your subscription and payment methods.",
    heading: "Billing Information",
    id: "billing",
    label: "Billing",
  },
];

const settingsTemplate = `
  <div class="w-[600px]">
    <Tabs
      :is-disabled="args.isDisabled"
      :keyboard-activation="args.keyboardActivation"
      orientation="vertical"
      :variant="args.variant"
    >
      <TabsListContainer>
        <TabsList aria-label="Vertical tabs">
          <TabsTab v-for="item in items" :id="item.id" :key="item.id">
            {{ item.label }}
            <TabsIndicator />
          </TabsTab>
        </TabsList>
      </TabsListContainer>
      <TabsPanel v-for="item in items" :id="item.id" :key="item.id" class="px-4">
        <h3 class="mb-2 font-semibold">{{ item.heading }}</h3>
        <p class="text-sm text-gray-600">{{ item.body }}</p>
      </TabsPanel>
    </Tabs>
  </div>
`;

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => ({
    components,
    setup: () => ({ args, items: SETTINGS_ITEMS }),
    template: settingsTemplate,
  }),
};

const STATE_ITEMS = [
  { body: "This tab is active and can be selected.", id: "active", label: "Active" },
  { body: "This content cannot be accessed.", id: "disabled", label: "Disabled" },
  { body: "This tab is also available for selection.", id: "available", label: "Available" },
];

export const WithDisabledTab: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args, items: STATE_ITEMS }),
    template: `
      <div class="w-[600px]">
        <Tabs
          :is-disabled="args.isDisabled"
          :keyboard-activation="args.keyboardActivation"
          :orientation="args.orientation"
          :variant="args.variant"
        >
          <TabsListContainer>
            <TabsList aria-label="Tabs with disabled">
              <TabsTab
                v-for="item in items"
                :id="item.id"
                :key="item.id"
                :is-disabled="item.id === 'disabled'"
              >
                {{ item.label }}
                <TabsIndicator />
              </TabsTab>
            </TabsList>
          </TabsListContainer>
          <TabsPanel v-for="item in items" :id="item.id" :key="item.id" class="pt-4">
            <p>{{ item.body }}</p>
          </TabsPanel>
        </Tabs>
      </div>
    `,
  }),
};

const DEFAULT_SELECTED_ITEMS = [
  { body: "This tab is active and can be selected.", id: "active", label: "Active" },
  { body: "This tab is the default selection.", id: "default", label: "Default" },
  { body: "This tab is available for selection as well.", id: "available", label: "Available" },
];

export const WithDefaultSelectedTab: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args, items: DEFAULT_SELECTED_ITEMS }),
    template: `
      <div class="w-[600px]">
        <Tabs
          default-selected-key="default"
          :is-disabled="args.isDisabled"
          :keyboard-activation="args.keyboardActivation"
          :orientation="args.orientation"
          :variant="args.variant"
        >
          <TabsListContainer>
            <TabsList aria-label="Tabs with default options">
              <TabsTab v-for="item in items" :id="item.id" :key="item.id">
                {{ item.label }}
                <TabsIndicator />
              </TabsTab>
            </TabsList>
          </TabsListContainer>
          <TabsPanel v-for="item in items" :id="item.id" :key="item.id" class="pt-4">
            <p>{{ item.body }}</p>
          </TabsPanel>
        </Tabs>
      </div>
    `,
  }),
};

const CONTROLLED_ITEMS = [
  { body: "This tab is active and can be selected.", id: "active", label: "Active" },
  { body: "This tab is the controlled selection.", id: "controlled", label: "Controlled" },
  { body: "This tab is available for selection as well.", id: "available", label: "Available" },
];

export const WithControlledSelectionTab: Story = {
  render: (args) => ({
    components,
    setup: () => ({
      args,
      items: CONTROLLED_ITEMS,
      selectedKey: shallowRef<string>("controlled"),
    }),
    template: `
      <div class="w-[600px]">
        <p class="my-2">Selected: {{ selectedKey }}</p>
        <Tabs
          :is-disabled="args.isDisabled"
          :keyboard-activation="args.keyboardActivation"
          :orientation="args.orientation"
          :selected-key="selectedKey"
          :variant="args.variant"
          @selection-change="selectedKey = $event"
        >
          <TabsListContainer>
            <TabsList aria-label="Tabs with controlled options">
              <TabsTab v-for="item in items" :id="item.id" :key="item.id">
                {{ item.label }}
                <TabsIndicator />
              </TabsTab>
            </TabsList>
          </TabsListContainer>
          <TabsPanel v-for="item in items" :id="item.id" :key="item.id" class="pt-4">
            <p>{{ item.body }}</p>
          </TabsPanel>
        </Tabs>
      </div>
    `,
  }),
};

const CADENCE_ITEMS = ["Daily", "Weekly", "Bi-Weekly", "Monthly"].map((label) => ({
  id: label.toLowerCase(),
  label,
}));

export const WithCustomStyle: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args, items: CADENCE_ITEMS }),
    template: `
      <div class="w-[380px]">
        <Tabs
          :is-disabled="args.isDisabled"
          :keyboard-activation="args.keyboardActivation"
          :orientation="args.orientation"
          :variant="args.variant"
        >
          <TabsListContainer>
            <TabsList
              aria-label="Options"
              class="w-fit *:h-6 *:w-fit *:px-3 *:text-sm *:font-normal *:data-[selected=true]:text-accent-foreground"
            >
              <TabsTab v-for="item in items" :id="item.id" :key="item.id">
                {{ item.label }}
                <TabsIndicator class="bg-accent" />
              </TabsTab>
            </TabsList>
          </TabsListContainer>
        </Tabs>
      </div>
    `,
  }),
};

export const WithSeparator: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args, items: OVERVIEW_ITEMS }),
    template: `
      <div class="w-[600px]">
        <Tabs
          :is-disabled="args.isDisabled"
          :keyboard-activation="args.keyboardActivation"
          :orientation="args.orientation"
          :variant="args.variant"
        >
          <TabsListContainer>
            <TabsList aria-label="Options">
              <TabsTab v-for="(item, index) in items" :id="item.id" :key="item.id">
                <TabsSeparator v-if="index > 0" />
                {{ item.label }}
                <TabsIndicator />
              </TabsTab>
            </TabsList>
          </TabsListContainer>
          <TabsPanel v-for="item in items" :id="item.id" :key="item.id" class="pt-4">
            <p>{{ item.body }}</p>
          </TabsPanel>
        </Tabs>
      </div>
    `,
  }),
};

export const Secondary: Story = {
  args: { variant: "secondary" },
  render: (args) => ({
    components,
    setup: setupArgs(args),
    template: `
      <div class="w-[600px]">
        <Tabs
          :is-disabled="args.isDisabled"
          :keyboard-activation="args.keyboardActivation"
          :orientation="args.orientation"
          variant="secondary"
        >
          <TabsListContainer>
            <TabsList aria-label="Options">
              <TabsTab id="overview">Overview<TabsIndicator /></TabsTab>
              <TabsTab id="analytics">Analytics<TabsIndicator /></TabsTab>
              <TabsTab id="reports">Reports<TabsIndicator /></TabsTab>
            </TabsList>
          </TabsListContainer>
          <TabsPanel id="overview" class="pt-4">
            <p>View your project overview and recent activity.</p>
          </TabsPanel>
          <TabsPanel id="analytics" class="pt-4">
            <p>Track your metrics and analyze performance data.</p>
          </TabsPanel>
          <TabsPanel id="reports" class="pt-4">
            <p>Generate and download detailed reports.</p>
          </TabsPanel>
        </Tabs>
      </div>
    `,
  }),
};

export const SecondaryVertical: Story = {
  args: { orientation: "vertical", variant: "secondary" },
  render: (args) => ({
    components,
    setup: () => ({ args, items: SETTINGS_ITEMS }),
    template: `
      <div class="w-[600px]">
        <Tabs
          :is-disabled="args.isDisabled"
          :keyboard-activation="args.keyboardActivation"
          orientation="vertical"
          variant="secondary"
        >
          <TabsListContainer>
            <TabsList aria-label="Vertical tabs">
              <TabsTab v-for="item in items" :id="item.id" :key="item.id">
                {{ item.label }}
                <TabsIndicator />
              </TabsTab>
            </TabsList>
          </TabsListContainer>
          <TabsPanel v-for="item in items" :id="item.id" :key="item.id" class="px-4">
            <h3 class="mb-2 font-semibold">{{ item.heading }}</h3>
            <p class="text-sm text-gray-600">{{ item.body }}</p>
          </TabsPanel>
        </Tabs>
      </div>
    `,
  }),
};

const ZOOM_LEVELS = [
  { factor: "8x", id: "200", label: "200 mm", slug: "200mm__c8kya18imsqe" },
  { factor: "4x", id: "100", label: "100 mm", slug: "100mm__cykxcenbhvue" },
  { factor: "2x", id: "48", label: "48 mm", slug: "48mm__bmrwps1q6w76" },
  { factor: "1.5x", id: "35", label: "35 mm", slug: "35mm__k375wbkrjp2e" },
  { factor: "1.2x", id: "28", label: "28 mm", slug: "28mm__fylmxo06jq6i" },
  { factor: "1x", id: "24", label: "24 mm", slug: "24mm__e54cxtdkdrwy" },
  { factor: "0.5x", id: "13", label: "13 mm", slug: "13mm__dzafu9h1kaye" },
  { factor: "0.2x", id: "macro", label: "macro", slug: "macro__bb7oud7ri2o2" },
].map((level) => ({
  ...level,
  src: `https://www.apple.com/v/iphone-17-pro/a/images/overview/cameras/zoom/${level.slug}_large_2x.jpg`,
}));

export const Showcase1: Story = {
  name: "Showcases/Apple iPhone 17 Pro cameras",
  parameters: { layout: "fullscreen" },
  render: (args) => ({
    components,
    setup: () => {
      const selectedZoom = shallowRef("200");

      return { args, levels: ZOOM_LEVELS, selectedZoom };
    },
    template: `
      <div class="w-full">
        <div class="flex flex-col items-center">
          <div class="relative aspect-[7/5] w-full max-w-[840px] sm:h-[400px] md:h-[500px] lg:h-[600px]">
            <img
              v-for="level in levels"
              :key="level.id"
              :aria-hidden="selectedZoom !== level.id"
              class="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity delay-200 duration-[800ms] ease-in-out data-[selected=true]:opacity-100 data-[selected=true]:delay-0"
              :data-selected="selectedZoom === level.id"
              :src="level.src"
            />
          </div>
          <Tabs
            default-selected-key="200"
            @selection-change="selectedZoom = $event"
          >
            <TabsListContainer class="scrollbar-hide my-4 w-full max-w-full overflow-x-auto bg-transparent sm:my-6">
              <TabsList
                aria-label="Options"
                class="w-fit min-w-min rounded-full bg-[#333336] *:h-8 *:w-fit *:px-3 *:text-xs *:font-normal *:text-white *:opacity-80 *:hover:opacity-100 *:data-[selected=true]:text-black sm:*:h-9 sm:*:px-4 sm:*:text-sm"
              >
                <TabsTab
                  v-for="level in levels"
                  :id="level.id"
                  :key="level.id"
                  :class="level.id === 'macro' ? 'capitalize' : ''"
                >
                  {{ level.label }}
                  <TabsIndicator class="rounded-full bg-white shadow-none duration-[320ms]" />
                </TabsTab>
              </TabsList>
            </TabsListContainer>
          </Tabs>
          <div class="relative h-10 w-10">
            <p
              v-for="level in levels"
              :key="level.id"
              :aria-hidden="selectedZoom !== level.id"
              class="absolute start-1/2 top-1/2 origin-center -translate-x-1/2 -translate-y-1/2 scale-75 text-[21px] font-medium text-foreground opacity-0 transition-[scale,opacity] duration-[300ms] ease-[cubic-bezier(0.33,1,0.68,1)] data-[selected=true]:scale-100 data-[selected=true]:opacity-100 data-[selected=true]:delay-200"
              :class="{'sr-only': selectedZoom !== level.id}"
              :data-selected="selectedZoom === level.id"
            >
              {{ level.factor }}
            </p>
          </div>
          <footer class="mt-4 w-full px-4 text-center text-xs text-muted/30 sm:text-sm">
            <a href="https://www.apple.com/iphone-17-pro/" rel="noopener noreferrer" target="_blank">
              Showcase based on Apple's iPhone 17 Pro camera zoom showcase
            </a>
          </footer>
        </div>
      </div>
    `,
  }),
};
