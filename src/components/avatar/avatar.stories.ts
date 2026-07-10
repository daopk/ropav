import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IconBot from '~icons/lucide/bot';
import Avatar from './avatar.vue';
import { avatarColors, avatarRadiuses, avatarSizes, avatarVariants } from './types';

const portraitUrl =
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80';

const meta = {
    title: 'Components/Avatar',
    component: Avatar as any,
    tags: ['autodocs'],
    argTypes: {
        src: { control: 'text' },
        alt: { control: 'text' },
        ariaLabel: { control: 'text' },
        name: { control: 'text' },
        color: { control: 'text' },
        autoContrast: { control: 'boolean' },
        variant: {
            control: 'select',
            options: [undefined, ...avatarVariants],
        },
        size: {
            control: 'select',
            options: [undefined, ...avatarSizes],
        },
        radius: {
            control: 'select',
            options: [undefined, ...avatarRadiuses],
        },
    },
    args: {
        name: 'Ada Lovelace',
        autoContrast: false,
    },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
    render: (args) => ({
        components: { Avatar },
        setup: () => ({ args }),
        template: '<Avatar v-bind="args" />',
    }),
};

export const Image: Story = {
    args: {
        src: portraitUrl,
        alt: 'Portrait of a woman',
    },
    render: (args) => ({
        components: { Avatar },
        setup: () => ({ args }),
        template: '<Avatar v-bind="args" />',
    }),
};

export const BrokenImage: Story = {
    args: {
        src: 'data:image/png;base64,not-an-image',
        alt: 'Grace Hopper',
        name: 'Grace Hopper',
    },
    render: (args) => ({
        components: { Avatar },
        setup: () => ({ args }),
        template: '<Avatar v-bind="args" />',
    }),
};

export const WithIcon: Story = {
    args: {
        name: undefined,
        ariaLabel: 'Assistant avatar',
        color: 'violet',
        size: 'lg',
    },
    render: (args) => ({
        components: { Avatar, IconBot },
        setup: () => ({ args }),
        template: `
            <Avatar v-bind="args">
                <IconBot aria-hidden="true" />
            </Avatar>
        `,
    }),
};

export const Fallbacks: Story = {
    render: (args) => ({
        components: { Avatar, IconBot },
        setup: () => ({ args }),
        template: `
            <div style="display: flex; align-items: center; gap: 12px;">
                <Avatar v-bind="args" :name="undefined" />
                <Avatar v-bind="args" name="Ada" />
                <Avatar v-bind="args" name="Ada Lovelace" />
                <Avatar v-bind="args" :name="undefined" aria-label="Assistant avatar">
                    <IconBot aria-hidden="true" />
                </Avatar>
            </div>
        `,
    }),
};

export const Variants: Story = {
    render: (args) => ({
        components: { Avatar },
        setup: () => ({ args, avatarVariants }),
        template: `
            <div style="display: flex; align-items: flex-start; gap: 16px;">
                <div
                    v-for="variant in avatarVariants"
                    :key="variant"
                    style="display: grid; justify-items: center; gap: 6px;"
                >
                    <Avatar
                        v-bind="args"
                        :name="variant"
                        :variant="variant"
                    />
                    <span style="font: 12px/1.2 var(--rp-font-family);">{{ variant }}</span>
                </div>
            </div>
        `,
    }),
};

export const Sizes: Story = {
    render: (args) => ({
        components: { Avatar },
        setup: () => ({ args, avatarSizes }),
        template: `
            <div style="display: flex; align-items: center; gap: 12px;">
                <Avatar
                    v-for="size in avatarSizes"
                    :key="size"
                    v-bind="args"
                    :size="size"
                />
            </div>
        `,
    }),
};

export const Radii: Story = {
    args: {
        src: portraitUrl,
        alt: 'Portrait of a woman',
    },
    render: (args) => ({
        components: { Avatar },
        setup: () => ({ args, avatarRadiuses }),
        template: `
            <div style="display: flex; align-items: center; gap: 12px;">
                <Avatar
                    v-for="radius in avatarRadiuses"
                    :key="radius"
                    v-bind="args"
                    :radius="radius"
                />
            </div>
        `,
    }),
};

export const Colors: Story = {
    render: (args) => ({
        components: { Avatar },
        setup: () => ({ args, avatarColors }),
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <Avatar
                    v-for="color in avatarColors"
                    :key="color"
                    v-bind="args"
                    :color="color"
                    :name="color"
                />
            </div>
        `,
    }),
};

export const CustomColor: Story = {
    args: {
        color: '#fab005',
        autoContrast: true,
        name: 'Custom Color',
    },
    render: (args) => ({
        components: { Avatar },
        setup: () => ({ args }),
        template: '<Avatar v-bind="args" />',
    }),
};
