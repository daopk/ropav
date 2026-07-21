import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ref } from 'vue';
import Field from '../field/field.vue';
import Textarea from './textarea.vue';

const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const resizes = ['none', 'vertical', 'both'] as const;
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
        resize: {
            control: 'select',
            options: resizes,
        },
        autosize: { control: 'boolean' },
        minRows: { control: 'number' },
        maxRows: { control: 'number' },
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
        resize: 'none',
        autosize: false,
        minRows: undefined,
        maxRows: undefined,
        size: undefined,
        rows: 3,
        placeholder: 'Enter text...',
        disabled: false,
        readonly: false,
        invalid: false,
        valid: false,
    },
    render: (args) => ({
        components: { Field, Textarea },
        setup() {
            const value = ref(args.modelValue ?? '');
            return { args, value };
        },
        template: `
            <Field id="textarea-notes" label="Notes" v-slot="{ controlProps }" style="max-width: 360px;">
                <Textarea v-bind="{ ...controlProps, ...args }" v-model="value" />
            </Field>
        `,
    }),
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    tags: ['test'],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const textbox = canvas.getByRole('textbox', { name: 'Notes' });

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
        const textbox = canvas.getByRole('textbox', { name: 'Notes' });

        await expect(textbox).toBeDisabled();
    },
};

export const Invalid: Story = {
    args: { invalid: true },
};

export const Valid: Story = {
    args: { valid: true },
};

export const Resizable: Story = {
    args: {
        modelValue: 'Resizable notes',
        resize: 'vertical',
    },
};

export const Autosize: Story = {
    args: {
        autosize: true,
        minRows: 2,
        modelValue: 'Autosize notes',
    },
};

export const AutosizeLimited: Story = {
    args: {
        autosize: true,
        minRows: 2,
        maxRows: 6,
        modelValue: 'Autosize notes with a row limit',
    },
};

export const Sizes: Story = {
    render: (args) => ({
        components: { Textarea },
        setup: () => ({ args, sizes }),
        template: `
            <div style="display: grid; gap: 12px; max-width: 360px;">
                <Textarea
                    v-for="size in sizes"
                    :key="size"
                    v-bind="args"
                    :aria-label="'Textarea size ' + size"
                    :size="size"
                    :model-value="size"
                />
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
                <Textarea
                    v-for="radius in radii"
                    :key="radius"
                    v-bind="args"
                    :aria-label="'Textarea radius ' + radius"
                    :radius="radius"
                    :model-value="radius"
                />
            </div>
        `,
    }),
};
