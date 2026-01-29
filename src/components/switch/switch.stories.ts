import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Switch from './switch.vue';

const meta = {
    title: 'Components/Switch',
    component: Switch as any,
    tags: ['autodocs'],
    argTypes: {
        label: { control: 'text' },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
        disabled: { control: 'boolean' },
    },
    args: {
        label: 'Dark mode',
        size: 'md',
        disabled: false,
    },
    render: (args) => ({
        components: { Switch },
        setup() {
            const value = ref(false);
            return { args, value };
        },
        template: '<Switch v-bind="args" v-model="value" />',
    }),
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const On: Story = {
    render: (args) => ({
        components: { Switch },
        setup() {
            const value = ref(true);
            return { args, value };
        },
        template: '<Switch v-bind="args" v-model="value" label="Enabled" />',
    }),
};

export const Sizes: Story = {
    render: () => ({
        components: { Switch },
        setup() {
            const sm = ref(true);
            const md = ref(true);
            const lg = ref(true);
            return { sm, md, lg };
        },
        template: `
            <div style="display: flex; gap: 16px; align-items: center;">
                <Switch v-model="sm" size="sm" label="Small" />
                <Switch v-model="md" size="md" label="Medium" />
                <Switch v-model="lg" size="lg" label="Large" />
            </div>
        `,
    }),
};

export const Disabled: Story = {
    args: { disabled: true },
};

export const Group: Story = {
    render: () => ({
        components: { Switch },
        setup() {
            const wifi = ref(true);
            const bluetooth = ref(false);
            const airplane = ref(false);
            return { wifi, bluetooth, airplane };
        },
        template: `
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <Switch v-model="wifi" label="Wi-Fi" />
                <Switch v-model="bluetooth" label="Bluetooth" />
                <Switch v-model="airplane" label="Airplane mode" />
            </div>
        `,
    }),
};
