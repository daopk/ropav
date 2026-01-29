import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Card from './card.vue';

const meta = {
    title: 'Components/Card',
    component: Card as any,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['elevated', 'outline', 'filled'],
        },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
        header: { control: 'text' },
        footer: { control: 'text' },
    },
    args: {
        variant: 'elevated',
        size: 'md',
    },
    render: (args) => ({
        components: { Card },
        setup: () => ({ args }),
        template: '<Card v-bind="args">Card content goes here.</Card>',
    }),
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
    render: () => ({
        components: { Card },
        template: `
            <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                <Card variant="elevated" style="width: 250px;">Elevated card with shadow.</Card>
                <Card variant="outline" style="width: 250px;">Outline card with border.</Card>
                <Card variant="filled" style="width: 250px;">Filled card with background.</Card>
            </div>
        `,
    }),
};

export const WithHeaderAndFooter: Story = {
    render: () => ({
        components: { Card },
        template: `
            <Card variant="outline" header="Card Title" footer="Footer text" style="max-width: 400px;">
                This is the body of the card. It can contain any content.
            </Card>
        `,
    }),
};

export const Sizes: Story = {
    render: () => ({
        components: { Card },
        template: `
            <div style="display: flex; flex-direction: column; gap: 16px; max-width: 400px;">
                <Card size="sm" variant="outline">Small padding</Card>
                <Card size="md" variant="outline">Medium padding</Card>
                <Card size="lg" variant="outline">Large padding</Card>
            </div>
        `,
    }),
};
