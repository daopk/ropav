import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Select from './select.vue';

const fruitOptions = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
    { label: 'Dragonfruit', value: 'dragonfruit' },
    { label: 'Elderberry', value: 'elderberry' },
    { label: 'Fig', value: 'fig' },
    { label: 'Grape', value: 'grape' },
];

const meta = {
    title: 'Components/Select',
    component: Select as any,
    tags: ['autodocs'],
    argTypes: {
        modelValue: { control: 'text' },
        placeholder: { control: 'text' },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
        disabled: { control: 'boolean' },
        clearable: { control: 'boolean' },
        searchable: { control: 'boolean' },
        block: { control: 'boolean' },
    },
    args: {
        options: fruitOptions,
        placeholder: 'Select a fruit...',
        size: 'md',
        disabled: false,
        clearable: false,
        searchable: false,
        block: false,
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

import { ref } from 'vue';

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

export const Clearable: Story = {
    render: (args) => ({
        components: { Select },
        setup() {
            const value = ref('banana');
            return { args, value };
        },
        template: '<Select v-bind="args" v-model="value" clearable />',
    }),
};

export const Searchable: Story = {
    args: { searchable: true },
};

export const Sizes: Story = {
    render: () => ({
        components: { Select },
        setup() {
            const sm = ref(null);
            const md = ref(null);
            const lg = ref(null);
            return { sm, md, lg, fruitOptions };
        },
        template: `
            <div style="display: flex; gap: 12px; align-items: flex-start;">
                <Select v-model="sm" :options="fruitOptions" size="sm" placeholder="Small" />
                <Select v-model="md" :options="fruitOptions" size="md" placeholder="Medium" />
                <Select v-model="lg" :options="fruitOptions" size="lg" placeholder="Large" />
            </div>
        `,
    }),
};

export const Disabled: Story = {
    args: { disabled: true },
};

export const DisabledOptions: Story = {
    args: {
        options: [
            { label: 'Apple', value: 'apple' },
            { label: 'Banana (sold out)', value: 'banana', disabled: true },
            { label: 'Cherry', value: 'cherry' },
            { label: 'Dragonfruit (sold out)', value: 'dragonfruit', disabled: true },
            { label: 'Elderberry', value: 'elderberry' },
        ],
    },
};

export const Block: Story = {
    args: { block: true },
    render: (args) => ({
        components: { Select },
        setup() {
            const value = ref(null);
            return { args, value };
        },
        template: `
            <div style="width: 320px;">
                <Select v-bind="args" v-model="value" />
            </div>
        `,
    }),
};
