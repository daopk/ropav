import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Overlay from './overlay.vue';

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
                    color: var(--rp-color-text-inverted);
                    background:
                        linear-gradient(135deg, rgba(37, 99, 235, 0.92), rgba(5, 150, 105, 0.82)),
                        repeating-linear-gradient(45deg, rgba(255,255,255,0.16) 0 12px, transparent 12px 24px);
                    border-radius: var(--rp-radius-lg);
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
            examples: [
                { label: 'Black', color: '#111827' },
                { label: 'Primary', color: 'var(--rp-color-primary)' },
                { label: 'Danger', color: 'var(--rp-color-danger)' },
                { label: 'Custom', color: '#7c3aed' },
            ],
        }),
        template: `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px;">
                <div
                    v-for="example in examples"
                    :key="example.label"
                    style="
                        position: relative;
                        display: grid;
                        min-height: 128px;
                        place-items: center;
                        overflow: hidden;
                        color: var(--rp-color-text-inverted);
                        background: linear-gradient(135deg, var(--rp-color-success), var(--rp-color-info));
                        border-radius: var(--rp-radius-md);
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
                    color: var(--rp-color-text-inverted);
                    background:
                        linear-gradient(135deg, rgba(249, 115, 22, 0.9), rgba(6, 182, 212, 0.8)),
                        repeating-linear-gradient(45deg, rgba(255,255,255,0.16) 0 12px, transparent 12px 24px);
                    border-radius: var(--rp-radius-lg);
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
                    color: var(--rp-color-text-inverted);
                    background:
                        repeating-linear-gradient(45deg, rgba(255,255,255,0.22) 0 12px, transparent 12px 24px),
                        linear-gradient(135deg, rgba(37, 99, 235, 0.92), rgba(22, 163, 74, 0.82));
                    border-radius: var(--rp-radius-lg);
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
