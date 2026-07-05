import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ref } from 'vue';
import Textarea from './textarea.vue';

const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

const meta = {
    title: 'Components/Textarea',
    component: Textarea as any,
    tags: ['autodocs'],
    argTypes: {
        radius: {
            control: 'select',
            options: [undefined, ...radii],
        },
        size: {
            control: 'select',
            options: [undefined, ...sizes],
        },
        rows: { control: 'number' },
        placeholder: { control: 'text' },
        disabled: { control: 'boolean' },
        readonly: { control: 'boolean' },
        invalid: { control: 'boolean' },
        valid: { control: 'boolean' },
    },
    args: {
        modelValue: '',
        radius: undefined,
        size: undefined,
        rows: 3,
        placeholder: 'Enter text...',
        disabled: false,
        readonly: false,
        invalid: false,
        valid: false,
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

export const Invalid: Story = {
    args: { invalid: true },
};

export const Valid: Story = {
    args: { valid: true },
};

export const Sizes: Story = {
    render: (args) => ({
        components: { Textarea },
        setup: () => ({ args, sizes }),
        template: `
            <div style="display: grid; gap: 12px; max-width: 360px;">
                <Textarea v-for="size in sizes" :key="size" v-bind="args" :size="size" :model-value="size" />
            </div>
        `,
    }),
};

export const Radii: Story = {
    render: (args) => ({
        components: { Textarea },
        setup: () => ({ args, radii }),
        template: `
            <div style="display: grid; gap: 12px; max-width: 360px;">
                <Textarea v-for="radius in radii" :key="radius" v-bind="args" :radius="radius" :model-value="radius" />
            </div>
        `,
    }),
};
