import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ref } from 'vue';
import Tabs from './tabs.vue';
import TabsList from './tabs-list.vue';
import TabsTrigger from './tabs-trigger.vue';
import TabPanel from './tab-panel.vue';

const meta = {
    title: 'Components/Tabs',
    component: Tabs as any,
    tags: ['autodocs'],
    args: {
        modelValue: 'account',
    },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => ({
        components: { Tabs, TabsList, TabsTrigger, TabPanel },
        setup() {
            const active = ref('account');
            return { args, active };
        },
        template: `
            <Tabs v-bind="args" v-model="active">
                <TabsList>
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>
                <TabPanel value="account"><p>Manage your account settings.</p></TabPanel>
                <TabPanel value="security"><p>Update your password.</p></TabPanel>
                <TabPanel value="notifications"><p>Configure notifications.</p></TabPanel>
            </Tabs>
        `,
    }),
};

export const WithDisabledTab: Story = {
    render: (args) => ({
        components: { Tabs, TabsList, TabsTrigger, TabPanel },
        setup() {
            const active = ref('active');
            return { args, active };
        },
        template: `
            <Tabs v-bind="args" v-model="active">
                <TabsList>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="disabled" disabled>Disabled</TabsTrigger>
                    <TabsTrigger value="another">Another</TabsTrigger>
                </TabsList>
                <TabPanel value="active"><p>This tab is active.</p></TabPanel>
                <TabPanel value="disabled"><p>This tab is disabled.</p></TabPanel>
                <TabPanel value="another"><p>Another active tab.</p></TabPanel>
            </Tabs>
        `,
    }),
};

export const KeyboardNavigation: Story = {
    tags: ['test'],
    render: (args) => ({
        components: { Tabs, TabsList, TabsTrigger, TabPanel },
        setup() {
            const active = ref('account');
            return { args, active };
        },
        template: `
            <Tabs v-bind="args" v-model="active">
                <TabsList>
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>
                <TabPanel value="account"><p>Account panel</p></TabPanel>
                <TabPanel value="security"><p>Security panel</p></TabPanel>
                <TabPanel value="notifications"><p>Notifications panel</p></TabPanel>
            </Tabs>
        `,
    }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const accountTab = canvas.getByRole('tab', { name: 'Account' });

        accountTab.focus();
        await userEvent.keyboard('{ArrowRight}');

        await expect(canvas.getByRole('tab', { name: 'Security' })).toHaveAttribute('aria-selected', 'true');
        await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Security panel');
    },
};
