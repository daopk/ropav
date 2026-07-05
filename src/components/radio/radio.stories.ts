import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ref } from 'vue';
import Radio from './radio.vue';
import RadioGroup from './radio-group.vue';

const meta = {
    title: 'Components/Radio',
    component: RadioGroup as any,
    tags: ['autodocs'],
    argTypes: {
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
