import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, within } from 'storybook/test';
import { reactive, ref } from 'vue';
import MultiSelect from './multi-select.vue';

const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const fruitOptions = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
    { label: 'Dragon Fruit', value: 'dragon-fruit' },
    { label: 'Elderberry', value: 'elderberry' },
    { label: 'Fig', value: 'fig' },
    { label: 'Grape', value: 'grape' },
];

const meta = {
    title: 'Components/MultiSelect',
    component: MultiSelect as any,
    tags: ['autodocs'],
    argTypes: {
        modelValue: { control: 'object' },
        maxValues: { control: 'number' },
        size: { control: 'select', options: [undefined, ...sizes] },
        radius: { control: 'select', options: [undefined, 'xs', 'sm', 'md', 'lg', 'xl'] },
        clearable: { control: 'boolean' },
        disabled: { control: 'boolean' },
    },
    args: {
        modelValue: [],
        options: fruitOptions,
        placeholder: 'Select fruits...',
        clearable: true,
        disabled: false,
        ariaLabel: 'Fruits',
    },
    render: (args) => ({
        components: { MultiSelect },
        setup() {
            const value = ref(args.modelValue ?? []);
            return { args, value };
        },
        template: '<MultiSelect v-bind="args" v-model="value" />',
    }),
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValues: Story = {
    args: {
        modelValue: ['apple', 'cherry'],
    },
};

export const MaxValues: Story = {
    args: {
        modelValue: ['apple', 'banana'],
        maxValues: 2,
    },
};

export const DisabledOptions: Story = {
    args: {
        options: [
            { label: 'Apple', value: 'apple' },
            { label: 'Banana sold out', value: 'banana', disabled: true },
            { label: 'Cherry', value: 'cherry' },
        ],
    },
};

export const Disabled: Story = {
    args: {
        modelValue: ['apple', 'cherry'],
        disabled: true,
    },
};

export const Sizes: Story = {
    render: (args) => ({
        components: { MultiSelect },
        setup() {
            const values = reactive<Record<(typeof sizes)[number], string[]>>({
                xs: ['apple'],
                sm: ['apple'],
                md: ['apple'],
                lg: ['apple'],
                xl: ['apple'],
            });
            return { args, sizes, values };
        },
        template: `
            <div style="display: grid; gap: 12px; max-width: 360px;">
                <MultiSelect
                    v-for="size in sizes"
                    :key="size"
                    v-bind="args"
                    v-model="values[size]"
                    :size="size"
                    :aria-label="'Fruits (' + size + ')'"
                />
            </div>
        `,
    }),
};

export const KeyboardInteraction: Story = {
    tags: ['test'],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByRole('combobox', { name: 'Fruits' });

        await userEvent.click(input);
        await userEvent.keyboard('{Enter}');

        expect(
            canvas.getByText('Apple', { selector: '.rp-multi-select__pill-label' }),
        ).toBeVisible();
        expect(canvas.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
    },
};
