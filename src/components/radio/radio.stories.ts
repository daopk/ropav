import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Radio from './radio.vue';
import RadioGroup from './radio-group.vue';

const meta = {
    title: 'Components/Radio',
    component: RadioGroup as any,
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
        disabled: { control: 'boolean' },
        direction: {
            control: 'select',
            options: ['vertical', 'horizontal'],
        },
    },
    args: {
        size: 'md',
        disabled: false,
        direction: 'vertical',
    },
    render: (args) => ({
        components: { Radio, RadioGroup },
        setup() {
            const value = ref('apple');
            return { args, value };
        },
        template: `
            <RadioGroup v-bind="args" v-model="value">
                <Radio value="apple" label="Apple" />
                <Radio value="banana" label="Banana" />
                <Radio value="cherry" label="Cherry" />
            </RadioGroup>
        `,
    }),
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Horizontal: Story = {
    args: { direction: 'horizontal' },
};

export const Sizes: Story = {
    render: () => ({
        components: { Radio, RadioGroup },
        setup() {
            const sm = ref('a');
            const md = ref('a');
            const lg = ref('a');
            return { sm, md, lg };
        },
        template: `
            <div style="display: flex; gap: 32px; align-items: flex-start;">
                <RadioGroup v-model="sm" size="sm">
                    <Radio value="a" label="Small A" />
                    <Radio value="b" label="Small B" />
                </RadioGroup>
                <RadioGroup v-model="md" size="md">
                    <Radio value="a" label="Medium A" />
                    <Radio value="b" label="Medium B" />
                </RadioGroup>
                <RadioGroup v-model="lg" size="lg">
                    <Radio value="a" label="Large A" />
                    <Radio value="b" label="Large B" />
                </RadioGroup>
            </div>
        `,
    }),
};

export const Disabled: Story = {
    args: { disabled: true },
};

export const DisabledOption: Story = {
    render: (args) => ({
        components: { Radio, RadioGroup },
        setup() {
            const value = ref('apple');
            return { args, value };
        },
        template: `
            <RadioGroup v-bind="args" v-model="value">
                <Radio value="apple" label="Apple" />
                <Radio value="banana" label="Banana (unavailable)" disabled />
                <Radio value="cherry" label="Cherry" />
            </RadioGroup>
        `,
    }),
};

export const WithSlots: Story = {
    render: () => ({
        components: { Radio, RadioGroup },
        setup() {
            const plan = ref('pro');
            return { plan };
        },
        template: `
            <RadioGroup v-model="plan">
                <Radio value="free">
                    <div><strong>Free</strong><br /><span style="color: #71717a; font-size: 14px;">Basic features</span></div>
                </Radio>
                <Radio value="pro">
                    <div><strong>Pro</strong><br /><span style="color: #71717a; font-size: 14px;">Advanced features + support</span></div>
                </Radio>
                <Radio value="enterprise">
                    <div><strong>Enterprise</strong><br /><span style="color: #71717a; font-size: 14px;">Custom solutions</span></div>
                </Radio>
            </RadioGroup>
        `,
    }),
};
