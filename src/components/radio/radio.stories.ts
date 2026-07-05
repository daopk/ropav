import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, within } from 'storybook/test';
import { reactive, ref } from 'vue';
import Radio from './radio.vue';
import RadioGroup from './radio-group.vue';

const colors = ['primary', 'secondary', 'success', 'warning', 'danger', 'info'] as const;
const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const variants = ['solid', 'outline'] as const;

const meta = {
    title: 'Components/Radio',
    component: RadioGroup as any,
    tags: ['autodocs'],
    argTypes: {
        color: {
            control: 'select',
            options: [undefined, ...colors],
        },
        variant: {
            control: 'select',
            options: [undefined, ...variants],
        },
        size: {
            control: 'select',
            options: [undefined, ...sizes],
        },
        disabled: { control: 'boolean' },
    },
    args: {
        modelValue: 'apple',
        disabled: false,
    },
    render: (args) => ({
        components: { Radio, RadioGroup },
        setup() {
            const value = ref('apple');
            return { args, value };
        },
        template: `
            <RadioGroup v-bind="args" v-model="value">
                <Radio value="apple">Apple</Radio>
                <Radio value="banana">Banana</Radio>
                <Radio value="cherry">Cherry</Radio>
            </RadioGroup>
        `,
    }),
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    tags: ['test'],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const apple = canvas.getByRole('radio', { name: 'Apple' });
        const banana = canvas.getByRole('radio', { name: 'Banana' });

        await expect(apple).toBeChecked();
        await expect(banana).not.toBeChecked();

        await userEvent.click(canvas.getByText('Banana'));
        await expect(apple).not.toBeChecked();
        await expect(banana).toBeChecked();
    },
};

export const Variants: Story = {
    render: (args) => ({
        components: { Radio, RadioGroup },
        setup() {
            const values = reactive<Record<string, string>>(
                Object.fromEntries(variants.map((variant) => [variant, 'apple'])),
            );
            return { args, values, variants };
        },
        template: `
            <div style="display: grid; gap: 16px;">
                <RadioGroup v-for="variant in variants" :key="variant" v-bind="args" v-model="values[variant]" :variant="variant">
                    <Radio value="apple">{{ variant }}</Radio>
                    <Radio value="banana">Option</Radio>
                </RadioGroup>
            </div>
        `,
    }),
};

export const Sizes: Story = {
    render: (args) => ({
        components: { Radio, RadioGroup },
        setup() {
            const values = reactive<Record<string, string>>(
                Object.fromEntries(sizes.map((size) => [size, 'apple'])),
            );
            return { args, sizes, values };
        },
        template: `
            <div style="display: grid; gap: 16px;">
                <RadioGroup v-for="size in sizes" :key="size" v-bind="args" v-model="values[size]" :size="size">
                    <Radio value="apple">{{ size }}</Radio>
                    <Radio value="banana">Option</Radio>
                </RadioGroup>
            </div>
        `,
    }),
};

export const Colors: Story = {
    render: (args) => ({
        components: { Radio, RadioGroup },
        setup() {
            const values = reactive<Record<string, string>>(
                Object.fromEntries(colors.map((color) => [color, 'apple'])),
            );
            return { args, colors, values };
        },
        template: `
            <div style="display: grid; gap: 16px;">
                <RadioGroup v-for="color in colors" :key="color" v-bind="args" v-model="values[color]" :color="color">
                    <Radio value="apple">{{ color }}</Radio>
                    <Radio value="banana">Option</Radio>
                </RadioGroup>
            </div>
        `,
    }),
};

export const Disabled: Story = {
    args: { disabled: true },
};

export const DisabledOption: Story = {
    tags: ['test'],
    render: (args) => ({
        components: { Radio, RadioGroup },
        setup() {
            const value = ref('apple');
            return { args, value };
        },
        template: `
            <RadioGroup v-bind="args" v-model="value">
                <Radio value="apple">Apple</Radio>
                <Radio value="banana" disabled>Banana unavailable</Radio>
                <Radio value="cherry">Cherry</Radio>
            </RadioGroup>
        `,
    }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const banana = canvas.getByRole('radio', { name: 'Banana unavailable' });

        await expect(banana).toBeDisabled();
        await expect(banana).not.toBeChecked();
    },
};
