import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from './button.vue';

const meta = {
    title: 'Components/Button',
    component: Button as any,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['solid', 'outline', 'ghost', 'link'],
        },
        color: {
            control: 'select',
            options: ['primary', 'secondary', 'success', 'warning', 'danger'],
        },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
        type: {
            control: 'select',
            options: ['button', 'submit', 'reset'],
        },
        disabled: { control: 'boolean' },
        loading: { control: 'boolean' },
        block: { control: 'boolean' },
    },
    args: {
        variant: 'solid',
        color: 'primary',
        size: 'md',
        disabled: false,
        loading: false,
        block: false,
    },
    render: (args) => ({
        components: { Button },
        setup: () => ({ args }),
        template: '<Button v-bind="args">{{ args.label || "Button" }}</Button>',
    }),
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
    render: () => ({
        components: { Button },
        template: `
            <div style="display: flex; gap: 12px; align-items: center;">
                <Button variant="solid">Solid</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
            </div>
        `,
    }),
};

export const Colors: Story = {
    render: () => ({
        components: { Button },
        template: `
            <div style="display: flex; gap: 12px; align-items: center;">
                <Button color="primary">Primary</Button>
                <Button color="secondary">Secondary</Button>
                <Button color="success">Success</Button>
                <Button color="warning">Warning</Button>
                <Button color="danger">Danger</Button>
            </div>
        `,
    }),
};

export const Sizes: Story = {
    render: () => ({
        components: { Button },
        template: `
            <div style="display: flex; gap: 12px; align-items: center;">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
            </div>
        `,
    }),
};

export const OutlineColors: Story = {
    render: () => ({
        components: { Button },
        template: `
            <div style="display: flex; gap: 12px; align-items: center;">
                <Button variant="outline" color="primary">Primary</Button>
                <Button variant="outline" color="secondary">Secondary</Button>
                <Button variant="outline" color="success">Success</Button>
                <Button variant="outline" color="warning">Warning</Button>
                <Button variant="outline" color="danger">Danger</Button>
            </div>
        `,
    }),
};

export const Disabled: Story = {
    args: { disabled: true },
};

export const Loading: Story = {
    args: { loading: true },
};

export const Block: Story = {
    args: { block: true },
    render: (args) => ({
        components: { Button },
        setup: () => ({ args }),
        template: `
            <div style="width: 320px;">
                <Button v-bind="args">Full Width</Button>
            </div>
        `,
    }),
};
