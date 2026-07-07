import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Overlay from './overlay.vue';

const demoImage =
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';

const colorExamples = [
    {
        label: 'Black',
        color: '#111827',
        image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80',
    },
    {
        label: 'Primary',
        color: 'var(--rp-color-primary)',
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    },
    {
        label: 'Danger',
        color: 'var(--rp-color-danger)',
        image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=600&q=80',
    },
    {
        label: 'Custom',
        color: '#7c3aed',
        image: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=600&q=80',
    },
];

const meta = {
    title: 'Components/Overlay',
    component: Overlay as any,
    tags: ['autodocs'],
    argTypes: {
        color: { control: 'color' },
        opacity: {
            control: { type: 'range', min: 0, max: 1, step: 0.05 },
        },
        gradient: { control: 'text' },
        blur: { control: 'text' },
        zIndex: { control: 'number' },
        interactive: { control: 'boolean' },
        disabled: { control: 'boolean' },
    },
    args: {
        color: '#111827',
        opacity: 0.55,
        gradient: '',
        blur: '',
        zIndex: 1,
        interactive: false,
        disabled: false,
    },
} satisfies Meta<typeof Overlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
    render: (args) => ({
        components: { Overlay },
        setup: () => ({ args }),
        template: `
            <div
                style="
                    position: relative;
                    display: grid;
                    min-height: 220px;
                    max-width: 440px;
                    place-items: center;
                    overflow: hidden;
                    color: #fff;
                    background-image: url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80');
                    background-position: center;
                    background-size: cover;
                    border-radius: var(--rp-radius-lg);
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
                "
            >
                <div style="position: relative; z-index: 2; display: grid; gap: 4px; justify-items: center;">
                    <strong style="font-size: var(--rp-font-size-xl);">Overlay target</strong>
                    <span style="font-size: var(--rp-font-size-sm); opacity: 0.9;">Parent content remains in place</span>
                </div>
                <Overlay v-bind="args" />
            </div>
        `,
    }),
};

export const Colors: Story = {
    render: (args) => ({
        components: { Overlay },
        setup: () => ({
            args,
            examples: colorExamples,
        }),
        template: `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px;">
                <div
                    v-for="example in examples"
                    :key="example.label"
                    :style="{ backgroundImage: 'url(' + example.image + ')' }"
                    style="
                        position: relative;
                        display: grid;
                        min-height: 128px;
                        place-items: center;
                        overflow: hidden;
                        color: #fff;
                        background-position: center;
                        background-size: cover;
                        border-radius: var(--rp-radius-md);
                        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
                    "
                >
                    <span style="position: relative; z-index: 2; font-weight: var(--rp-font-weight-semibold);">
                        {{ example.label }}
                    </span>
                    <Overlay v-bind="args" :color="example.color" />
                </div>
            </div>
        `,
    }),
};

export const Gradient: Story = {
    args: {
        color: '#111827',
        opacity: 0.2,
        blur: '',
        gradient: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7), rgba(14, 165, 233, 0.35))',
    },
    render: (args) => ({
        components: { Overlay },
        setup: () => ({ args, demoImage }),
        template: `
            <div
                :style="{ backgroundImage: 'url(' + demoImage + ')' }"
                style="
                    position: relative;
                    display: grid;
                    min-height: 220px;
                    max-width: 440px;
                    place-items: center;
                    overflow: hidden;
                    color: #fff;
                    background-position: center;
                    background-size: cover;
                    border-radius: var(--rp-radius-lg);
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
                "
            >
                <div style="position: relative; z-index: 2; display: grid; gap: 4px; justify-items: center;">
                    <strong style="font-size: var(--rp-font-size-xl);">Gradient overlay</strong>
                    <span style="font-size: var(--rp-font-size-sm); opacity: 0.9;">Gradient ignores color and opacity props</span>
                </div>
                <Overlay v-bind="args" />
            </div>
        `,
    }),
};

export const Blur: Story = {
    args: {
        color: 'rgba(17, 24, 39, 0.2)',
        opacity: 1,
        blur: '10px',
    },
    render: (args) => ({
        components: { Overlay },
        setup: () => ({ args, demoImage }),
        template: `
            <div
                :style="{ backgroundImage: 'url(' + demoImage + ')' }"
                style="
                    position: relative;
                    display: grid;
                    min-height: 220px;
                    max-width: 440px;
                    place-items: center;
                    overflow: hidden;
                    color: #fff;
                    background-position: center;
                    background-size: cover;
                    border-radius: var(--rp-radius-lg);
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
                "
            >
                <div style="position: relative; z-index: 2; display: grid; gap: 4px; justify-items: center;">
                    <strong style="font-size: var(--rp-font-size-xl);">Blur overlay</strong>
                    <span style="font-size: var(--rp-font-size-sm); opacity: 0.9;">Backdrop content is softened behind the layer</span>
                </div>
                <Overlay v-bind="args" />
            </div>
        `,
    }),
};
