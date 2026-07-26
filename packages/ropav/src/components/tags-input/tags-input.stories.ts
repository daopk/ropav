import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, within } from 'storybook/test';
import { reactive, ref } from 'vue';
import TagsInput from './tags-input.vue';

const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

const meta = {
    title: 'Components/Forms/Tags Input',
    component: TagsInput as any,
    tags: ['autodocs'],
    argTypes: {
        modelValue: { control: 'object' },
        maxTags: { control: 'number' },
        size: { control: 'select', options: [undefined, ...sizes] },
        radius: { control: 'select', options: [undefined, 'xs', 'sm', 'md', 'lg', 'xl'] },
        allowDuplicates: { control: 'boolean' },
        acceptValueOnBlur: { control: 'boolean' },
        clearable: { control: 'boolean' },
        disabled: { control: 'boolean' },
        readonly: { control: 'boolean' },
    },
    args: {
        modelValue: [],
        placeholder: 'Enter technologies...',
        allowDuplicates: false,
        acceptValueOnBlur: false,
        clearable: true,
        disabled: false,
        readonly: false,
        ariaLabel: 'Technologies',
    },
    render: (args) => ({
        components: { TagsInput },
        setup() {
            const value = ref(args.modelValue ?? []);
            return { args, value };
        },
        template: '<TagsInput v-bind="args" v-model="value" />',
    }),
} satisfies Meta<typeof TagsInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValues: Story = {
    args: {
        modelValue: ['Vue', 'Vapor', 'TypeScript'],
    },
};

export const CustomSeparators: Story = {
    args: {
        splitChars: [',', ';', ' '],
        placeholder: 'Separate tags with comma, semicolon, or space',
    },
};

export const Constrained: Story = {
    args: {
        modelValue: ['Vue'],
        maxTags: 3,
        validate: (value) => value.length >= 3,
    },
};

export const Readonly: Story = {
    args: {
        modelValue: ['Vue', 'Vapor'],
        readonly: true,
    },
};

export const Disabled: Story = {
    args: {
        modelValue: ['Vue', 'Vapor'],
        disabled: true,
    },
};

export const Sizes: Story = {
    render: (args) => ({
        components: { TagsInput },
        setup() {
            const values = reactive<Record<(typeof sizes)[number], string[]>>({
                xs: ['Vue'],
                sm: ['Vue'],
                md: ['Vue'],
                lg: ['Vue'],
                xl: ['Vue'],
            });
            return { args, sizes, values };
        },
        template: `
            <div style="display: grid; gap: 12px; max-width: 360px;">
                <TagsInput
                    v-for="size in sizes"
                    :key="size"
                    v-bind="args"
                    v-model="values[size]"
                    :size="size"
                    :aria-label="'Technologies (' + size + ')'"
                />
            </div>
        `,
    }),
};

export const KeyboardInteraction: Story = {
    tags: ['test'],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByRole('textbox', { name: 'Technologies' });

        await userEvent.type(input, 'Vue{Enter}Vapor,');

        expect(canvas.getByText('Vue', { selector: '.rp-tags-input__tag-label' })).toBeVisible();
        expect(canvas.getByText('Vapor', { selector: '.rp-tags-input__tag-label' })).toBeVisible();
    },
};
