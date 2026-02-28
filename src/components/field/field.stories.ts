import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Field from './field.vue';
import Input from '../input/input.vue';

const meta = {
    title: 'Components/Field',
    component: Field as any,
    tags: ['autodocs'],
    argTypes: {
        label: { control: 'text' },
        description: { control: 'text' },
        error: { control: 'text' },
        success: { control: 'text' },
        required: { control: 'boolean' },
        disabled: { control: 'boolean' },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
    },
    args: {
        label: 'Email',
        description: '',
        error: '',
        success: '',
        required: false,
        disabled: false,
        size: 'md',
    },
    render: (args) => ({
        components: { Field, Input },
        setup() {
            const value = ref('');
            return { args, value };
        },
        template: `
            <div style="max-width: 320px;">
                <Field v-bind="args">
                    <Input v-model="value" placeholder="you@example.com" block />
                </Field>
            </div>
        `,
    }),
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDescription: Story = {
    args: {
        label: 'Password',
        description: 'Must be at least 8 characters long.',
    },
    render: (args) => ({
        components: { Field, Input },
        setup() {
            const value = ref('');
            return { args, value };
        },
        template: `
            <div style="max-width: 320px;">
                <Field v-bind="args">
                    <Input v-model="value" type="password" placeholder="Enter password" viewable block />
                </Field>
            </div>
        `,
    }),
};

export const Required: Story = {
    args: {
        label: 'Username',
        required: true,
    },
    render: (args) => ({
        components: { Field, Input },
        setup() {
            const value = ref('');
            return { args, value };
        },
        template: `
            <div style="max-width: 320px;">
                <Field v-bind="args">
                    <Input v-model="value" placeholder="Choose a username" block />
                </Field>
            </div>
        `,
    }),
};

export const ErrorState: Story = {
    args: {
        label: 'Email',
        error: 'Please enter a valid email address.',
        required: true,
    },
    render: (args) => ({
        components: { Field, Input },
        setup() {
            const value = ref('invalid-email');
            return { args, value };
        },
        template: `
            <div style="max-width: 320px;">
                <Field v-bind="args">
                    <Input v-model="value" placeholder="you@example.com" block />
                </Field>
            </div>
        `,
    }),
};

export const SuccessState: Story = {
    args: {
        label: 'Email',
        success: 'Email is available!',
    },
    render: (args) => ({
        components: { Field, Input },
        setup() {
            const value = ref('user@example.com');
            return { args, value };
        },
        template: `
            <div style="max-width: 320px;">
                <Field v-bind="args">
                    <Input v-model="value" placeholder="you@example.com" block />
                </Field>
            </div>
        `,
    }),
};

export const Disabled: Story = {
    args: {
        label: 'Email',
        description: 'Contact your admin to change this.',
        disabled: true,
    },
    render: (args) => ({
        components: { Field, Input },
        setup() {
            const value = ref('locked@example.com');
            return { args, value };
        },
        template: `
            <div style="max-width: 320px;">
                <Field v-bind="args">
                    <Input v-model="value" disabled block />
                </Field>
            </div>
        `,
    }),
};

export const Sizes: Story = {
    render: () => ({
        components: { Field, Input },
        setup() {
            const sm = ref('');
            const md = ref('');
            const lg = ref('');
            return { sm, md, lg };
        },
        template: `
            <div style="display: grid; grid-template-columns: repeat(3, 200px); gap: 24px;">
                <Field label="Small" description="Size sm" size="sm">
                    <Input v-model="sm" size="sm" placeholder="Small" block />
                </Field>
                <Field label="Medium" description="Size md" size="md">
                    <Input v-model="md" size="md" placeholder="Medium" block />
                </Field>
                <Field label="Large" description="Size lg" size="lg">
                    <Input v-model="lg" size="lg" placeholder="Large" block />
                </Field>
            </div>
        `,
    }),
};

export const FullExample: Story = {
    args: {
        label: 'Display name',
        description: 'This is how others will see you on the site.',
        required: true,
        error: 'Display name must be at least 2 characters.',
    },
    render: (args) => ({
        components: { Field, Input },
        setup() {
            const value = ref('J');
            return { args, value };
        },
        template: `
            <div style="width: 320px;">
                <Field v-bind="args">
                    <Input v-model="value" placeholder="Your name" block />
                </Field>
            </div>
        `,
    }),
};
