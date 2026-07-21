import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, within } from 'storybook/test';
import { ref } from 'vue';
import Checkbox from '../components/checkbox/checkbox.vue';
import ColorInput from '../components/color-input/color-input.vue';
import Field from '../components/field/field.vue';
import Input from '../components/input/input.vue';
import NumberInput from '../components/number-input/number-input.vue';
import Radio from '../components/radio/radio.vue';
import RadioGroup from '../components/radio/radio-group.vue';
import Select from '../components/select/select.vue';
import RangeSlider from '../components/slider/range-slider.vue';
import Slider from '../components/slider/slider.vue';
import Switch from '../components/switch/switch.vue';
import Textarea from '../components/textarea/textarea.vue';

const meta = {
    title: 'Contracts/Native form',
    render: () => ({
        components: {
            Checkbox,
            ColorInput,
            Field,
            Input,
            NumberInput,
            Radio,
            RadioGroup,
            RangeSlider,
            Select,
            Slider,
            Switch,
            Textarea,
        },
        setup() {
            const submission = ref('Submit the form to inspect FormData.');
            const options = [
                { label: 'Apple', value: 'apple' },
                { label: 'Banana', value: 'banana' },
            ];

            function submit(event: Event) {
                const form = event.currentTarget as HTMLFormElement;
                submission.value = JSON.stringify(Object.fromEntries(new FormData(form)), null, 2);
            }

            return { options, submission, submit };
        },
        template: `
            <form
                style="display: grid; gap: 16px; max-width: 520px;"
                @submit.prevent="submit"
            >
                <Field id="native-title" label="Title" required v-slot="{ controlProps }">
                    <Input
                        v-bind="controlProps"
                        name="title"
                        default-value="Draft"
                        placeholder="Draft title"
                    />
                </Field>
                <Field id="native-notes" label="Notes" v-slot="{ controlProps }">
                    <Textarea v-bind="controlProps" name="notes" default-value="Initial notes" />
                </Field>
                <Field id="native-quantity" label="Quantity" v-slot="{ controlProps }">
                    <NumberInput v-bind="controlProps" name="quantity" :default-value="2" :min="0" />
                </Field>
                <Field id="native-color" label="Color" v-slot="{ controlProps }">
                    <ColorInput
                        v-bind="controlProps"
                        name="color"
                        default-value="#4992d1"
                        :with-eye-dropper="false"
                    />
                </Field>
                <Checkbox name="terms" value="accepted" :default-value="true">
                    Accept terms
                </Checkbox>
                <Switch name="alerts" value="enabled" :default-value="false">
                    Enable alerts
                </Switch>
                <Field id="native-fruit" label="Fruit" required v-slot="{ controlProps }">
                    <RadioGroup v-bind="controlProps" name="fruit" default-value="banana">
                        <Radio value="apple">Apple</Radio>
                        <Radio value="banana">Banana</Radio>
                    </RadioGroup>
                </Field>
                <Slider name="volume" :default-value="35" aria-label="Volume">Volume</Slider>
                <RangeSlider
                    :name="['priceFrom', 'priceTo']"
                    :default-value="[20, 80]"
                >
                    Price range
                </RangeSlider>
                <Field id="native-selection" label="Selection" required v-slot="{ controlProps }">
                    <Select
                        v-bind="controlProps"
                        labelledby="native-selection-label"
                        name="selection"
                        default-value="apple"
                        :options="options"
                    />
                </Field>
                <div style="display: flex; gap: 8px;">
                    <button type="submit">Submit</button>
                    <button type="reset">Reset</button>
                </div>
                <pre style="white-space: pre-wrap;">{{ submission }}</pre>
            </form>
        `,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const UncontrolledValuesAndReset: Story = {
    tags: ['test'],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await expect(canvas.getByRole('textbox', { name: 'Title' })).toBeInTheDocument();
        await expect(canvas.getByRole('textbox', { name: 'Notes' })).toBeInTheDocument();
        await expect(canvas.getByRole('spinbutton', { name: 'Quantity' })).toBeInTheDocument();
        await expect(canvas.getByRole('combobox', { name: 'Color' })).toBeInTheDocument();
        await expect(canvas.getByRole('radiogroup', { name: 'Fruit' })).toBeInTheDocument();
        await expect(canvas.getByRole('slider', { name: 'Volume' })).toBeInTheDocument();
        await expect(canvas.getByRole('combobox', { name: 'Selection' })).toBeInTheDocument();
    },
};

export const ControlledValues: Story = {
    render: () => ({
        components: { Field, Input, Slider },
        setup() {
            const title = ref('Controlled title');
            const volume = ref(45);
            return { title, volume };
        },
        template: `
            <form style="display: grid; gap: 16px; max-width: 420px;">
                <Field id="controlled-title" label="Title" v-slot="{ controlProps }">
                    <Input
                        v-bind="controlProps"
                        v-model="title"
                        name="title"
                        default-value="Initial title"
                    />
                </Field>
                <Slider
                    v-model="volume"
                    name="volume"
                    :default-value="20"
                    aria-label="Controlled volume"
                >
                    Controlled volume
                </Slider>
                <div>Model: {{ title }} / {{ volume }}</div>
                <button type="reset">Native reset keeps controlled models authoritative</button>
            </form>
        `,
    }),
};
