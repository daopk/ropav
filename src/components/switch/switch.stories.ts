import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, within } from 'storybook/test';
import { reactive, ref } from 'vue';
import Switch from './switch.vue';

const colors = ['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'neutral'] as const;
const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

const meta = {
    title: 'Components/Switch',
    component: Switch as any,
    tags: ['autodocs'],
    argTypes: {
        color: {
            control: 'select',
            options: [undefined, ...colors],
        },
        size: {
            control: 'select',
            options: [undefined, ...sizes],
        },
        disabled: { control: 'boolean' },
    },
    args: {
        modelValue: false,
        disabled: false,
    },
    render: (args) => ({
        components: { Switch },
        setup() {
            const value = ref(false);
            return { args, value };
        },
        template: '<Switch v-bind="args" v-model="value">Dark mode</Switch>',
    }),
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    tags: ['test'],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const control = canvas.getByRole('switch', { name: 'Dark mode' });

        await expect(control).not.toBeChecked();
        await userEvent.click(canvas.getByText('Dark mode'));
        await expect(control).toBeChecked();
    },
};

export const On: Story = {
    render: (args) => ({
        components: { Switch },
        setup() {
            const value = ref(true);
            return { args, value };
        },
        template: '<Switch v-bind="args" v-model="value">Enabled</Switch>',
    }),
};

export const Sizes: Story = {
    render: (args) => ({
        components: { Switch },
        setup() {
            const checked = reactive<Record<string, boolean>>(
                Object.fromEntries(sizes.map((size) => [size, true])),
            );
            return { args, checked, sizes };
        },
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <Switch v-for="size in sizes" :key="size" v-bind="args" v-model="checked[size]" :size="size">
                    {{ size }}
                </Switch>
            </div>
        `,
    }),
};

export const Colors: Story = {
    render: (args) => ({
        components: { Switch },
        setup() {
            const checked = reactive<Record<string, boolean>>(
                Object.fromEntries(colors.map((color) => [color, true])),
            );
            return { args, checked, colors };
        },
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <Switch v-for="color in colors" :key="color" v-bind="args" v-model="checked[color]" :color="color">
                    {{ color }}
                </Switch>
            </div>
        `,
    }),
};

export const Disabled: Story = {
    tags: ['test'],
    args: { disabled: true },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const control = canvas.getByRole('switch', { name: 'Dark mode' });

        await expect(control).toBeDisabled();
        await expect(control).not.toBeChecked();
    },
};
