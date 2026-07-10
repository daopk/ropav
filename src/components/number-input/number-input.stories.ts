import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import NumberInput from './number-input.vue';

const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

const meta = {
    title: 'Components/NumberInput',
    component: NumberInput as any,
    tags: ['autodocs'],
    argTypes: {
        id: { control: 'text' },
        name: { control: 'text' },
        modelValue: { control: 'number' },
        min: { control: 'number' },
        max: { control: 'number' },
        step: { control: 'number' },
        controls: { control: 'boolean' },
        clampOnBlur: { control: 'boolean' },
        incrementLabel: { control: 'text' },
        decrementLabel: { control: 'text' },
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
        required: { control: 'boolean' },
        invalid: { control: 'boolean' },
        valid: { control: 'boolean' },
        ariaLabel: { control: 'text' },
        describedby: { control: 'text' },
        labelledby: { control: 'text' },
        inputAttrs: { control: 'object' },
        validationMessage: { control: 'text' },
    },
    args: {
        id: undefined,
        name: undefined,
        modelValue: 24,
        min: undefined,
        max: undefined,
        step: 1,
        controls: true,
        clampOnBlur: true,
        incrementLabel: 'Increment value',
        decrementLabel: 'Decrement value',
        radius: undefined,
        size: undefined,
        placeholder: 'Enter a number...',
        disabled: false,
        readonly: false,
        required: false,
        invalid: false,
        valid: false,
        ariaLabel: 'Quantity',
        describedby: undefined,
        labelledby: undefined,
        inputAttrs: undefined,
        validationMessage: undefined,
    },
    render: (args) => ({
        components: { NumberInput },
        setup() {
            const value = ref<number | null>(args.modelValue);
            return { args, value };
        },
        template: '<NumberInput v-bind="args" v-model="value" />',
    }),
} satisfies Meta<typeof NumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MinMaxStep: Story = {
    args: {
        modelValue: 25,
        min: 0,
        max: 100,
        step: 5,
    },
};

export const Empty: Story = {
    args: {
        modelValue: null,
    },
};

export const Disabled: Story = {
    args: {
        disabled: true,
    },
};

export const Readonly: Story = {
    args: {
        readonly: true,
    },
};

export const WithoutControls: Story = {
    args: {
        controls: false,
    },
};

export const WithoutClampOnBlur: Story = {
    args: {
        clampOnBlur: false,
        min: 0,
        max: 100,
    },
};

export const ValidationStates: Story = {
    render: (args) => ({
        components: { NumberInput },
        setup: () => ({ args }),
        template: `
            <div style="display: grid; gap: 12px; max-width: 320px;">
                <NumberInput
                    v-bind="{
                        ...args,
                        modelValue: 42,
                        valid: true,
                        invalid: false,
                        ariaLabel: 'Valid quantity',
                    }"
                />
                <NumberInput
                    v-bind="{
                        ...args,
                        modelValue: -1,
                        valid: false,
                        invalid: true,
                        ariaLabel: 'Invalid quantity',
                    }"
                />
            </div>
        `,
    }),
};

export const InputAttributes: Story = {
    args: {
        inputAttrs: {
            autocomplete: 'off',
            inputmode: 'decimal',
        },
        validationMessage: 'Enter a supported quantity.',
    },
};

export const Sizes: Story = {
    render: (args) => ({
        components: { NumberInput },
        setup: () => ({ args, sizes }),
        template: `
            <div style="display: grid; gap: 12px; max-width: 320px;">
                <NumberInput
                    v-for="(size, index) in sizes"
                    :key="size"
                    v-bind="{
                        ...args,
                        size,
                        modelValue: (index + 1) * 10,
                        ariaLabel: size + ' number input',
                    }"
                />
            </div>
        `,
    }),
};

export const Radii: Story = {
    render: (args) => ({
        components: { NumberInput },
        setup: () => ({ args, radii }),
        template: `
            <div style="display: grid; gap: 12px; max-width: 320px;">
                <NumberInput
                    v-for="(radius, index) in radii"
                    :key="radius"
                    v-bind="{
                        ...args,
                        radius,
                        modelValue: (index + 1) * 10,
                        ariaLabel: radius + ' radius number input',
                    }"
                />
            </div>
        `,
    }),
};
