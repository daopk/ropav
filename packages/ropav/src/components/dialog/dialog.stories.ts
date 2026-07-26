import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Button from '../button/button.vue';
import DialogClose from './dialog-close.vue';
import DialogContent from './dialog-content.vue';
import DialogDescription from './dialog-description.vue';
import DialogOverlay from './dialog-overlay.vue';
import DialogPortal from './dialog-portal.vue';
import DialogRoot from './dialog-root.vue';
import DialogTitle from './dialog-title.vue';
import DialogTrigger from './dialog-trigger.vue';

const meta = {
    title: 'Components/Dialog',
    component: DialogRoot as any,
    tags: ['autodocs'],
    args: {
        modal: true,
        closeOnEscape: true,
        closeOnOutsideClick: true,
        preventScroll: true,
        returnFocus: true,
    },
    argTypes: {
        open: { control: 'boolean' },
        defaultOpen: { control: 'boolean' },
        modal: { control: 'boolean' },
        closeOnEscape: { control: 'boolean' },
        closeOnOutsideClick: { control: 'boolean' },
        preventScroll: { control: 'boolean' },
        returnFocus: { control: 'boolean' },
    },
    parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DialogRoot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Composed: Story = {
    render: (args) => ({
        components: {
            Button,
            DialogClose,
            DialogContent,
            DialogDescription,
            DialogOverlay,
            DialogPortal,
            DialogRoot,
            DialogTitle,
            DialogTrigger,
        },
        setup() {
            const open = ref(false);
            const closeReason = ref('none');
            return { args, Button, closeReason, open };
        },
        template: `
            <main style="box-sizing: border-box; display: grid; min-height: 420px; gap: 16px; place-items: center; padding: 48px;">
                <div style="display: grid; gap: 8px; justify-items: center;">
                    <DialogRoot
                        v-bind="args"
                        v-model:open="open"
                        @close="closeReason = $event"
                    >
                        <DialogTrigger :as="Button" variant="outline">
                            Open primitives
                        </DialogTrigger>
                        <DialogPortal>
                            <DialogOverlay
                                style="position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55);"
                            />
                            <DialogContent
                                style="position: fixed; top: 50%; left: 50%; display: grid; width: min(28rem, calc(100vw - 2rem)); gap: 16px; padding: 24px; background: var(--rp-color-default); border: var(--rp-border-width-thin) solid var(--rp-color-default-border); border-radius: var(--rp-radius-md); box-shadow: var(--rp-shadow-lg); transform: translate(-50%, -50%);"
                            >
                                <div style="display: grid; gap: 6px;">
                                    <DialogTitle style="margin: 0; font-size: var(--rp-font-size-xl);">
                                        Archive project
                                    </DialogTitle>
                                    <DialogDescription style="margin: 0; color: var(--rp-color-dimmed);">
                                        The project remains available from the archive.
                                    </DialogDescription>
                                </div>
                                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                                    <DialogClose :as="Button" variant="ghost">Cancel</DialogClose>
                                    <DialogClose :as="Button" variant="solid">Archive</DialogClose>
                                </div>
                            </DialogContent>
                        </DialogPortal>
                    </DialogRoot>
                    <small>Last close reason: {{ closeReason }}</small>
                </div>
            </main>
        `,
    }),
};

export const NonModal: Story = {
    args: {
        modal: false,
        preventScroll: false,
    },
    render: Composed.render,
};
