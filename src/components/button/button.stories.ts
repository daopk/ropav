import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from './button.vue';

const meta = {
    title: 'Components/Button',
    component: Button as any,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: [undefined, 'solid', 'ghost'],
        },
        type: {
            control: 'select',
            options: ['button', 'submit', 'reset'],
        },
        disabled: { control: 'boolean' },
        loading: { control: 'boolean' },
    },
    args: {
        disabled: false,
        loading: false,
    },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
    render: (args) => ({
        components: { Button },
        setup: () => ({ args }),
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <Button v-bind="args">Default</Button>
                <Button v-bind="args" variant="solid">Solid</Button>
                <Button v-bind="args" variant="ghost">Ghost</Button>
            </div>
        `,
    }),
};

export const States: Story = {
    render: (args) => ({
        components: { Button },
        setup: () => ({ args }),
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <Button v-bind="args" loading>Loading</Button>
                <Button v-bind="args" disabled>Disabled</Button>
            </div>
        `,
    }),
};
