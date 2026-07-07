import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Checkbox from '../checkbox/checkbox.vue';
import Input from '../input/input.vue';
import RadioGroup from '../radio/radio-group.vue';
import Radio from '../radio/radio.vue';
import Select from '../select/select.vue';
import Switch from '../switch/switch.vue';
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
        disabled: { control: 'boolean' },
        required: { control: 'boolean' },
        invalid: { control: 'boolean' },
    },
    args: {
        id: 'email',
        label: 'Email',
        description: 'Use the email address you check most often.',
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
        invalid: true,
    },
    render: (args) => ({
        components: { Field, Input },
        setup() {
            const value = ref('not-an-email');
            return { args, value };
        },
        template: `
            <Field v-bind="args" style="max-width: 360px;">
                <template #default="{ controlProps }">
                    <Input v-bind="controlProps" v-model="value" placeholder="zoi@example.com" />
                </template>
                <template #message>
                    <p style="margin: 0; color: var(--rp-color-danger); font-size: var(--rp-font-size-sm); line-height: var(--rp-line-height-normal);">
                        Enter a valid email address.
                    </p>
                </template>
            </Field>
        `,
    }),
};

export const FormControls: Story = {
    render: (args) => ({
        components: { Checkbox, Field, Input, Radio, RadioGroup, Select, Switch, Textarea },
        setup() {
            const email = ref('');
            const role = ref<string | number | null>(null);
            const note = ref('');
            const plan = ref<string | number | null>('pro');
            const updates = ref(true);
            const notifications = ref(false);
            const options = [
                { label: 'Owner', value: 'owner' },
                { label: 'Editor', value: 'editor' },
                { label: 'Viewer', value: 'viewer' },
            ];
            return { args, email, role, note, plan, updates, notifications, options };
        },
        template: `
            <div style="display: grid; gap: 16px; max-width: 420px;">
                <Field id="field-email" label="Email" required v-slot="{ controlProps }">
                    <Input v-bind="controlProps" v-model="email" placeholder="zoi@example.com" />
                </Field>

                <Field id="field-role" label="Role" description="Choose the default access level." v-slot="{ controlProps }">
                    <Select v-bind="controlProps" v-model="role" :options="options" placeholder="Select a role" />
                </Field>

                <Field id="field-note" label="Note">
                    <template #default="{ controlProps }">
                        <Textarea v-bind="controlProps" v-model="note" placeholder="Add context..." />
                    </template>
                    <template #message>
                        <p style="margin: 0; color: var(--rp-color-text-secondary); font-size: var(--rp-font-size-sm); line-height: var(--rp-line-height-normal);">
                            Keep it short and specific.
                        </p>
                    </template>
                </Field>

                <Field id="field-plan" label="Plan" description="Pick the billing tier for this workspace." v-slot="{ controlProps }">
                    <RadioGroup v-bind="controlProps" v-model="plan">
                        <Radio value="starter">Starter</Radio>
                        <Radio value="pro">Pro</Radio>
                        <Radio value="enterprise">Enterprise</Radio>
                    </RadioGroup>
                </Field>

                <Field id="field-updates" label="Product updates">
                    <template #default="{ controlProps }">
                        <Checkbox v-bind="controlProps" v-model="updates">
                            Send weekly product updates
                        </Checkbox>
                    </template>
                    <template #message>
                        <p style="margin: 0; color: var(--rp-color-text-secondary); font-size: var(--rp-font-size-sm); line-height: var(--rp-line-height-normal);">
                            You can unsubscribe at any time.
                        </p>
                    </template>
                </Field>

                <Field id="field-notifications" label="Notifications" description="Notify members when their access changes." v-slot="{ controlProps }">
                    <Switch v-bind="controlProps" v-model="notifications">
                        Access change alerts
                    </Switch>
                </Field>
            </div>
        `,
    }),
};
