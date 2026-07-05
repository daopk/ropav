import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import IconCircleCheck from '~icons/lucide/circle-check';
import IconSearch from '~icons/lucide/search';
import Input from './input.vue';

const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

const meta = {
    title: 'Components/Input',
    component: Input as any,
    tags: ['autodocs'],
    argTypes: {
        type: {
            control: 'select',
            options: ['text', 'password', 'email', 'number', 'tel', 'url'],
        },
        radius: {
            control: 'select',
            options: [undefined, ...radii],
        },
        size: {
            control: 'select',
            options: [undefined, ...sizes],
        },
        placeholder: { control: 'text' },
        disabled: { control: 'boolean' },
        readonly: { control: 'boolean' },
        invalid: { control: 'boolean' },
        valid: { control: 'boolean' },
    },
    args: {
        modelValue: '',
        type: 'text',
        radius: undefined,
        size: undefined,
        placeholder: 'Enter text...',
        disabled: false,
        readonly: false,
        invalid: false,
        valid: false,
    },
    render: (args) => ({
        components: { Input },
        setup() {
            const value = ref(args.modelValue ?? '');
            return { args, value };
        },
        template: '<Input v-bind="args" v-model="value" />',
    }),
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
    args: { disabled: true },
};

export const Invalid: Story = {
    args: { invalid: true },
};

export const Valid: Story = {
    args: { valid: true },
};

export const Slots: Story = {
    render: (args) => ({
        components: { IconCircleCheck, IconSearch, Input },
        setup: () => ({ args }),
        template: `
            <div style="display: grid; gap: 12px; max-width: 320px;">
                <Input v-bind="args" model-value="" placeholder="Search">
                    <template #left>
                        <IconSearch aria-hidden="true" />
                    </template>
                </Input>
                <Input v-bind="args" model-value="zoi@example.com">
                    <template #right>
                        <IconCircleCheck aria-hidden="true" />
                    </template>
                </Input>
            </div>
        `,
    }),
};

export const Sizes: Story = {
    render: (args) => ({
        components: { Input },
        setup: () => ({ args, sizes }),
        template: `
            <div style="display: grid; gap: 12px; max-width: 320px;">
                <Input v-for="size in sizes" :key="size" v-bind="args" :size="size" :model-value="size" />
            </div>
        `,
    }),
};

export const Radii: Story = {
    render: (args) => ({
        components: { Input },
        setup: () => ({ args, radii }),
        template: `
            <div style="display: grid; gap: 12px; max-width: 320px;">
                <Input v-for="radius in radii" :key="radius" v-bind="args" :radius="radius" :model-value="radius" />
            </div>
        `,
    }),
};
