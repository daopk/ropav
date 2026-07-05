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
        placeholder: { control: 'text' },
        disabled: { control: 'boolean' },
        readonly: { control: 'boolean' },
        invalid: { control: 'boolean' },
    },
    args: {
        modelValue: '',
        type: 'text',
        placeholder: 'Enter text...',
        disabled: false,
        readonly: false,
        invalid: false,
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
