import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Button from '../button/button.vue';
import Input from '../input/input.vue';
import Modal from './modal.vue';

const sizes = ['sm', 'md', 'lg', 'xl', 'full'] as const;
const roles = ['dialog', 'alertdialog'] as const;

const meta = {
    title: 'Components/Modal',
    component: Modal as any,
    tags: ['autodocs'],
    argTypes: {
        role: {
            control: 'select',
            options: roles,
        },
        size: {
            control: 'text',
        },
        open: { control: 'boolean' },
        title: { control: 'text' },
        description: { control: 'text' },
        ariaLabel: { control: 'text' },
        closeLabel: { control: 'text' },
        closeOnOverlayClick: { control: 'boolean' },
        closeOnEscape: { control: 'boolean' },
        showCloseButton: { control: 'boolean' },
        overlayProps: { control: 'object' },
        preventScroll: { control: 'boolean' },
        returnFocus: { control: 'boolean' },
        keepMounted: { control: 'boolean' },
        initialFocus: { control: false },
    },
    args: {
        role: 'dialog',
        size: 'md',
        title: 'Invite teammate',
        description: 'Send an invitation to collaborate in this workspace.',
        closeLabel: 'Close modal',
        closeOnOverlayClick: true,
        closeOnEscape: true,
        showCloseButton: true,
        overlayProps: {},
        preventScroll: true,
        returnFocus: true,
        keepMounted: false,
    },
    parameters: {
        layout: 'fullscreen',
    },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
    render: (args) => ({
        components: { Button, Input, Modal },
        setup() {
            const open = ref(false);
            return { args, open };
        },
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 360px; place-items: center; padding: 48px;">
                <Button variant="solid" @click="open = true">Open modal</Button>
                <Modal v-bind="args" v-model:open="open" initial-focus=".invite-email">
                    <div style="display: grid; gap: 16px;">
                        <Input class="invite-email" model-value="" placeholder="name@example.com" />
                        <p style="margin: 0; color: var(--rp-color-dimmed); font-size: var(--rp-font-size-sm);">
                            The teammate will receive an email with access instructions.
                        </p>
                    </div>
                    <template #footer="{ close }">
                        <Button variant="ghost" @click="close">Cancel</Button>
                        <Button variant="solid" @click="close">Send invite</Button>
                    </template>
                </Modal>
            </div>
        `,
    }),
};

export const Sizes: Story = {
    render: (args) => ({
        components: { Button, Modal },
        setup() {
            const openSize = ref<(typeof sizes)[number] | null>(null);
            return { args, sizes, openSize };
        },
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 420px; place-items: center; padding: 48px;">
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    <Button v-for="size in sizes" :key="size" variant="outline" @click="openSize = size">
                        {{ size }}
                    </Button>
                </div>
                <Modal
                    v-for="size in sizes"
                    :key="size"
                    v-bind="args"
                    :title="'Modal ' + size"
                    :size="size"
                    :open="openSize === size"
                    @update:open="openSize = $event ? size : null"
                >
                    <p style="margin: 0;">
                        This modal uses the {{ size }} size preset.
                    </p>
                    <template #footer="{ close }">
                        <Button variant="solid" @click="close">Done</Button>
                    </template>
                </Modal>
            </div>
        `,
    }),
};

export const CustomSize: Story = {
    args: {
        size: '55%',
        title: 'Custom width',
        description: 'This modal uses a CSS width value through the size prop.',
    },
    render: (args) => ({
        components: { Button, Modal },
        setup() {
            const open = ref(false);
            return { args, open };
        },
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 360px; place-items: center; padding: 48px;">
                <Button variant="outline" @click="open = true">Open custom size</Button>
                <Modal v-bind="args" v-model:open="open">
                    <p style="margin: 0;">
                        Try values like 55%, 50rem, 720px, or min(90vw, 50rem).
                    </p>
                    <template #footer="{ close }">
                        <Button variant="solid" @click="close">Done</Button>
                    </template>
                </Modal>
            </div>
        `,
    }),
};

export const CustomOverlay: Story = {
    args: {
        title: 'Custom overlay',
        description: 'This modal forwards visual props to the shared Overlay component.',
        overlayProps: {
            gradient: 'linear-gradient(135deg, rgba(8, 13, 27, 0.82), rgba(20, 184, 166, 0.46))',
            blur: 8,
        },
    },
    render: (args) => ({
        components: { Button, Modal },
        setup() {
            const open = ref(true);
            return { args, open };
        },
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 460px; gap: 24px; place-items: center; padding: 48px; background: linear-gradient(135deg, #f8fafc, #dbeafe);">
                <div style="display: grid; width: min(720px, 100%); gap: 16px;">
                    <div style="display: flex; flex-wrap: wrap; gap: 12px;">
                        <span style="display: block; width: 160px; height: 80px; border-radius: var(--rp-radius-sm); background: #f97316;"></span>
                        <span style="display: block; width: 220px; height: 80px; border-radius: var(--rp-radius-sm); background: #14b8a6;"></span>
                        <span style="display: block; width: 120px; height: 80px; border-radius: var(--rp-radius-sm); background: #6366f1;"></span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px;">
                        <span style="height: 96px; border-radius: var(--rp-radius-sm); background: repeating-linear-gradient(45deg, #ffffff, #ffffff 10px, #e2e8f0 10px, #e2e8f0 20px);"></span>
                        <span style="height: 96px; border-radius: var(--rp-radius-sm); background: linear-gradient(135deg, #fde68a, #fb7185);"></span>
                        <span style="height: 96px; border-radius: var(--rp-radius-sm); background: repeating-linear-gradient(90deg, #ffffff, #ffffff 8px, #c7d2fe 8px, #c7d2fe 16px);"></span>
                    </div>
                </div>
                <Button variant="outline" @click="open = true">Open custom overlay</Button>
                <Modal v-bind="args" v-model:open="open">
                    <p style="margin: 0;">
                        The overlay is configured through the Modal overlayProps prop.
                    </p>
                    <template #footer="{ close }">
                        <Button variant="solid" @click="close">Done</Button>
                    </template>
                </Modal>
            </div>
        `,
    }),
};

export const CustomHeader: Story = {
    render: (args) => ({
        components: { Button, Modal },
        setup() {
            const open = ref(false);
            return { args, open };
        },
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 360px; place-items: center; padding: 48px;">
                <Button variant="outline" @click="open = true">Review changes</Button>
                <Modal v-bind="args" v-model:open="open">
                    <template #header>
                        <div style="display: grid; gap: 4px;">
                            <strong style="font-size: var(--rp-font-size-lg); line-height: var(--rp-line-height-xs);">
                                Review changes
                            </strong>
                            <span style="color: var(--rp-color-dimmed); font-size: var(--rp-font-size-sm);">
                                Three files are ready to publish.
                            </span>
                        </div>
                    </template>
                    <p style="margin: 0;">
                        Confirm the release after checking the generated files.
                    </p>
                    <template #footer="{ close }">
                        <Button variant="ghost" @click="close">Cancel</Button>
                        <Button variant="solid" @click="close">Publish</Button>
                    </template>
                </Modal>
            </div>
        `,
    }),
};
