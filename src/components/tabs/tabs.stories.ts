import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Tabs from './tabs.vue';
import TabPanel from './tab-panel.vue';
import { ref } from 'vue';

const meta = {
    title: 'Components/Tabs',
    component: Tabs as any,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['line', 'enclosed'],
        },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
    },
    args: {
        variant: 'line',
        size: 'md',
    },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => ({
        components: { Tabs, TabPanel },
        setup() {
            const active = ref('tab1');
            return { args, active };
        },
        template: `
            <Tabs v-bind="args" v-model="active">
                <TabPanel name="tab1" label="Account">
                    <p>Manage your account settings and preferences.</p>
                </TabPanel>
                <TabPanel name="tab2" label="Security">
                    <p>Update your password and security settings.</p>
                </TabPanel>
                <TabPanel name="tab3" label="Notifications">
                    <p>Configure how you receive notifications.</p>
                </TabPanel>
            </Tabs>
        `,
    }),
};

export const Enclosed: Story = {
    args: { variant: 'enclosed' },
    render: (args) => ({
        components: { Tabs, TabPanel },
        setup() {
            const active = ref('overview');
            return { args, active };
        },
        template: `
            <Tabs v-bind="args" v-model="active">
                <TabPanel name="overview" label="Overview">
                    <p>Project overview and summary.</p>
                </TabPanel>
                <TabPanel name="analytics" label="Analytics">
                    <p>View your analytics dashboard.</p>
                </TabPanel>
                <TabPanel name="settings" label="Settings">
                    <p>Project settings and configuration.</p>
                </TabPanel>
            </Tabs>
        `,
    }),
};

export const WithDisabledTab: Story = {
    render: (args) => ({
        components: { Tabs, TabPanel },
        setup() {
            const active = ref('tab1');
            return { args, active };
        },
        template: `
            <Tabs v-bind="args" v-model="active">
                <TabPanel name="tab1" label="Active">
                    <p>This tab is active.</p>
                </TabPanel>
                <TabPanel name="tab2" label="Disabled" :disabled="true">
                    <p>This tab is disabled.</p>
                </TabPanel>
                <TabPanel name="tab3" label="Another">
                    <p>Another active tab.</p>
                </TabPanel>
            </Tabs>
        `,
    }),
};

export const Sizes: Story = {
    render: () => ({
        components: { Tabs, TabPanel },
        setup() {
            const s1 = ref('a');
            const s2 = ref('a');
            const s3 = ref('a');
            return { s1, s2, s3 };
        },
        template: `
            <div style="display: flex; flex-direction: column; gap: 32px;">
                <Tabs size="sm" v-model="s1">
                    <TabPanel name="a" label="Small A"><p>Small tab A</p></TabPanel>
                    <TabPanel name="b" label="Small B"><p>Small tab B</p></TabPanel>
                </Tabs>
                <Tabs size="md" v-model="s2">
                    <TabPanel name="a" label="Medium A"><p>Medium tab A</p></TabPanel>
                    <TabPanel name="b" label="Medium B"><p>Medium tab B</p></TabPanel>
                </Tabs>
                <Tabs size="lg" v-model="s3">
                    <TabPanel name="a" label="Large A"><p>Large tab A</p></TabPanel>
                    <TabPanel name="b" label="Large B"><p>Large tab B</p></TabPanel>
                </Tabs>
            </div>
        `,
    }),
};
