import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor, within } from 'storybook/test';
import { ref } from 'vue';
import IconCircleCheck from '~icons/lucide/circle-check';
import IconSearch from '~icons/lucide/search';
import Field from '../field/field.vue';
import Input from './input.vue';

const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

const meta = {
    title: 'Components/Input',
    component: Input as any,
    tags: ['autodocs'],
    argTypes: {
        type: {
            control: 'select',
            options: ['text', 'password', 'email', 'number', 'tel', 'url'],
        },
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
        invalid: { control: 'boolean' },
        valid: { control: 'boolean' },
    },
    args: {
        modelValue: '',
        type: 'text',
        radius: undefined,
        size: undefined,
        placeholder: 'Enter text...',
        disabled: false,
        readonly: false,
        invalid: false,
        valid: false,
    },
    render: (args) => ({
        components: { Field, Input },
        setup() {
            const value = ref(args.modelValue ?? '');
            return { args, value };
        },
        template: `
            <Field id="input-default" label="Text input" v-slot="{ controlProps }" style="max-width: 320px;">
                <Input v-bind="{ ...controlProps, ...args }" v-model="value" />
            </Field>
        `,
    }),
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    tags: ['test'],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('textbox', { name: 'Text input' })).toBeInTheDocument();
    },
};

export const Disabled: Story = {
    args: { disabled: true },
};

export const ValidationStates: Story = {
    tags: ['test'],
    render: () => ({
        components: { Input },
        template: `
            <div data-validation-states style="display: grid; gap: 12px; max-width: 320px;">
                <Input aria-label="Valid input" model-value="Valid value" valid />
                <Input aria-label="Invalid input" model-value="Invalid value" invalid />
            </div>
        `,
    }),
    play: async ({ canvasElement }) => {
        const validationStates = canvasElement.querySelector<HTMLElement>(
            '[data-validation-states]',
        )!;
        const darkValidationStates = validationStates.cloneNode(true) as HTMLElement;

        darkValidationStates.removeAttribute('data-validation-states');
        darkValidationStates.setAttribute('data-rp-color-scheme', 'dark');
        darkValidationStates.setAttribute('aria-hidden', 'true');
        darkValidationStates.style.position = 'absolute';
        darkValidationStates.style.visibility = 'hidden';
        darkValidationStates.style.pointerEvents = 'none';
        canvasElement.append(darkValidationStates);

        const valid = darkValidationStates.querySelector<HTMLElement>('.rp-input--valid')!;
        const invalid = darkValidationStates.querySelector<HTMLElement>('.rp-input--invalid')!;

        try {
            await waitFor(() => {
                const validStyle = getComputedStyle(valid);
                const invalidStyle = getComputedStyle(invalid);

                expect(validStyle.getPropertyValue('--_rp-input-valid-border').trim()).toBe(
                    validStyle.getPropertyValue('--rp-color-green-outline').trim(),
                );
                expect(validStyle.borderColor).toBe('rgb(105, 219, 124)');
                expect(invalidStyle.getPropertyValue('--_rp-input-invalid-border').trim()).toBe(
                    invalidStyle.getPropertyValue('--rp-color-red-outline').trim(),
                );
                expect(invalidStyle.borderColor).toBe('rgb(255, 135, 135)');
            });
        } finally {
            darkValidationStates.remove();
        }
    },
};

export const Slots: Story = {
    render: (args) => ({
        components: { Field, IconCircleCheck, IconSearch, Input },
        setup: () => ({ args }),
        template: `
            <div style="display: grid; gap: 12px; max-width: 320px;">
                <Field id="input-search" label="Search" v-slot="{ controlProps }">
                    <Input v-bind="{ ...controlProps, ...args }" model-value="" placeholder="Search">
                        <template #left>
                            <IconSearch aria-hidden="true" />
                        </template>
                    </Input>
                </Field>
                <Field id="input-email" label="Email" v-slot="{ controlProps }">
                    <Input v-bind="{ ...controlProps, ...args }" model-value="zoi@example.com">
                        <template #right>
                            <IconCircleCheck aria-hidden="true" />
                        </template>
                    </Input>
                </Field>
            </div>
        `,
    }),
};

export const Sizes: Story = {
    render: (args) => ({
        components: { Input },
        setup: () => ({ args, sizes }),
        template: `
            <div style="display: grid; gap: 12px; max-width: 320px;">
                <Input
                    v-for="size in sizes"
                    :key="size"
                    v-bind="args"
                    :aria-label="'Input size ' + size"
                    :size="size"
                    :model-value="size"
                />
            </div>
        `,
    }),
};

export const Radii: Story = {
    render: (args) => ({
        components: { Input },
        setup: () => ({ args, radii }),
        template: `
            <div style="display: grid; gap: 12px; max-width: 320px;">
                <Input
                    v-for="radius in radii"
                    :key="radius"
                    v-bind="args"
                    :aria-label="'Input radius ' + radius"
                    :radius="radius"
                    :model-value="radius"
                />
            </div>
        `,
    }),
};
