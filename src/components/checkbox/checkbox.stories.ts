import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Checkbox from './checkbox.vue';

const meta = {
    title: 'Components/Checkbox',
    component: Checkbox as any,
    tags: ['autodocs'],
    argTypes: {
        label: { control: 'text' },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
        disabled: { control: 'boolean' },
        indeterminate: { control: 'boolean' },
    },
    args: {
        label: 'Accept terms',
        size: 'md',
        disabled: false,
        indeterminate: false,
    },
    render: (args) => ({
        components: { Checkbox },
        setup() {
            const checked = ref(false);
            return { args, checked };
        },
        template: '<Checkbox v-bind="args" v-model="checked" />',
    }),
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
    render: (args) => ({
        components: { Checkbox },
        setup() {
            const checked = ref(true);
            return { args, checked };
        },
        template: '<Checkbox v-bind="args" v-model="checked" label="Checked" />',
    }),
};

export const Indeterminate: Story = {
    args: { indeterminate: true, label: 'Select all' },
};

export const Sizes: Story = {
    render: () => ({
        components: { Checkbox },
        setup() {
            const sm = ref(true);
            const md = ref(true);
            const lg = ref(true);
            return { sm, md, lg };
        },
        template: `
            <div style="display: flex; gap: 16px; align-items: center;">
                <Checkbox v-model="sm" size="sm" label="Small" />
                <Checkbox v-model="md" size="md" label="Medium" />
                <Checkbox v-model="lg" size="lg" label="Large" />
            </div>
        `,
    }),
};

export const Disabled: Story = {
    args: { disabled: true, label: 'Disabled' },
};

export const Group: Story = {
    render: () => ({
        components: { Checkbox },
        setup() {
            const a = ref(true);
            const b = ref(false);
            const c = ref(true);
            return { a, b, c };
        },
        template: `
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <Checkbox v-model="a" label="Email notifications" />
                <Checkbox v-model="b" label="SMS notifications" />
                <Checkbox v-model="c" label="Push notifications" />
            </div>
        `,
    }),
};
