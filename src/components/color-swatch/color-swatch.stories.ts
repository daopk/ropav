import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IconCheck from '~icons/lucide/check';
import ColorSwatch from './color-swatch.vue';

const palette = ['#fa5252', '#fd7e14', '#fab005', '#40c057', '#228be6', '#7950f2'];
const storyWrapperStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '12px',
};

const meta = {
    title: 'Components/ColorSwatch',
    component: ColorSwatch as any,
    tags: ['autodocs'],
    argTypes: {
        color: { control: 'text' },
        size: { control: 'text' },
        ariaLabel: { control: 'text' },
    },
    args: {
        color: '#4992d1',
        size: 32,
    },
    render: (args) => ({
        components: { ColorSwatch },
        setup() {
            return { args };
        },
        template: '<ColorSwatch v-bind="args" />',
    }),
} satisfies Meta<typeof ColorSwatch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Palette: Story = {
    render: (args) => ({
        components: { ColorSwatch },
        setup() {
            return { args, palette, storyWrapperStyle };
        },
        template: `
            <div :style="storyWrapperStyle">
                <ColorSwatch
                    v-for="color in palette"
                    :key="color"
                    v-bind="args"
                    :color="color"
                    :aria-label="color"
                />
            </div>
        `,
    }),
};

export const WithOpacity: Story = {
    args: {
        color: 'rgba(73, 146, 209, 0.55)',
    },
};

export const WithIcon: Story = {
    render: (args) => ({
        components: { ColorSwatch, IconCheck },
        setup() {
            return { args, palette, storyWrapperStyle };
        },
        template: `
            <div :style="storyWrapperStyle">
                <ColorSwatch
                    v-for="color in palette"
                    :key="color"
                    v-bind="args"
                    :color="color"
                    :aria-label="\`Selected \${color}\`"
                >
                    <IconCheck aria-hidden="true" />
                </ColorSwatch>
            </div>
        `,
    }),
};
