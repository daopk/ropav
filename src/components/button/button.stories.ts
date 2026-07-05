import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from './button.vue';

const meta = {
    title: 'Components/Button',
    component: Button as any,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['solid', 'ghost'],
        },
        type: {
            control: 'select',
            options: ['button', 'submit', 'reset'],
        },
        disabled: { control: 'boolean' },
        loading: { control: 'boolean' },
    },
    args: {
        variant: 'solid',
        disabled: false,
        loading: false,
    },
    render: (args) => ({
        components: { Button },
        setup: () => ({ args }),
        template: '<Button v-bind="args">Button</Button>',
    }),
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Ghost: Story = {
    args: { variant: 'ghost' },
};

export const Loading: Story = {
    args: { loading: true },
};

export const Disabled: Story = {
    args: { disabled: true },
};
