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
        defaultOpen: { control: 'boolean' },
        title: { control: 'text' },
        description: { control: 'text' },
        ariaLabel: { control: 'text' },
        closeLabel: { control: 'text' },
        closeOnOverlayClick: { control: 'boolean' },
        closeOnEscape: { control: 'boolean' },
        showCloseButton: { control: 'boolean' },
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
                        <p style="margin: 0; color: var(--rp-color-text-secondary); font-size: var(--rp-font-size-sm);">
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
                            <strong style="font-size: var(--rp-font-size-lg); line-height: var(--rp-line-height-tight);">
                                Review changes
                            </strong>
                            <span style="color: var(--rp-color-text-secondary); font-size: var(--rp-font-size-sm);">
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
