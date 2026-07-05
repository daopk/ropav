import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ref } from 'vue';
import Switch from './switch.vue';

const meta = {
    title: 'Components/Switch',
    component: Switch as any,
    tags: ['autodocs'],
    argTypes: {
        disabled: { control: 'boolean' },
    },
    args: {
        modelValue: false,
        disabled: false,
    },
    render: (args) => ({
        components: { Switch },
        setup() {
            const value = ref(false);
            return { args, value };
        },
        template: '<Switch v-bind="args" v-model="value">Dark mode</Switch>',
    }),
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    tags: ['test'],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const control = canvas.getByRole('switch', { name: 'Dark mode' });

        await expect(control).not.toBeChecked();
        await userEvent.click(canvas.getByText('Dark mode'));
        await expect(control).toBeChecked();
    },
};

export const On: Story = {
    render: (args) => ({
        components: { Switch },
        setup() {
            const value = ref(true);
            return { args, value };
        },
        template: '<Switch v-bind="args" v-model="value">Enabled</Switch>',
    }),
};

export const Disabled: Story = {
    tags: ['test'],
    args: { disabled: true },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const control = canvas.getByRole('switch', { name: 'Dark mode' });

        await expect(control).toBeDisabled();
        await expect(control).not.toBeChecked();
    },
};
