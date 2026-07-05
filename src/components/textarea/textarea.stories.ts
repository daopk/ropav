import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ref } from 'vue';
import Textarea from './textarea.vue';

const meta = {
    title: 'Components/Textarea',
    component: Textarea as any,
    tags: ['autodocs'],
    argTypes: {
        rows: { control: 'number' },
        placeholder: { control: 'text' },
        disabled: { control: 'boolean' },
        readonly: { control: 'boolean' },
    },
    args: {
        modelValue: '',
        rows: 3,
        placeholder: 'Enter text...',
        disabled: false,
        readonly: false,
    },
    render: (args) => ({
        components: { Textarea },
        setup() {
            const value = ref(args.modelValue ?? '');
            return { args, value };
        },
        template: '<Textarea v-bind="args" v-model="value" />',
    }),
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    tags: ['test'],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const textbox = canvas.getByRole('textbox');

        await expect(textbox).toHaveValue('');
        await userEvent.type(textbox, 'Hello Storybook');
        await expect(textbox).toHaveValue('Hello Storybook');
    },
};

export const Readonly: Story = {
    args: {
        modelValue: 'Readonly notes',
        readonly: true,
    },
};

export const Disabled: Story = {
    tags: ['test'],
    args: { disabled: true },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const textbox = canvas.getByRole('textbox');

        await expect(textbox).toBeDisabled();
    },
};
