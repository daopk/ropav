import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import IconImage from '~icons/lucide/image';
import IconMessageCircle from '~icons/lucide/message-circle';
import IconSettings from '~icons/lucide/settings';
import { ref } from 'vue';
import { componentColors, getComponentColorRoles } from '../../utils/componentColors';
import Card from '../card/card.vue';
import Tabs from './tabs.vue';
import TabsContent from './tabs-content.vue';
import TabsList from './tabs-list.vue';
import TabsTrigger from './tabs-trigger.vue';

const wrapperStyle = {
    boxSizing: 'border-box',
    display: 'grid',
    gap: '16px',
    width: 'min(720px, 100%)',
    padding: '24px',
};

const panelStyle = {
    display: 'grid',
    gap: '8px',
    padding: '8px 0 0',
};

const cardDemoStyle = {
    display: 'grid',
    width: 'min(460px, 100%)',
};

const cardTabsPanelStyle = {
    display: 'grid',
    gap: '12px',
    padding: '4px 16px 16px',
};

const cardTabsSummaryStyle = {
    margin: 0,
    color: 'var(--rp-color-dimmed)',
};

const cardTabsMetricStyle = {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '12px 0',
    borderTop: 'var(--rp-border-width-thin) solid var(--rp-color-default-border)',
};

const outlineConnectedTabsStyle = {
    gap: '0',
    width: 'min(520px, 100%)',
};

const outlineBorderedContentStyle = {
    display: 'grid',
    gap: '8px',
    minHeight: '120px',
    padding: '16px',
    color: 'var(--rp-color-text)',
    backgroundColor: 'var(--rp-color-body)',
    borderRight: 'var(--rp-border-width-thin) solid var(--rp-color-default-border)',
    borderBottom: 'var(--rp-border-width-thin) solid var(--rp-color-default-border)',
    borderLeft: 'var(--rp-border-width-thin) solid var(--rp-color-default-border)',
    borderRadius: '0 0 var(--rp-radius-md) var(--rp-radius-md)',
};

const outlineContentDescriptionStyle = {
    color: 'var(--rp-color-dimmed)',
};

const colorStoryStyle = {
    ...wrapperStyle,
    width: 'min(860px, 100%)',
};

type TabColor = (typeof componentColors)[number];

function getTabColorStyle(color: TabColor) {
    const roles = getComponentColorRoles(color)!;

    return {
        '--rp-primary-color-filled': roles.filled,
        '--rp-primary-color-filled-hover': roles.hover,
    };
}

const tabs = [
    {
        value: 'gallery',
        label: 'Gallery',
        body: 'Gallery tab content',
    },
    {
        value: 'messages',
        label: 'Messages',
        body: 'Messages tab content',
    },
    {
        value: 'settings',
        label: 'Settings',
        body: 'Settings tab content',
    },
] as const;

const overflowTabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'activity', label: 'Recent activity' },
    { value: 'analytics', label: 'Analytics dashboard' },
    { value: 'automations', label: 'Automations' },
    { value: 'integrations', label: 'Integrations' },
    { value: 'permissions', label: 'Permissions' },
    { value: 'notifications', label: 'Notifications' },
    { value: 'settings', label: 'Workspace settings' },
] as const;

const variants = ['line', 'pills', 'outline'] as const;

const meta = {
    title: 'Components/Tabs',
    component: Tabs as any,
    tags: ['autodocs'],
    argTypes: {
        modelValue: { control: false },
        defaultValue: { control: 'text' },
        size: {
            control: 'select',
            options: ['xs', 'sm', 'md', 'lg', 'xl'],
        },
        variant: {
            control: 'select',
            options: variants,
        },
        orientation: {
            control: 'select',
            options: ['horizontal', 'vertical'],
        },
        placement: {
            control: 'select',
            options: ['left', 'right'],
        },
        align: {
            control: 'select',
            options: ['left', 'center', 'right'],
        },
        activationMode: {
            control: 'select',
            options: ['automatic', 'manual'],
        },
        disabled: { control: 'boolean' },
        unmountOnExit: { control: 'boolean' },
    },
    args: {
        modelValue: undefined,
        defaultValue: 'gallery',
        size: 'md',
        variant: 'line',
        orientation: 'horizontal',
        placement: 'left',
        align: undefined,
        activationMode: 'automatic',
        disabled: false,
        unmountOnExit: false,
        ariaLabel: 'Project sections',
    },
    render: (args) => ({
        components: { Tabs, TabsContent, TabsList, TabsTrigger },
        setup() {
            return { args, panelStyle, tabs, wrapperStyle };
        },
        template: `
            <div :style="wrapperStyle">
                <Tabs v-bind="args">
                    <TabsList>
                        <TabsTrigger
                            v-for="tab in tabs"
                            :key="tab.value"
                            :value="tab.value"
                        >
                            {{ tab.label }}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent
                        v-for="tab in tabs"
                        :key="tab.value"
                        :value="tab.value"
                    >
                        <div :style="panelStyle">{{ tab.body }}</div>
                    </TabsContent>
                </Tabs>
            </div>
        `,
    }),
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InCard: Story = {
    render: () => ({
        components: { Card, Tabs, TabsContent, TabsList, TabsTrigger },
        setup() {
            return {
                cardDemoStyle,
                cardTabsMetricStyle,
                cardTabsPanelStyle,
                cardTabsSummaryStyle,
                wrapperStyle,
            };
        },
        template: `
            <div :style="wrapperStyle">
                <Card
                    layer="raised"
                    padding="none"
                    :style="cardDemoStyle"
                >
                    <Tabs default-value="overview" variant="line" aria-label="Workspace sections">
                        <TabsList>
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="activity">Activity</TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview">
                            <div :style="cardTabsPanelStyle">
                                <p :style="cardTabsSummaryStyle">The workspace is ready for the next release cycle.</p>
                                <div :style="cardTabsMetricStyle">
                                    <span>Completion</span>
                                    <strong>92%</strong>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="activity">
                            <div :style="cardTabsPanelStyle">
                                <p :style="cardTabsSummaryStyle">New reviews, deploy checks, and triage updates are waiting.</p>
                                <div :style="cardTabsMetricStyle">
                                    <span>Open items</span>
                                    <strong>8</strong>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="settings">
                            <div :style="cardTabsPanelStyle">
                                <p :style="cardTabsSummaryStyle">Notification and access settings are synced.</p>
                                <div :style="cardTabsMetricStyle">
                                    <span>Members</span>
                                    <strong>14</strong>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        `,
    }),
};

export const OutlineWithBorderedContent: Story = {
    render: () => ({
        components: { Tabs, TabsContent, TabsList, TabsTrigger },
        setup() {
            return {
                outlineBorderedContentStyle,
                outlineConnectedTabsStyle,
                outlineContentDescriptionStyle,
                tabs,
                wrapperStyle,
            };
        },
        template: `
            <div :style="wrapperStyle">
                <Tabs
                    default-value="gallery"
                    variant="outline"
                    :style="outlineConnectedTabsStyle"
                    aria-label="Bordered outline sections"
                >
                    <TabsList>
                        <TabsTrigger
                            v-for="tab in tabs"
                            :key="tab.value"
                            :value="tab.value"
                        >
                            {{ tab.label }}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent
                        v-for="tab in tabs"
                        :key="tab.value"
                        :value="tab.value"
                    >
                        <div :style="outlineBorderedContentStyle">
                            <strong>{{ tab.label }}</strong>
                            <span :style="outlineContentDescriptionStyle">{{ tab.body }}</span>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        `,
    }),
};

export const ManualActivation: Story = {
    args: {
        activationMode: 'manual',
    },
};

export const Overflow: Story = {
    tags: ['test'],
    render: () => ({
        components: { Tabs, TabsContent, TabsList, TabsTrigger },
        setup() {
            return { overflowTabs, panelStyle };
        },
        template: `
            <div style="box-sizing: border-box; width: 320px; padding: 24px;">
                <Tabs default-value="overview" variant="line" aria-label="Overflowing sections">
                    <TabsList data-testid="overflow-list">
                        <TabsTrigger
                            v-for="tab in overflowTabs"
                            :key="tab.value"
                            :value="tab.value"
                        >
                            {{ tab.label }}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent
                        v-for="tab in overflowTabs"
                        :key="tab.value"
                        :value="tab.value"
                    >
                        <div :style="panelStyle">{{ tab.label }} content</div>
                    </TabsContent>
                </Tabs>
            </div>
        `,
    }),
    play: async ({ canvasElement }) => {
        const list = canvasElement.querySelector<HTMLElement>('[data-testid="overflow-list"]')!;
        const viewport = list.querySelector<HTMLElement>('.rp-scroll-area__viewport')!;
        const content = list.querySelector<HTMLElement>('.rp-scroll-area__content')!;
        const scrollbar = list.querySelector<HTMLElement>(
            '.rp-scroll-area__scrollbar--horizontal',
        )!;
        const triggers = [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]')];

        expect(content).toHaveAttribute('role', 'tablist');
        expect(list).toHaveAttribute('data-scrollbars', 'x');
        expect(viewport.tabIndex).toBe(-1);
        expect(scrollbar).toHaveAttribute('aria-hidden', 'true');
        await waitFor(() => expect(list).toHaveAttribute('data-overflow-x'));
        expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);

        await userEvent.click(triggers[0]!);
        await userEvent.keyboard('{End}');

        await waitFor(() => expect(triggers.at(-1)).toHaveFocus());
        await waitFor(() => expect(viewport.scrollLeft).toBeGreaterThan(0));

        const activeTrigger = triggers.at(-1)!;
        const contentRect = content.getBoundingClientRect();
        const activeTriggerRect = activeTrigger.getBoundingClientRect();
        const contentBorderWidth = Number.parseFloat(getComputedStyle(content).borderBottomWidth);

        expect(activeTrigger).toHaveAttribute('data-state', 'active');
        expect(contentBorderWidth).toBeGreaterThan(0);
        expect(contentRect.bottom - activeTriggerRect.bottom).toBe(contentBorderWidth);
    },
};

export const Vertical: Story = {
    args: {
        orientation: 'vertical',
    },
};

export const VerticalRight: Story = {
    args: {
        orientation: 'vertical',
        placement: 'right',
    },
};

export const TriggerAlign: Story = {
    args: {
        orientation: 'vertical',
        align: 'right',
    },
    render: (args) => ({
        components: { Tabs, TabsContent, TabsList, TabsTrigger },
        setup() {
            return { args, panelStyle, tabs, wrapperStyle };
        },
        template: `
            <div :style="wrapperStyle">
                <Tabs v-bind="args">
                    <TabsList>
                        <TabsTrigger value="gallery">Gallery</TabsTrigger>
                        <TabsTrigger value="messages" align="center">Messages</TabsTrigger>
                        <TabsTrigger value="settings" align="left">Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent
                        v-for="tab in tabs"
                        :key="tab.value"
                        :value="tab.value"
                    >
                        <div :style="panelStyle">{{ tab.body }}</div>
                    </TabsContent>
                </Tabs>
            </div>
        `,
    }),
};

export const WithDisabledTrigger: Story = {
    render: (args) => ({
        components: { Tabs, TabsContent, TabsList, TabsTrigger },
        setup() {
            return { args, panelStyle, tabs, wrapperStyle };
        },
        template: `
            <div :style="wrapperStyle">
                <Tabs v-bind="args">
                    <TabsList>
                        <TabsTrigger value="gallery">Gallery</TabsTrigger>
                        <TabsTrigger value="messages">Messages</TabsTrigger>
                        <TabsTrigger value="settings" disabled>Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="gallery">
                        <div :style="panelStyle">{{ tabs[0].body }}</div>
                    </TabsContent>
                    <TabsContent value="messages">
                        <div :style="panelStyle">{{ tabs[1].body }}</div>
                    </TabsContent>
                    <TabsContent value="settings">
                        <div :style="panelStyle">{{ tabs[2].body }}</div>
                    </TabsContent>
                </Tabs>
            </div>
        `,
    }),
};

export const Colors: Story = {
    tags: ['test'],
    render: () => ({
        components: { Tabs, TabsContent, TabsList, TabsTrigger },
        setup() {
            return {
                colorStoryStyle,
                getTabColorStyle,
                panelStyle,
                tabColors: componentColors,
                tabs,
            };
        },
        template: `
            <div :style="colorStoryStyle">
                <div
                    v-for="color in tabColors"
                    :key="color"
                    :data-tab-color="color"
                    :style="getTabColorStyle(color)"
                >
                    <Tabs default-value="gallery" size="sm" :aria-label="color + ' tabs'">
                        <TabsList>
                            <TabsTrigger
                                v-for="tab in tabs"
                                :key="tab.value"
                                :value="tab.value"
                            >
                                {{ tab.label }}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="gallery">
                            <div :style="panelStyle">{{ color }} gallery tab content</div>
                        </TabsContent>
                        <TabsContent value="messages">
                            <div :style="panelStyle">{{ color }} messages tab content</div>
                        </TabsContent>
                        <TabsContent value="settings">
                            <div :style="panelStyle">{{ color }} settings tab content</div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        `,
    }),
    play: async ({ canvasElement }) => {
        for (const color of componentColors) {
            const colorRow = canvasElement.querySelector<HTMLElement>(
                `[data-tab-color="${color}"]`,
            )!;
            const activeTrigger = colorRow.querySelector<HTMLElement>(
                '[role="tab"][data-state="active"]',
            )!;
            const colorProbe = document.createElement('span');

            colorProbe.style.backgroundColor = `var(--rp-color-${color}-filled)`;
            colorRow.append(colorProbe);

            const expectedColor = getComputedStyle(colorProbe).backgroundColor;
            const indicatorColor = getComputedStyle(activeTrigger, '::after').backgroundColor;

            colorProbe.remove();
            expect(indicatorColor).toBe(expectedColor);
        }
    },
};

export const Icons: Story = {
    render: (args) => ({
        components: {
            IconImage,
            IconMessageCircle,
            IconSettings,
            Tabs,
            TabsContent,
            TabsList,
            TabsTrigger,
        },
        setup() {
            return { args, panelStyle, tabs, wrapperStyle };
        },
        template: `
            <div :style="wrapperStyle">
                <Tabs v-bind="args">
                    <TabsList>
                        <TabsTrigger value="gallery">
                            <IconImage aria-hidden="true" />
                            Gallery
                        </TabsTrigger>
                        <TabsTrigger value="messages">
                            <IconMessageCircle aria-hidden="true" />
                            Messages
                        </TabsTrigger>
                        <TabsTrigger value="settings">
                            <IconSettings aria-hidden="true" />
                            Settings
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent
                        v-for="tab in tabs"
                        :key="tab.value"
                        :value="tab.value"
                    >
                        <div :style="panelStyle">{{ tab.body }}</div>
                    </TabsContent>
                </Tabs>
            </div>
        `,
    }),
};

export const Sizes: Story = {
    render: () => ({
        components: { Tabs, TabsContent, TabsList, TabsTrigger },
        setup() {
            const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
            const value = ref('overview');
            return { panelStyle, sizes, value, wrapperStyle };
        },
        template: `
            <div :style="wrapperStyle">
                <Tabs
                    v-for="size in sizes"
                    :key="size"
                    v-model="value"
                    :size="size"
                    :aria-label="'Tabs size ' + size"
                >
                    <TabsList>
                        <TabsTrigger value="overview">{{ size.toUpperCase() }}</TabsTrigger>
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <div :style="panelStyle">{{ size.toUpperCase() }} tab content</div>
                    </TabsContent>
                    <TabsContent value="activity">
                        <div :style="panelStyle">Activity tab content</div>
                    </TabsContent>
                </Tabs>
            </div>
        `,
    }),
};

export const Variants: Story = {
    render: () => ({
        components: { Tabs, TabsContent, TabsList, TabsTrigger },
        setup() {
            return { panelStyle, tabs, variants, wrapperStyle };
        },
        template: `
            <div :style="wrapperStyle">
                <Tabs
                    v-for="variant in variants"
                    :key="variant"
                    :variant="variant"
                    default-value="gallery"
                    :aria-label="'Tabs variant ' + variant"
                >
                    <TabsList>
                        <TabsTrigger
                            v-for="tab in tabs"
                            :key="tab.value"
                            :value="tab.value"
                        >
                            {{ tab.label }}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent
                        v-for="tab in tabs"
                        :key="tab.value"
                        :value="tab.value"
                    >
                        <div :style="panelStyle">{{ variant }} {{ tab.body }}</div>
                    </TabsContent>
                </Tabs>
            </div>
        `,
    }),
};

export const Controlled: Story = {
    render: () => ({
        components: { Tabs, TabsContent, TabsList, TabsTrigger },
        setup() {
            const value = ref('gallery');
            return { panelStyle, tabs, value, wrapperStyle };
        },
        template: `
            <div :style="wrapperStyle">
                <Tabs v-model="value" aria-label="Controlled sections">
                    <TabsList>
                        <TabsTrigger
                            v-for="tab in tabs"
                            :key="tab.value"
                            :value="tab.value"
                        >
                            {{ tab.label }}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent
                        v-for="tab in tabs"
                        :key="tab.value"
                        :value="tab.value"
                    >
                        <div :style="panelStyle">{{ tab.body }}</div>
                    </TabsContent>
                </Tabs>
            </div>
        `,
    }),
};
