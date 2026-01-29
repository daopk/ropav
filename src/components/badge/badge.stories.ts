import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Badge from './badge.vue';
import Avatar from '../avatar/avatar.vue';
import Button from '../button/button.vue';

const meta = {
    title: 'Components/Badge',
    component: Badge as any,
    tags: ['autodocs'],
    argTypes: {
        content: { control: 'text' },
        max: { control: 'number' },
        dot: { control: 'boolean' },
        bordered: { control: 'boolean' },
        placement: {
            control: 'select',
            options: ['corner', 'edge'],
        },
        color: {
            control: 'select',
            options: ['primary', 'secondary', 'success', 'warning', 'danger'],
        },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
        show: { control: 'boolean' },
    },
    args: {
        content: 5,
        color: 'danger',
        size: 'md',
        dot: false,
        show: true,
    },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => ({
        components: { Badge, Avatar },
        setup: () => ({ args }),
        template: `
            <Badge v-bind="args" placement="edge">
                <Avatar name="John" size="md" />
            </Badge>
        `,
    }),
};

export const Dot: Story = {
    render: () => ({
        components: { Badge, Avatar },
        template: `
            <div style="display: flex; gap: 24px; align-items: center;">
                <Badge dot placement="edge">
                    <Avatar name="Alice" size="md" />
                </Badge>
                <Badge dot color="success" placement="edge">
                    <Avatar name="Bob" size="md" />
                </Badge>
                <Badge dot color="warning" placement="edge">
                    <Avatar name="Carol" size="md" />
                </Badge>
            </div>
        `,
    }),
};

export const WithCount: Story = {
    render: () => ({
        components: { Badge, Avatar },
        template: `
            <div style="display: flex; gap: 24px; align-items: center;">
                <Badge :content="3" placement="edge">
                    <Avatar name="User A" size="md" />
                </Badge>
                <Badge :content="12" placement="edge">
                    <Avatar name="User B" size="md" />
                </Badge>
                <Badge :content="99" :max="99" placement="edge">
                    <Avatar name="User C" size="md" />
                </Badge>
                <Badge :content="150" :max="99" placement="edge">
                    <Avatar name="User D" size="md" />
                </Badge>
            </div>
        `,
    }),
};

export const Colors: Story = {
    render: () => ({
        components: { Badge, Avatar },
        template: `
            <div style="display: flex; gap: 24px; align-items: center;">
                <Badge :content="1" color="primary" placement="edge">
                    <Avatar name="P" size="md" />
                </Badge>
                <Badge :content="2" color="secondary" placement="edge">
                    <Avatar name="S" size="md" />
                </Badge>
                <Badge :content="3" color="success" placement="edge">
                    <Avatar name="S" size="md" />
                </Badge>
                <Badge :content="4" color="warning" placement="edge">
                    <Avatar name="W" size="md" />
                </Badge>
                <Badge :content="5" color="danger" placement="edge">
                    <Avatar name="D" size="md" />
                </Badge>
            </div>
        `,
    }),
};

export const Sizes: Story = {
    render: () => ({
        components: { Badge, Avatar },
        template: `
            <div style="display: flex; gap: 24px; align-items: center;">
                <Badge :content="8" size="sm" placement="edge">
                    <Avatar name="Sm" size="md" />
                </Badge>
                <Badge :content="8" size="md" placement="edge">
                    <Avatar name="Md" size="md" />
                </Badge>
                <Badge :content="8" size="lg" placement="edge">
                    <Avatar name="Lg" size="md" />
                </Badge>
            </div>
        `,
    }),
};

export const Hidden: Story = {
    render: () => ({
        components: { Badge, Avatar },
        template: `
            <div style="display: flex; gap: 24px; align-items: center;">
                <Badge :content="5" :show="true" placement="edge">
                    <Avatar name="Visible" size="md" />
                </Badge>
                <Badge :content="5" :show="false" placement="edge">
                    <Avatar name="Hidden" size="md" />
                </Badge>
            </div>
        `,
    }),
};

export const Bordered: Story = {
    render: () => ({
        components: { Badge, Avatar },
        template: `
            <div style="display: flex; gap: 24px; align-items: center;">
                <Badge :content="3" bordered placement="edge">
                    <Avatar name="Count" size="md" />
                </Badge>
                <Badge dot bordered color="success" placement="edge">
                    <Avatar name="Dot" size="md" />
                </Badge>
            </div>
        `,
    }),
};

export const StringContent: Story = {
    render: () => ({
        components: { Badge, Avatar },
        template: `
            <div style="display: flex; gap: 24px; align-items: center;">
                <Badge content="NEW" placement="edge">
                    <Avatar name="N" size="md" />
                </Badge>
                <Badge content="HOT" color="warning" placement="edge">
                    <Avatar name="H" size="md" />
                </Badge>
            </div>
        `,
    }),
};

const iconStyle = 'width: 24px; height: 24px; display: block;';

export const OnIcons: Story = {
    render: () => ({
        components: { Badge },
        setup: () => ({ iconStyle }),
        template: `
            <div style="display: flex; gap: 32px; align-items: center;">
                <Badge :content="3">
                    <svg :style="iconStyle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>
                </Badge>
                <Badge dot color="success">
                    <svg :style="iconStyle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                </Badge>
                <Badge :content="7" color="primary">
                    <svg :style="iconStyle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                </Badge>
                <Badge dot color="danger">
                    <svg :style="iconStyle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path d="M16 12H8M12 8v8" /></svg>
                </Badge>
            </div>
        `,
    }),
};

export const OnButton: Story = {
    render: () => ({
        components: { Badge, Button },
        template: `
            <div style="display: flex; gap: 32px; align-items: center;">
                <Badge :content="3">
                    <Button variant="outline">Messages</Button>
                </Badge>
                <Badge dot color="success">
                    <Button>Online</Button>
                </Badge>
                <Badge :content="12" color="warning">
                    <Button variant="ghost">Alerts</Button>
                </Badge>
            </div>
        `,
    }),
};
