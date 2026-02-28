import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Input from './input.vue';

const meta = {
    title: 'Components/Input',
    component: Input as any,
    tags: ['autodocs'],
    argTypes: {
        type: {
            control: 'select',
            options: ['text', 'password', 'email', 'number', 'tel', 'url'],
        },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
        placeholder: { control: 'text' },
        disabled: { control: 'boolean' },
        readonly: { control: 'boolean' },
        clearable: { control: 'boolean' },
        copyable: { control: 'boolean' },
        viewable: { control: 'boolean' },
        block: { control: 'boolean' },
    },
    args: {
        type: 'text',
        size: 'md',
        placeholder: 'Enter text...',
        disabled: false,
        readonly: false,
        clearable: false,
        copyable: false,
        viewable: false,
        block: false,
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

export const Sizes: Story = {
    render: () => ({
        components: { Input },
        setup() {
            const sm = ref('');
            const md = ref('');
            const lg = ref('');
            return { sm, md, lg };
        },
        template: `
            <div style="display: flex; gap: 12px; align-items: flex-start;">
                <Input v-model="sm" size="sm" placeholder="Small" />
                <Input v-model="md" size="md" placeholder="Medium" />
                <Input v-model="lg" size="lg" placeholder="Large" />
            </div>
        `,
    }),
};

export const Clearable: Story = {
    render: (args) => ({
        components: { Input },
        setup() {
            const value = ref('Some text');
            return { args, value };
        },
        template: '<Input v-bind="args" v-model="value" clearable />',
    }),
};

export const Password: Story = {
    args: { type: 'password', placeholder: 'Enter password...' },
};

export const PasswordViewable: Story = {
    args: { type: 'password', placeholder: 'Enter password...', viewable: true },
    render: (args) => ({
        components: { Input },
        setup() {
            const value = ref('secret123');
            return { args, value };
        },
        template: '<Input v-bind="args" v-model="value" />',
    }),
};

export const Copyable: Story = {
    render: (args) => ({
        components: { Input },
        setup() {
            const value = ref('Copy this text');
            return { args, value };
        },
        template: '<Input v-bind="args" v-model="value" copyable />',
    }),
};

export const CopyableReadonly: Story = {
    render: (args) => ({
        components: { Input },
        setup() {
            const value = ref('sk_live_abc123xyz');
            return { args, value };
        },
        template: '<Input v-bind="args" v-model="value" copyable readonly />',
    }),
};

export const Disabled: Story = {
    args: { disabled: true, placeholder: 'Disabled' },
};

export const Readonly: Story = {
    render: (args) => ({
        components: { Input },
        setup() {
            const value = ref('Read only content');
            return { args, value };
        },
        template: '<Input v-bind="args" v-model="value" readonly />',
    }),
};

export const Block: Story = {
    args: { block: true },
    render: (args) => ({
        components: { Input },
        setup() {
            const value = ref('');
            return { args, value };
        },
        template: `
            <div style="width: 320px;">
                <Input v-bind="args" v-model="value" placeholder="Full width" />
            </div>
        `,
    }),
};
