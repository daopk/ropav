import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IconArrowRight from '~icons/lucide/arrow-right';
import IconCheckCircle from '~icons/lucide/check-circle';
import IconSparkles from '~icons/lucide/sparkles';
import Badge from './badge.vue';
import { badgeColors, badgeRadiuses, badgeSizes, badgeVariants } from './types';

const meta = {
    title: 'Components/Badge',
    component: Badge as any,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: [undefined, ...badgeVariants],
        },
        color: {
            control: 'text',
        },
        autoContrast: { control: 'boolean' },
        size: {
            control: 'select',
            options: [undefined, ...badgeSizes],
        },
        radius: {
            control: 'select',
            options: [undefined, ...badgeRadiuses],
        },
        ariaLabel: { control: 'text' },
    },
    args: {
        autoContrast: false,
    },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
    render: (args) => ({
        components: { Badge },
        setup: () => ({ args }),
        template: '<Badge v-bind="args">Published</Badge>',
    }),
};

export const Variants: Story = {
    render: (args) => ({
        components: { Badge },
        setup: () => ({ args, badgeVariants }),
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <Badge v-bind="args">default</Badge>
                <Badge v-for="variant in badgeVariants" :key="variant" v-bind="args" :variant="variant">
                    {{ variant }}
                </Badge>
            </div>
        `,
    }),
};

export const Colors: Story = {
    render: (args) => ({
        components: { Badge },
        setup: () => ({ args, badgeColors, badgeVariants }),
        template: `
            <div style="display: grid; gap: 16px;">
                <div v-for="variant in badgeVariants" :key="variant" style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                    <Badge v-for="color in badgeColors" :key="variant + '-' + color" v-bind="args" :variant="variant" :color="color">
                        {{ color }}
                    </Badge>
                </div>
            </div>
        `,
    }),
};

export const Sizes: Story = {
    render: (args) => ({
        components: { Badge },
        setup: () => ({ args, badgeSizes }),
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <Badge v-for="size in badgeSizes" :key="size" v-bind="args" :size="size">
                    {{ size }}
                </Badge>
            </div>
        `,
    }),
};

export const Slots: Story = {
    render: (args) => ({
        components: { Badge, IconArrowRight, IconCheckCircle, IconSparkles },
        setup: () => ({ args }),
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <Badge v-bind="args" color="green">
                    <template #left>
                        <IconCheckCircle aria-hidden="true" />
                    </template>
                    Verified
                </Badge>
                <Badge v-bind="args" color="violet">
                    Featured
                    <template #right>
                        <IconSparkles aria-hidden="true" />
                    </template>
                </Badge>
                <Badge v-bind="args" color="cyan" variant="surface">
                    Continue
                    <template #right>
                        <IconArrowRight aria-hidden="true" />
                    </template>
                </Badge>
            </div>
        `,
    }),
};

export const Radii: Story = {
    render: (args) => ({
        components: { Badge },
        setup: () => ({ args, badgeRadiuses }),
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <Badge v-for="radius in badgeRadiuses" :key="radius" v-bind="args" :radius="radius">
                    {{ radius }}
                </Badge>
            </div>
        `,
    }),
};

export const CustomColor: Story = {
    args: {
        color: '#ff3366',
        variant: 'surface',
    },
    render: (args) => ({
        components: { Badge },
        setup: () => ({ args }),
        template: '<Badge v-bind="args">Custom</Badge>',
    }),
};
