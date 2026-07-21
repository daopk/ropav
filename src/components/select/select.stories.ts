import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { computed, reactive, ref } from 'vue';
import Select from './select.vue';

const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

const fruitOptions = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
    { label: 'Dragonfruit', value: 'dragonfruit' },
    { label: 'Elderberry', value: 'elderberry' },
];

const manyFruitOptions = [
    ...fruitOptions,
    { label: 'Fig', value: 'fig' },
    { label: 'Grape', value: 'grape' },
    { label: 'Honeydew', value: 'honeydew' },
    { label: 'Jackfruit', value: 'jackfruit' },
    { label: 'Kiwi', value: 'kiwi' },
    { label: 'Lemon', value: 'lemon' },
    { label: 'Mango', value: 'mango' },
    { label: 'Nectarine', value: 'nectarine' },
    { label: 'Orange', value: 'orange' },
    { label: 'Papaya', value: 'papaya' },
    { label: 'Quince', value: 'quince' },
    { label: 'Raspberry', value: 'raspberry' },
    { label: 'Strawberry', value: 'strawberry' },
    { label: 'Tangerine', value: 'tangerine' },
    { label: 'Watermelon', value: 'watermelon' },
];

const meta = {
    title: 'Components/Select',
    component: Select as any,
    tags: ['autodocs'],
    argTypes: {
        modelValue: { control: 'text' },
        radius: {
            control: 'select',
            options: [undefined, ...radii],
        },
        size: {
            control: 'select',
            options: [undefined, ...sizes],
        },
        placeholder: { control: 'text' },
        clearable: { control: 'boolean' },
        clearLabel: { control: 'text' },
        disabled: { control: 'boolean' },
        ariaLabel: { control: 'text' },
        labelledby: { control: 'text' },
    },
    args: {
        modelValue: null,
        options: fruitOptions,
        size: undefined,
        radius: undefined,
        placeholder: 'Select a fruit...',
        clearable: false,
        clearLabel: 'Clear selection',
        disabled: false,
        ariaLabel: 'Fruit',
        labelledby: undefined,
    },
    render: (args) => ({
        components: { Select },
        setup() {
            const value = ref(args.modelValue ?? null);
            return { args, value };
        },
        template: '<Select v-bind="args" v-model="value" />',
    }),
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
    render: (args) => ({
        components: { Select },
        setup() {
            const value = ref('cherry');
            return { args, value };
        },
        template: '<Select v-bind="args" v-model="value" />',
    }),
};

export const ManyOptions: Story = {
    args: {
        options: manyFruitOptions,
    },
};

export const OpenDropdownA11y: Story = {
    tags: ['test'],
    parameters: {
        a11y: {
            options: {
                runOnly: ['aria-required-children', 'scrollable-region-focusable'],
            },
            test: 'error',
        },
    },
    args: {
        options: manyFruitOptions,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('combobox', { name: 'Fruit' });
        trigger.focus();

        await userEvent.keyboard('{ArrowDown}');
        const listbox = await canvas.findByRole('listbox');

        expect(trigger).toHaveFocus();
        expect(trigger).toHaveAttribute('aria-controls', listbox.id);
        expect(listbox).toHaveClass('rp-scroll-area__viewport');
        expect(listbox).toHaveAttribute('tabindex', '-1');
    },
};

export const Typeahead: Story = {
    tags: ['test'],
    args: {
        options: manyFruitOptions,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('combobox', { name: 'Fruit' });
        trigger.focus();

        await userEvent.keyboard('g');
        await waitFor(() => {
            expect(trigger).toHaveTextContent('Grape');
            expect(trigger).toHaveAttribute('aria-expanded', 'false');
            expect(trigger).not.toHaveAttribute('aria-activedescendant');
        });

        await userEvent.keyboard('{ArrowDown}');
        await canvas.findByRole('listbox');
        await userEvent.keyboard('m');

        const mango = canvas.getByRole('option', { name: 'Mango' });
        await waitFor(() => expect(mango).toHaveAttribute('data-highlighted'));
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(trigger).toHaveTextContent('Mango'));
    },
};

export const Clearable: Story = {
    args: {
        clearable: true,
        modelValue: 'cherry',
    },
    render: (args) => ({
        components: { Select },
        setup() {
            const value = ref(args.modelValue ?? null);
            return { args, value };
        },
        template: '<Select v-bind="args" v-model="value" />',
    }),
};

export const Sizes: Story = {
    render: (args) => ({
        components: { Select },
        setup() {
            const values = reactive<Record<(typeof sizes)[number], string | number | null>>({
                xs: 'apple',
                sm: 'banana',
                md: 'cherry',
                lg: 'dragonfruit',
                xl: 'elderberry',
            });
            const selectArgs = computed(() => {
                const { modelValue, size, ...rest } = args;
                void modelValue;
                void size;
                return rest;
            });

            return { selectArgs, sizes, values };
        },
        template: `
            <div style="display: grid; gap: 12px; max-width: 320px;">
                <Select
                    v-for="size in sizes"
                    :key="size"
                    v-bind="selectArgs"
                    v-model="values[size]"
                    :size="size"
                    :aria-label="'Fruit (' + size + ')'"
                />
            </div>
        `,
    }),
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
    args: { disabled: true },
};

export const Radii: Story = {
    render: (args) => ({
        components: { Select },
        setup() {
            const values = reactive<Record<(typeof radii)[number], string | number | null>>({
                xs: 'apple',
                sm: 'banana',
                md: 'cherry',
                lg: 'dragonfruit',
                xl: 'elderberry',
            });
            const selectArgs = computed(() => {
                const { modelValue, radius, ...rest } = args;
                void modelValue;
                void radius;
                return rest;
            });

            return { radii, selectArgs, values };
        },
        template: `
            <div style="display: grid; gap: 12px; max-width: 320px;">
                <Select
                    v-for="radius in radii"
                    :key="radius"
                    v-bind="selectArgs"
                    v-model="values[radius]"
                    :radius="radius"
                    :aria-label="'Fruit (' + radius + ' radius)'"
                />
            </div>
        `,
    }),
};
