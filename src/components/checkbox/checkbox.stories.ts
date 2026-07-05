import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ref } from 'vue';
import Checkbox from './checkbox.vue';

const meta = {
    title: 'Components/Checkbox',
    component: Checkbox as any,
    tags: ['autodocs'],
    argTypes: {
        disabled: { control: 'boolean' },
        indeterminate: { control: 'boolean' },
    },
    args: {
        modelValue: false,
        disabled: false,
        indeterminate: false,
    },
    render: (args) => ({
        components: { Checkbox },
        setup() {
            const checked = ref(false);
            return { args, checked };
        },
        template: '<Checkbox v-bind="args" v-model="checked">Accept terms</Checkbox>',
    }),
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    tags: ['test'],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const checkbox = canvas.getByRole('checkbox', { name: 'Accept terms' });

        await expect(checkbox).not.toBeChecked();
        await userEvent.click(canvas.getByText('Accept terms'));
        await expect(checkbox).toBeChecked();
        await expect(checkbox).toHaveAttribute('aria-checked', 'true');
    },
};

export const Checked: Story = {
    render: (args) => ({
        components: { Checkbox },
        setup() {
            const checked = ref(true);
            return { args, checked };
        },
        template: '<Checkbox v-bind="args" v-model="checked">Checked</Checkbox>',
    }),
};

export const Indeterminate: Story = {
    args: { indeterminate: true },
};

export const Disabled: Story = {
    tags: ['test'],
    args: { disabled: true },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const checkbox = canvas.getByRole('checkbox', { name: 'Accept terms' });

        await expect(checkbox).toBeDisabled();
        await expect(checkbox).not.toBeChecked();
    },
};
