import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ref } from 'vue';
import Select from './select.vue';

const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

const fruitOptions = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
    { label: 'Dragonfruit', value: 'dragonfruit' },
    { label: 'Elderberry', value: 'elderberry' },
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
        placeholder: { control: 'text' },
        disabled: { control: 'boolean' },
    },
    args: {
        modelValue: null,
        options: fruitOptions,
        radius: undefined,
        placeholder: 'Select a fruit...',
        disabled: false,
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
        setup: () => ({ args, radii }),
        template: `
            <div style="display: grid; gap: 12px; max-width: 320px;">
                <Select
                    v-for="radius in radii"
                    :key="radius"
                    v-bind="args"
                    :radius="radius"
                    :model-value="radius"
                />
            </div>
        `,
    }),
};

export const KeyboardNavigation: Story = {
    tags: ['test'],
    render: (args) => ({
        components: { Select },
        setup() {
            const value = ref(null);
            return { args, value };
        },
        template: '<Select v-bind="args" v-model="value" />',
    }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('combobox');

        trigger.focus();
        await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');

        await expect(trigger).toHaveTextContent('Banana');
    },
};
