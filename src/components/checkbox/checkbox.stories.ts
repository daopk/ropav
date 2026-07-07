import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, within } from 'storybook/test';
import { reactive, ref } from 'vue';
import Checkbox from './checkbox.vue';

const colors = ['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'neutral'] as const;
const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const variants = ['solid', 'outline'] as const;

const meta = {
    title: 'Components/Checkbox',
    component: Checkbox as any,
    tags: ['autodocs'],
    argTypes: {
        color: {
            control: 'text',
        },
        variant: {
            control: 'select',
            options: [undefined, ...variants],
        },
        size: {
            control: 'select',
            options: [undefined, ...sizes],
        },
        radius: {
            control: 'select',
            options: [undefined, ...radii],
        },
        disabled: { control: 'boolean' },
        indeterminate: { control: 'boolean' },
    },
    args: {
        modelValue: false,
        disabled: false,
        indeterminate: false,
    },
    render: (args) => ({
        components: { Checkbox },
        setup() {
            const checked = ref(false);
            return { args, checked };
        },
        template: '<Checkbox v-bind="args" v-model="checked">Accept terms</Checkbox>',
    }),
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    tags: ['test'],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const checkbox = canvas.getByRole('checkbox', { name: 'Accept terms' });

        await expect(checkbox).not.toBeChecked();
        await userEvent.click(canvas.getByText('Accept terms'));
        await expect(checkbox).toBeChecked();
        await expect(checkbox).toHaveAttribute('aria-checked', 'true');
    },
};

export const Checked: Story = {
    render: (args) => ({
        components: { Checkbox },
        setup() {
            const checked = ref(true);
            return { args, checked };
        },
        template: '<Checkbox v-bind="args" v-model="checked">Checked</Checkbox>',
    }),
};

export const Variants: Story = {
    render: (args) => ({
        components: { Checkbox },
        setup() {
            const checked = reactive<Record<string, boolean>>(
                Object.fromEntries(variants.map((variant) => [variant, true])),
            );
            return { args, checked, variants };
        },
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <Checkbox v-for="variant in variants" :key="variant" v-bind="args" v-model="checked[variant]" :variant="variant">
                    {{ variant }}
                </Checkbox>
            </div>
        `,
    }),
};

export const Sizes: Story = {
    render: (args) => ({
        components: { Checkbox },
        setup() {
            const checked = reactive<Record<string, boolean>>(
                Object.fromEntries(sizes.map((size) => [size, true])),
            );
            return { args, checked, sizes };
        },
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <Checkbox v-for="size in sizes" :key="size" v-bind="args" v-model="checked[size]" :size="size">
                    {{ size }}
                </Checkbox>
            </div>
        `,
    }),
};

export const Radii: Story = {
    render: (args) => ({
        components: { Checkbox },
        setup() {
            const checked = reactive<Record<string, boolean>>(
                Object.fromEntries(radii.map((radius) => [radius, true])),
            );
            return { args, checked, radii };
        },
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <Checkbox v-for="radius in radii" :key="radius" v-bind="args" v-model="checked[radius]" :radius="radius">
                    {{ radius }}
                </Checkbox>
            </div>
        `,
    }),
};

export const Colors: Story = {
    render: (args) => ({
        components: { Checkbox },
        setup() {
            const checked = reactive<Record<string, boolean>>(
                Object.fromEntries(colors.map((color) => [color, true])),
            );
            return { args, checked, colors };
        },
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <Checkbox v-for="color in colors" :key="color" v-bind="args" v-model="checked[color]" :color="color">
                    {{ color }}
                </Checkbox>
            </div>
        `,
    }),
};

export const CustomColor: Story = {
    args: {
        color: '#ff3366',
        modelValue: true,
    },
};

export const Indeterminate: Story = {
    args: { indeterminate: true },
};

export const Disabled: Story = {
    tags: ['test'],
    args: { disabled: true },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const checkbox = canvas.getByRole('checkbox', { name: 'Accept terms' });

        await expect(checkbox).toBeDisabled();
        await expect(checkbox).not.toBeChecked();
    },
};
