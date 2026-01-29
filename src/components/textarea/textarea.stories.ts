import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Textarea from './textarea.vue';

const meta = {
    title: 'Components/Textarea',
    component: Textarea as any,
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
        resize: {
            control: 'select',
            options: ['none', 'vertical', 'horizontal', 'both'],
        },
        rows: { control: 'number' },
        placeholder: { control: 'text' },
        disabled: { control: 'boolean' },
        readonly: { control: 'boolean' },
        block: { control: 'boolean' },
    },
    args: {
        size: 'md',
        resize: 'vertical',
        rows: 3,
        placeholder: 'Enter text...',
        disabled: false,
        readonly: false,
        block: false,
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

export const Default: Story = {};

export const Sizes: Story = {
    render: () => ({
        components: { Textarea },
        setup() {
            const sm = ref('');
            const md = ref('');
            const lg = ref('');
            return { sm, md, lg };
        },
        template: `
            <div style="display: flex; gap: 12px; align-items: flex-start;">
                <Textarea v-model="sm" size="sm" placeholder="Small" />
                <Textarea v-model="md" size="md" placeholder="Medium" />
                <Textarea v-model="lg" size="lg" placeholder="Large" />
            </div>
        `,
    }),
};

export const NoResize: Story = {
    args: { resize: 'none' },
};

export const Disabled: Story = {
    args: { disabled: true },
};

export const Block: Story = {
    args: { block: true },
    render: (args) => ({
        components: { Textarea },
        setup() {
            const value = ref('');
            return { args, value };
        },
        template: `
            <div style="width: 400px;">
                <Textarea v-bind="args" v-model="value" placeholder="Full width" />
            </div>
        `,
    }),
};
