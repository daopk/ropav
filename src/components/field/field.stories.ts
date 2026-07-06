import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Input from '../input/input.vue';
import Select from '../select/select.vue';
import Textarea from '../textarea/textarea.vue';
import Field from './field.vue';

const meta = {
    title: 'Components/Field',
    component: Field as any,
    tags: ['autodocs'],
    argTypes: {
        id: { control: 'text' },
        label: { control: 'text' },
        description: { control: 'text' },
        message: { control: 'text' },
        error: { control: 'text' },
        disabled: { control: 'boolean' },
        required: { control: 'boolean' },
        invalid: { control: 'boolean' },
    },
    args: {
        id: 'email',
        label: 'Email',
        description: 'Use the email address you check most often.',
        message: '',
        error: '',
        disabled: false,
        required: false,
        invalid: false,
    },
    render: (args) => ({
        components: { Field, Input },
        setup() {
            const value = ref('');
            return { args, value };
        },
        template: `
            <Field v-bind="args" v-slot="{ controlProps }" style="max-width: 360px;">
                <Input v-bind="controlProps" v-model="value" placeholder="zoi@example.com" />
            </Field>
        `,
    }),
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Required: Story = {
    args: { required: true },
};

export const Invalid: Story = {
    args: {
        error: 'Enter a valid email address.',
    },
};

export const FormControls: Story = {
    render: (args) => ({
        components: { Field, Input, Select, Textarea },
        setup() {
            const email = ref('');
            const role = ref<string | number | null>(null);
            const note = ref('');
            const options = [
                { label: 'Owner', value: 'owner' },
                { label: 'Editor', value: 'editor' },
                { label: 'Viewer', value: 'viewer' },
            ];
            return { args, email, role, note, options };
        },
        template: `
            <div style="display: grid; gap: 16px; max-width: 420px;">
                <Field id="field-email" label="Email" required v-slot="{ controlProps }">
                    <Input v-bind="controlProps" v-model="email" placeholder="zoi@example.com" />
                </Field>

                <Field id="field-role" label="Role" description="Choose the default access level." v-slot="{ controlProps }">
                    <Select v-bind="controlProps" v-model="role" :options="options" placeholder="Select a role" />
                </Field>

                <Field id="field-note" label="Note" message="Keep it short and specific." v-slot="{ controlProps }">
                    <Textarea v-bind="controlProps" v-model="note" placeholder="Add context..." />
                </Field>
            </div>
        `,
    }),
};
