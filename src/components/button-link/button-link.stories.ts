import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IconArrowRight from '~icons/lucide/arrow-right';
import IconDownload from '~icons/lucide/download';
import IconExternalLink from '~icons/lucide/external-link';
import ButtonLink from './button-link.vue';

const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const variants = ['solid', 'subtle', 'surface', 'outline', 'ghost', 'plain'] as const;

const meta = {
    title: 'Components/Button',
    component: ButtonLink as any,
    tags: ['autodocs'],
    argTypes: {
        href: { control: 'text' },
        target: {
            control: 'select',
            options: [undefined, '_self', '_blank', '_parent', '_top'],
        },
        rel: { control: 'text' },
        download: { control: 'text' },
        hreflang: { control: 'text' },
        variant: {
            control: 'select',
            options: [undefined, ...variants],
        },
        color: {
            control: 'text',
        },
        size: {
            control: 'select',
            options: [undefined, ...sizes],
        },
        radius: {
            control: 'select',
            options: [undefined, ...radii],
        },
        disabled: { control: 'boolean' },
        loading: { control: 'boolean' },
    },
    args: {
        color: 'primary',
        disabled: false,
        href: '#',
        loading: false,
        variant: 'solid',
    },
    parameters: {
        docs: {
            description: {
                component:
                    'ButtonLink is visually similar to Button and supports the same visual props, slots, and loading state. Use it when the control should navigate with an anchor.',
            },
        },
    },
} satisfies Meta<typeof ButtonLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Link: Story = {
    render: (args) => ({
        components: { ButtonLink, IconArrowRight, IconDownload, IconExternalLink },
        setup: () => ({ args }),
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <ButtonLink v-bind="args">
                    View details
                    <template #right>
                        <IconArrowRight aria-hidden="true" />
                    </template>
                </ButtonLink>

                <ButtonLink v-bind="args" target="_blank" variant="outline">
                    Open docs
                    <template #right>
                        <IconExternalLink aria-hidden="true" />
                    </template>
                </ButtonLink>

                <ButtonLink v-bind="args" download="report.csv" variant="subtle">
                    <template #left>
                        <IconDownload aria-hidden="true" />
                    </template>
                    Download
                </ButtonLink>

                <ButtonLink v-bind="args" disabled variant="ghost">Disabled</ButtonLink>

                <ButtonLink v-bind="args" loading>Loading</ButtonLink>
            </div>
        `,
    }),
};
