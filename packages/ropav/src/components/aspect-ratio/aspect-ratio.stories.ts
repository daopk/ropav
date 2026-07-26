import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import AspectRatio from './aspect-ratio.vue';

const imageUrl =
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';

const ratioExamples = [
    { label: 'Square · 1:1', ratio: 1 },
    { label: 'Landscape · 4:3', ratio: 4 / 3 },
    { label: 'Widescreen · 16:9', ratio: 16 / 9 },
    { label: 'Portrait · 3:4', ratio: 3 / 4 },
];

const meta = {
    title: 'Components/AspectRatio',
    component: AspectRatio as any,
    tags: ['autodocs'],
    argTypes: {
        ratio: {
            control: { type: 'number', min: 0.1, step: 0.1 },
            description: 'Width divided by height.',
        },
    },
    args: {
        ratio: 16 / 9,
    },
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
    tags: ['test'],
    render: (args) => ({
        components: { AspectRatio },
        setup: () => ({ args, imageUrl }),
        template: `
            <AspectRatio
                v-bind="args"
                style="max-width: 640px; overflow: hidden; border-radius: var(--rp-radius-lg);"
            >
                <img :src="imageUrl" alt="Mountains reflected in a lake" />
            </AspectRatio>
        `,
    }),
    play: ({ canvasElement }) => {
        const root = canvasElement.querySelector<HTMLElement>('.rp-aspect-ratio')!;
        const image = root.querySelector<HTMLImageElement>('img')!;
        const rootRect = root.getBoundingClientRect();
        const imageRect = image.getBoundingClientRect();

        expect(rootRect.width).toBeGreaterThan(0);
        expect(Math.abs(rootRect.width / rootRect.height - 16 / 9)).toBeLessThan(0.01);
        expect(Math.abs(imageRect.width - rootRect.width)).toBeLessThan(0.5);
        expect(Math.abs(imageRect.height - rootRect.height)).toBeLessThan(0.5);
        expect(getComputedStyle(image).objectFit).toBe('cover');
    },
};

export const CommonRatios: Story = {
    render: () => ({
        components: { AspectRatio },
        setup: () => ({ imageUrl, ratioExamples }),
        template: `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;">
                <div v-for="example in ratioExamples" :key="example.label" style="display: grid; align-content: start; gap: 8px;">
                    <AspectRatio
                        :ratio="example.ratio"
                        style="overflow: hidden; border-radius: var(--rp-radius-md);"
                    >
                        <img :src="imageUrl" alt="" />
                    </AspectRatio>
                    <strong style="color: var(--rp-color-text); font-size: var(--rp-font-size-sm);">
                        {{ example.label }}
                    </strong>
                </div>
            </div>
        `,
    }),
};
