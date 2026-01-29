import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Tag from './tag.vue';

const meta = {
    title: 'Components/Tag',
    component: Tag as any,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['solid', 'outline', 'subtle'],
        },
        color: {
            control: 'select',
            options: ['primary', 'secondary', 'success', 'warning', 'danger'],
        },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
        closable: { control: 'boolean' },
    },
    args: {
        variant: 'subtle',
        color: 'primary',
        size: 'md',
        closable: false,
    },
    render: (args) => ({
        components: { Tag },
        setup: () => ({ args }),
        template: '<Tag v-bind="args">Tag</Tag>',
    }),
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
    render: () => ({
        components: { Tag },
        template: `
            <div style="display: flex; gap: 12px; align-items: center;">
                <Tag variant="solid">Solid</Tag>
                <Tag variant="outline">Outline</Tag>
                <Tag variant="subtle">Subtle</Tag>
            </div>
        `,
    }),
};

export const Colors: Story = {
    render: () => ({
        components: { Tag },
        template: `
            <div style="display: flex; gap: 12px; align-items: center;">
                <Tag color="primary">Primary</Tag>
                <Tag color="secondary">Secondary</Tag>
                <Tag color="success">Success</Tag>
                <Tag color="warning">Warning</Tag>
                <Tag color="danger">Danger</Tag>
            </div>
        `,
    }),
};

export const SolidColors: Story = {
    render: () => ({
        components: { Tag },
        template: `
            <div style="display: flex; gap: 12px; align-items: center;">
                <Tag variant="solid" color="primary">Primary</Tag>
                <Tag variant="solid" color="secondary">Secondary</Tag>
                <Tag variant="solid" color="success">Success</Tag>
                <Tag variant="solid" color="warning">Warning</Tag>
                <Tag variant="solid" color="danger">Danger</Tag>
            </div>
        `,
    }),
};

export const OutlineColors: Story = {
    render: () => ({
        components: { Tag },
        template: `
            <div style="display: flex; gap: 12px; align-items: center;">
                <Tag variant="outline" color="primary">Primary</Tag>
                <Tag variant="outline" color="secondary">Secondary</Tag>
                <Tag variant="outline" color="success">Success</Tag>
                <Tag variant="outline" color="warning">Warning</Tag>
                <Tag variant="outline" color="danger">Danger</Tag>
            </div>
        `,
    }),
};

export const Sizes: Story = {
    render: () => ({
        components: { Tag },
        template: `
            <div style="display: flex; gap: 12px; align-items: center;">
                <Tag size="sm">Small</Tag>
                <Tag size="md">Medium</Tag>
                <Tag size="lg">Large</Tag>
            </div>
        `,
    }),
};

export const Closable: Story = {
    render: () => ({
        components: { Tag },
        template: `
            <div style="display: flex; gap: 12px; align-items: center;">
                <Tag closable color="primary">Primary</Tag>
                <Tag closable color="success" variant="solid">Success</Tag>
                <Tag closable color="danger" variant="outline">Danger</Tag>
            </div>
        `,
    }),
};

export const ClosableSizes: Story = {
    render: () => ({
        components: { Tag },
        template: `
            <div style="display: flex; gap: 12px; align-items: center;">
                <Tag closable size="sm">Small</Tag>
                <Tag closable size="md">Medium</Tag>
                <Tag closable size="lg">Large</Tag>
            </div>
        `,
    }),
};
