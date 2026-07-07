import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
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

export const ManualActivation: Story = {
    args: {
        activationMode: 'manual',
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
