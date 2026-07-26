import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { computed, reactive, ref } from 'vue';
import Combobox from './combobox.vue';

const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

const fruitOptions = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
    { label: 'Dragon Fruit', value: 'dragon-fruit' },
    { label: 'Elderberry', value: 'elderberry' },
    { label: 'Fig', value: 'fig' },
    { label: 'Grape', value: 'grape' },
    { label: 'Honeydew', value: 'honeydew' },
    { label: 'Jackfruit', value: 'jackfruit' },
    { label: 'Kiwi', value: 'kiwi' },
    { label: 'Mango', value: 'mango' },
    { label: 'Orange', value: 'orange' },
];

const meta = {
    title: 'Components/Forms/Combobox',
    component: Combobox as any,
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
        disabled: { control: 'boolean' },
        ariaLabel: { control: 'text' },
    },
    args: {
        modelValue: null,
        options: fruitOptions,
        placeholder: 'Search fruit...',
        clearable: true,
        disabled: false,
        ariaLabel: 'Fruit',
    },
    render: (args) => ({
        components: { Combobox },
        setup() {
            const value = ref(args.modelValue ?? null);
            return { args, value };
        },
        template: '<Combobox v-bind="args" v-model="value" />',
    }),
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FlipsAboveNearViewportEdge: Story = {
    tags: ['test'],
    render: (args) => ({
        components: { Combobox },
        setup() {
            const value = ref<string | number | null>(null);
            return { args, value };
        },
        template: `
            <div style="position: fixed; inset-inline-start: 24px; bottom: 4px;">
                <Combobox v-bind="args" v-model="value" />
            </div>
        `,
    }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('combobox', { name: 'Fruit' }));

        const popup = canvasElement.querySelector('.rp-combobox__dropdown');
        await waitFor(() => {
            expect(popup).toHaveAttribute('data-placement', 'top-start');
            expect(popup).toHaveAttribute('data-side', 'top');
        });
    },
};

export const SearchAndSelect: Story = {
    tags: ['test'],
    parameters: {
        a11y: {
            options: {
                runOnly: ['aria-required-children', 'scrollable-region-focusable'],
            },
            test: 'error',
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByRole('combobox', { name: 'Fruit' });

        await userEvent.click(input);
        await userEvent.type(input, 'gra');

        const grape = await canvas.findByRole('option', { name: 'Grape' });
        expect(grape).toHaveAttribute('data-highlighted');
        expect(input).toHaveAttribute('aria-activedescendant', grape.id);

        await userEvent.keyboard('{Enter}');
        await waitFor(() => {
            expect(input).toHaveValue('Grape');
            expect(input).toHaveAttribute('aria-expanded', 'false');
        });
    },
};

export const WithValue: Story = {
    args: {
        modelValue: 'cherry',
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

export const CustomOptions: Story = {
    render: (args) => ({
        components: { Combobox },
        setup() {
            const value = ref<string | number | null>(null);
            return { args, value };
        },
        template: `
            <Combobox v-bind="args" v-model="value">
                <template #option="{ option, selected }">
                    <span style="display: flex; justify-content: space-between; width: 100%;">
                        <span>{{ option.label }}</span>
                        <span v-if="selected" aria-hidden="true">✓</span>
                    </span>
                </template>
                <template #empty="{ searchValue }">
                    No fruit matching “{{ searchValue }}”
                </template>
            </Combobox>
        `,
    }),
};

export const Sizes: Story = {
    render: (args) => ({
        components: { Combobox },
        setup() {
            const values = reactive<Record<(typeof sizes)[number], string | number | null>>({
                xs: 'apple',
                sm: 'banana',
                md: 'cherry',
                lg: 'dragon-fruit',
                xl: 'elderberry',
            });
            const comboboxArgs = computed(() => {
                const { modelValue, size, ...rest } = args;
                void modelValue;
                void size;
                return rest;
            });

            return { comboboxArgs, sizes, values };
        },
        template: `
            <div style="display: grid; gap: 12px; max-width: 320px;">
                <Combobox
                    v-for="size in sizes"
                    :key="size"
                    v-bind="comboboxArgs"
                    v-model="values[size]"
                    :size="size"
                    :aria-label="'Fruit (' + size + ')'"
                />
            </div>
        `,
    }),
};

export const Radii: Story = {
    render: (args) => ({
        components: { Combobox },
        setup() {
            const values = reactive<Record<(typeof radii)[number], string | number | null>>({
                xs: 'apple',
                sm: 'banana',
                md: 'cherry',
                lg: 'dragon-fruit',
                xl: 'elderberry',
            });
            const comboboxArgs = computed(() => {
                const { modelValue, radius, ...rest } = args;
                void modelValue;
                void radius;
                return rest;
            });

            return { comboboxArgs, radii, values };
        },
        template: `
            <div style="display: grid; gap: 12px; max-width: 320px;">
                <Combobox
                    v-for="radius in radii"
                    :key="radius"
                    v-bind="comboboxArgs"
                    v-model="values[radius]"
                    :radius="radius"
                    :aria-label="'Fruit (' + radius + ' radius)'"
                />
            </div>
        `,
    }),
};

export const Disabled: Story = {
    args: {
        disabled: true,
        modelValue: 'apple',
    },
};
