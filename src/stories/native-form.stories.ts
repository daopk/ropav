import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Checkbox from '../components/checkbox/checkbox.vue';
import ColorInput from '../components/color-input/color-input.vue';
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
                <Input name="title" default-value="Draft" placeholder="Title" required />
                <Textarea name="notes" default-value="Initial notes" />
                <NumberInput name="quantity" :default-value="2" :min="0" />
                <ColorInput name="color" default-value="#4992d1" :with-eye-dropper="false" />
                <Checkbox name="terms" value="accepted" :default-value="true">
                    Accept terms
                </Checkbox>
                <Switch name="alerts" value="enabled" :default-value="false">
                    Enable alerts
                </Switch>
                <RadioGroup name="fruit" default-value="banana" required>
                    <Radio value="apple">Apple</Radio>
                    <Radio value="banana">Banana</Radio>
                </RadioGroup>
                <Slider name="volume" :default-value="35">Volume</Slider>
                <RangeSlider
                    :name="['priceFrom', 'priceTo']"
                    :default-value="[20, 80]"
                >
                    Price range
                </RangeSlider>
                <Select
                    name="selection"
                    default-value="apple"
                    :options="options"
                    required
                />
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

export const UncontrolledValuesAndReset: Story = {};

export const ControlledValues: Story = {
    render: () => ({
        components: { Input, Slider },
        setup() {
            const title = ref('Controlled title');
            const volume = ref(45);
            return { title, volume };
        },
        template: `
            <form style="display: grid; gap: 16px; max-width: 420px;">
                <Input v-model="title" name="title" default-value="Initial title" />
                <Slider v-model="volume" name="volume" :default-value="20">
                    Controlled volume
                </Slider>
                <div>Model: {{ title }} / {{ volume }}</div>
                <button type="reset">Native reset keeps controlled models authoritative</button>
            </form>
        `,
    }),
};
