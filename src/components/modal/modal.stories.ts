import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { ref } from 'vue';
import Button from '../button/button.vue';
import Field from '../field/field.vue';
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
        modal: { control: 'boolean' },
        initialFocus: { control: false },
        focusTrapOptions: { control: false },
    },
    args: {
        id: 'invite-teammate-modal',
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
        modal: true,
    },
    parameters: {
        layout: 'fullscreen',
    },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
    tags: ['test'],
    render: (args) => ({
        components: { Button, Field, Input, Modal },
        setup() {
            const open = ref(false);
            return { args, open };
        },
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 360px; place-items: center; padding: 48px;">
                <Button variant="solid" @click="open = true">Open modal</Button>
                <Modal v-bind="args" v-model:open="open" initial-focus="#invite-email">
                    <div style="display: grid; gap: 16px;">
                        <Field id="invite-email" label="Email" v-slot="{ controlProps }">
                            <Input
                                v-bind="controlProps"
                                model-value=""
                                placeholder="name@example.com"
                            />
                        </Field>
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
    play: async ({ canvasElement }) => {
        const storyDocument = canvasElement.ownerDocument;
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByRole('button', { name: 'Open modal' }));

        await waitFor(() => {
            const input = storyDocument.querySelector<HTMLInputElement>('#invite-email');
            expect(storyDocument.activeElement).toBe(input);
        });
    },
};

export const ScrollableBody: Story = {
    tags: ['test'],
    args: {
        id: 'activity-history-modal',
        size: 'sm',
        title: 'Activity history',
        description: 'The header and footer remain fixed while the body scrolls.',
    },
    render: (args) => ({
        components: { Button, Modal },
        setup() {
            const open = ref(true);
            return { args, open };
        },
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 640px; place-items: center; padding: 48px;">
                <Button variant="outline" @click="open = true">Open activity history</Button>
                <Modal v-bind="args" v-model:open="open">
                    <div style="display: grid; gap: 12px;">
                        <div
                            v-for="item in 24"
                            :key="item"
                            style="padding-bottom: 12px; color: var(--rp-color-text); border-bottom: 1px solid var(--rp-color-default-border);"
                        >
                            <strong>Activity {{ item }}</strong>
                            <div style="margin-top: 4px; color: var(--rp-color-dimmed); font-size: var(--rp-font-size-sm);">
                                A project event was recorded for this workspace.
                            </div>
                        </div>
                    </div>
                    <template #footer="{ close }">
                        <Button variant="ghost" @click="close">Cancel</Button>
                        <Button variant="solid" @click="close">Done</Button>
                    </template>
                </Modal>
            </div>
        `,
    }),
    play: async ({ canvasElement }) => {
        const storyDocument = canvasElement.ownerDocument;
        const body = storyDocument.querySelector<HTMLElement>('.rp-modal__body')!;
        const viewport = body.querySelector<HTMLElement>('.rp-scroll-area__viewport')!;
        const scrollbar = body.querySelector<HTMLElement>('.rp-scroll-area__scrollbar--vertical')!;
        const footer = storyDocument.querySelector<HTMLElement>('.rp-modal__footer')!;

        await waitFor(() => expect(body).toHaveAttribute('data-overflow-y'));
        expect(body).toHaveClass('rp-scroll-area');
        expect(body).toHaveAttribute('data-scrollbars', 'y');
        expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
        expect(scrollbar).toHaveAttribute('aria-hidden', 'true');
        expect(scrollbar.tabIndex).toBe(-1);
        expect(footer).toBeVisible();
    },
};

export const Sizes: Story = {
    tags: ['test'],
    args: {
        teleport: false,
    },
    render: (args) => ({
        components: { Button, Modal },
        setup() {
            const openSize = ref<(typeof sizes)[number] | null>(null);
            return { args, sizes, openSize };
        },
        template: `
            <div data-testid="modal-sizes-story" style="box-sizing: border-box; display: grid; min-height: 420px; place-items: center; padding: 48px;">
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    <Button v-for="size in sizes" :key="size" variant="outline" @click="openSize = size">
                        {{ size }}
                    </Button>
                </div>
                <Modal
                    v-if="openSize"
                    :key="openSize"
                    v-bind="{
                        ...args,
                        id: 'modal-size-' + openSize,
                        title: 'Modal ' + openSize,
                        size: openSize,
                        open: true,
                    }"
                    @update:open="openSize = $event ? openSize : null"
                >
                    <p style="margin: 0;">
                        This modal uses the {{ openSize }} size preset.
                    </p>
                    <template #footer="{ close }">
                        <Button variant="solid" @click="close">Done</Button>
                    </template>
                </Modal>
            </div>
        `,
    }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const story = within(canvas.getByTestId('modal-sizes-story'));

        expect(story.queryByRole('dialog')).not.toBeInTheDocument();

        await userEvent.click(story.getByRole('button', { name: 'md' }));

        await waitFor(() => {
            const dialogs = story.getAllByRole('dialog');
            expect(dialogs).toHaveLength(1);
            expect(dialogs[0]).toHaveAccessibleName('Modal md');
        });
    },
};

export const CustomSize: Story = {
    args: {
        id: 'custom-width-modal',
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
        id: 'custom-overlay-modal',
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
    args: {
        id: 'review-changes-modal',
        title: '',
        description: '',
        ariaLabel: 'Review changes',
    },
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
