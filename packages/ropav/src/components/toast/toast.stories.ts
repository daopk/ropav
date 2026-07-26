import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { computed, defineComponent, ref, type PropType } from 'vue';
import IconBell from '~icons/lucide/bell';
import IconCircleCheck from '~icons/lucide/circle-check';
import IconCircleX from '~icons/lucide/circle-x';
import IconInfo from '~icons/lucide/info';
import IconTrash2 from '~icons/lucide/trash-2';
import IconTriangleAlert from '~icons/lucide/triangle-alert';
import Button from '../button/button.vue';
import ToastProvider from './toast-provider.vue';
import { createToastStore } from './toast-store';
import ToastViewport from './toast-viewport.vue';
import Toast from './toast.vue';
import { toastPositions, toastRadiuses, toastVariants, type ToastPosition } from './types';
import { useToast } from './useToast';
import { useToastState } from './useToastState';

const toastColorExamples = ['gray', 'green', 'red', 'yellow', 'blue', '#ff3366'] as const;

const NotificationControls = defineComponent({
    name: 'NotificationControls',
    components: { Button },
    setup() {
        const toast = useToast();

        return {
            dismissAll: toast.dismissAll,
            hasToasts: computed(() => toast.toasts.value.length > 0),
            showDefault: () =>
                toast.show('New notification', {
                    description: 'A neutral notification for general updates.',
                    variant: 'surface',
                }),
            showSuccess: () =>
                toast.success('Changes saved', {
                    description: 'Your preferences are up to date.',
                    variant: 'surface',
                }),
            showError: () =>
                toast.error('Save failed', {
                    description: 'Please try again in a moment.',
                    variant: 'surface',
                }),
            showWarning: () =>
                toast.warning('Storage almost full', {
                    description: 'Remove unused files to keep uploads working.',
                    variant: 'surface',
                }),
            showInfo: () =>
                toast.info('New version available', {
                    description: 'Refresh when you are ready to update.',
                    variant: 'surface',
                }),
        };
    },
    template: `
        <section style="display: grid; width: min(640px, 100%); gap: 16px;">
            <div>
                <h2 style="margin: 0 0 4px; font-size: 18px;">Semantic notifications</h2>
                <p style="margin: 0; color: var(--rp-color-dimmed);">
                    Each helper supplies the appropriate color and live-region role.
                </p>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                <Button variant="outline" @click="showDefault()">Show default</Button>
                <Button color="green" variant="outline" @click="showSuccess()">Show success</Button>
                <Button color="red" variant="outline" @click="showError()">Show error</Button>
                <Button color="yellow" variant="outline" @click="showWarning()">Show warning</Button>
                <Button color="blue" variant="outline" @click="showInfo()">Show info</Button>
                <Button variant="plain" :disabled="!hasToasts" @click="dismissAll()">
                    Dismiss all
                </Button>
            </div>
        </section>
    `,
});

const QueueControls = defineComponent({
    name: 'QueueControls',
    components: { Button },
    setup() {
        const toast = useToast();
        const uploadId = 'upload';
        let sequence = 0;

        const hasUpload = computed(() => toast.toasts.value.some((item) => item.id === uploadId));

        function startUpload() {
            toast.info({
                id: uploadId,
                title: 'Uploading report',
                description: 'Preparing the file for upload.',
                variant: 'surface',
                duration: 0,
                closable: false,
            });
        }

        function completeUpload() {
            toast.update(uploadId, {
                type: 'success',
                title: 'Upload complete',
                description: 'The report is ready to share.',
                closable: true,
            });
        }

        function replaceUpload() {
            toast.warning({
                id: uploadId,
                title: 'Upload restarted',
                description: 'Showing the same ID creates a fresh toast lifecycle.',
                variant: 'surface',
                duration: 0,
            });
        }

        function addNotification() {
            sequence += 1;
            toast.show({
                title: `Queued notification ${sequence}`,
                description: 'Only the three newest notifications are kept.',
                duration: 0,
            });
        }

        return {
            addNotification,
            completeUpload,
            dismissAll: toast.dismissAll,
            dismissUpload: () => toast.dismiss(uploadId),
            hasUpload,
            replaceUpload,
            startUpload,
            toasts: toast.toasts,
        };
    },
    template: `
        <section style="display: grid; width: min(720px, 100%); gap: 16px;">
            <div>
                <h2 style="margin: 0 0 4px; font-size: 18px;">Queue and lifecycle</h2>
                <p style="margin: 0; color: var(--rp-color-dimmed);">
                    Active notifications: {{ toasts.length }} / 3. Update keeps the instance;
                    showing the same ID replaces it.
                </p>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                <Button @click="startUpload()">Start upload</Button>
                <Button color="green" variant="outline" :disabled="!hasUpload" @click="completeUpload()">
                    Mark complete
                </Button>
                <Button color="yellow" variant="outline" :disabled="!hasUpload" @click="replaceUpload()">
                    Replace same ID
                </Button>
                <Button variant="outline" :disabled="!hasUpload" @click="dismissUpload()">
                    Dismiss upload
                </Button>
                <Button variant="outline" @click="addNotification()">Add notification</Button>
                <Button variant="plain" :disabled="toasts.length === 0" @click="dismissAll()">
                    Dismiss all
                </Button>
            </div>
        </section>
    `,
});

const PositionControls = defineComponent({
    name: 'PositionControls',
    components: { Button },
    props: {
        modelValue: {
            type: String as PropType<ToastPosition>,
            required: true,
        },
    },
    emits: ['update:modelValue'],
    setup(_props, { emit }) {
        const toast = useToast();

        function selectPosition(position: ToastPosition) {
            emit('update:modelValue', position);
            toast.info({
                id: 'position-preview',
                title: position,
                description: 'The same toast moves with the viewport.',
                variant: 'surface',
                role: 'none',
                duration: 0,
            });
        }

        return {
            dismissAll: toast.dismissAll,
            positions: toastPositions,
            selectPosition,
        };
    },
    template: `
        <section style="display: grid; width: min(680px, 100%); gap: 16px;">
            <div>
                <h2 style="margin: 0 0 4px; font-size: 18px;">Viewport position</h2>
                <p style="margin: 0; color: var(--rp-color-dimmed);">
                    Choose a position to replace and move the preview notification.
                </p>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                <Button
                    v-for="position in positions"
                    :key="position"
                    size="sm"
                    :variant="modelValue === position ? 'solid' : 'outline'"
                    :aria-pressed="modelValue === position"
                    @click="selectPosition(position)"
                >
                    {{ position }}
                </Button>
                <Button size="sm" variant="plain" @click="dismissAll()">Dismiss</Button>
            </div>
        </section>
    `,
});

const meta = {
    title: 'Components/Toast',
    component: Toast as any,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
    argTypes: {
        open: { control: false },
        variant: {
            control: 'select',
            options: [undefined, ...toastVariants],
        },
        color: { control: 'text' },
        autoContrast: { control: 'boolean' },
        radius: {
            control: 'select',
            options: [undefined, ...toastRadiuses],
        },
        role: {
            control: 'select',
            options: ['alert', 'status', 'none'],
        },
        duration: {
            control: { type: 'range', min: 0, max: 10000, step: 500 },
        },
        pauseOnHover: { control: 'boolean' },
        pauseOnFocus: { control: 'boolean' },
        closable: { control: 'boolean' },
        closeLabel: { control: 'text' },
        title: { control: 'text' },
        description: { control: 'text' },
    },
    args: {
        autoContrast: true,
        closable: true,
        description: 'You have a new message from the project team.',
        duration: 0,
        pauseOnFocus: true,
        pauseOnHover: true,
        title: 'New notification',
    },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
    render: (args) => ({
        components: { Button, IconBell, Toast },
        setup() {
            const { open, toastProps } = useToastState({ defaultOpen: true });
            const isPresent = ref(true);

            function showAgain() {
                isPresent.value = true;
                open();
            }

            return {
                args,
                isPresent,
                onAfterLeave: () => (isPresent.value = false),
                showAgain,
                toastProps,
            };
        },
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 280px; place-items: center; padding: 40px;">
                <Button v-if="!isPresent" variant="outline" @click="showAgain()">Show again</Button>
                <Toast v-bind="{ ...args, ...toastProps }" @after-leave="onAfterLeave()">
                    <template #icon><IconBell /></template>
                </Toast>
            </div>
        `,
    }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const toast = canvas.getByRole('status');
        const initialTop = toast.getBoundingClientRect().top;

        await userEvent.click(within(toast).getByRole('button', { name: 'Close toast' }));

        expect(canvas.queryByRole('button', { name: 'Show again' })).not.toBeInTheDocument();
        expect(toast.getBoundingClientRect().top).toBe(initialTop);
        await waitFor(() =>
            expect(canvas.getByRole('button', { name: 'Show again' })).toBeInTheDocument(),
        );
    },
};

export const Notifications: Story = {
    tags: ['test'],
    parameters: {
        controls: { disable: true },
    },
    render: () => ({
        components: {
            IconBell,
            IconCircleCheck,
            IconCircleX,
            IconInfo,
            IconTriangleAlert,
            NotificationControls,
            ToastProvider,
            ToastViewport,
        },
        template: `
            <ToastProvider :duration="0">
                <div style="box-sizing: border-box; display: grid; min-height: 440px; place-items: center; padding: 48px;">
                    <NotificationControls />
                </div>
                <ToastViewport :teleport="false">
                    <template #icon="{ toast }">
                        <IconCircleCheck v-if="toast.type === 'success'" />
                        <IconCircleX v-else-if="toast.type === 'error'" />
                        <IconTriangleAlert v-else-if="toast.type === 'warning'" />
                        <IconInfo v-else-if="toast.type === 'info'" />
                        <IconBell v-else />
                    </template>
                </ToastViewport>
            </ToastProvider>
        `,
    }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByRole('button', { name: 'Show success' }));
        const status = await canvas.findByRole('status');
        expect(status).toHaveTextContent('Changes saved');

        await userEvent.click(within(status).getByRole('button', { name: 'Close toast' }));
        await waitFor(() => expect(canvas.queryByRole('status')).not.toBeInTheDocument());

        await userEvent.click(canvas.getByRole('button', { name: 'Show error' }));
        expect(await canvas.findByRole('alert')).toHaveTextContent('Save failed');
    },
};

export const AutoDismiss: Story = {
    args: {
        color: 'blue',
        description: 'Hover the toast or focus its close button to pause the timer.',
        duration: 3000,
        title: 'Auto-dismiss is active',
        variant: 'surface',
    },
    render: (args) => ({
        components: { Button, IconInfo, Toast },
        setup() {
            const { isOpen, lastCloseReason, open, toastProps } = useToastState();
            return { args, isOpen, lastCloseReason, open, toastProps };
        },
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 360px; place-items: center; padding: 40px;">
                <div style="display: grid; width: min(420px, 100%); justify-items: start; gap: 16px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <Button :disabled="isOpen" @click="open()">Show toast</Button>
                        <span style="color: var(--rp-color-dimmed);">
                            {{ isOpen ? 'Open' : 'Closed' }} · Last close: {{ lastCloseReason ?? 'none' }}
                        </span>
                    </div>
                    <Toast v-bind="{ ...args, ...toastProps }">
                        <template #icon><IconInfo /></template>
                    </Toast>
                </div>
            </div>
        `,
    }),
};

export const QueueManagement: Story = {
    parameters: {
        controls: { disable: true },
    },
    render: () => ({
        components: { QueueControls, ToastProvider, ToastViewport },
        template: `
            <ToastProvider :max="3" :duration="0">
                <div style="box-sizing: border-box; display: grid; min-height: 440px; place-items: center; padding: 48px;">
                    <QueueControls />
                </div>
                <ToastViewport :teleport="false" />
            </ToastProvider>
        `,
    }),
};

export const StandaloneStore: Story = {
    parameters: {
        controls: { disable: true },
    },
    render: () => {
        const store = createToastStore({ duration: 0, max: 3 });
        store.info('Created before provider mount', {
            description:
                'The standalone store retains notifications until a viewport renders them.',
            variant: 'surface',
        });

        return {
            components: { Button, ToastProvider, ToastViewport },
            setup: () => ({
                dismissAll: store.dismissAll,
                showSuccess: () => store.success('Called outside component setup'),
                store,
            }),
            template: `
                <ToastProvider :store="store">
                    <div style="box-sizing: border-box; display: flex; min-height: 440px; place-content: center; align-items: center; gap: 8px; padding: 48px;">
                        <Button color="green" variant="outline" @click="showSuccess()">
                            Show success
                        </Button>
                        <Button variant="plain" @click="dismissAll()">Dismiss all</Button>
                    </div>
                    <ToastViewport :teleport="false" />
                </ToastProvider>
            `,
        };
    },
};

export const CustomContent: Story = {
    args: {
        closable: false,
        color: 'violet',
        description: '',
        title: '',
        variant: 'surface',
    },
    parameters: {
        controls: {
            include: [
                'variant',
                'color',
                'autoContrast',
                'radius',
                'role',
                'duration',
                'pauseOnHover',
                'pauseOnFocus',
                'closable',
                'closeLabel',
            ],
        },
    },
    render: (args) => ({
        components: { Button, IconTrash2, Toast },
        setup() {
            const { close, open, toastProps } = useToastState({ defaultOpen: true });
            const isPresent = ref(true);

            function showAgain() {
                isPresent.value = true;
                open();
            }

            return {
                args,
                close,
                isPresent,
                onAfterLeave: () => (isPresent.value = false),
                showAgain,
                toastProps,
            };
        },
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 280px; place-items: center; padding: 40px;">
                <Button v-if="!isPresent" variant="outline" @click="showAgain()">Show again</Button>
                <Toast v-bind="{ ...args, ...toastProps }" @after-leave="onAfterLeave()">
                    <template #icon><IconTrash2 /></template>
                    <template #title>File moved to trash</template>
                    The file will be permanently deleted in 30 days.
                    <template #action>
                        <Button type="button" size="sm" color="violet" variant="outline" @click="close()">
                            Got it
                        </Button>
                    </template>
                </Toast>
            </div>
        `,
    }),
};

export const Variants: Story = {
    args: {
        closable: false,
        role: 'none',
    },
    parameters: {
        controls: { disable: true },
    },
    render: (args) => ({
        components: { Toast },
        setup: () => ({ args, variants: toastVariants }),
        template: `
            <div style="box-sizing: border-box; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(352px, 100%), 1fr)); gap: 12px; padding: 40px;">
                <Toast
                    v-for="variant in variants"
                    :key="variant"
                    v-bind="args"
                    :variant="variant"
                    color="blue"
                    :title="variant"
                    description="The same notification with a different surface treatment."
                />
            </div>
        `,
    }),
};

export const Colors: Story = {
    args: {
        closable: false,
        role: 'none',
        variant: 'surface',
    },
    parameters: {
        controls: { disable: true },
    },
    render: (args) => ({
        components: { Toast },
        setup: () => ({ args, colors: toastColorExamples }),
        template: `
            <div style="box-sizing: border-box; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(352px, 100%), 1fr)); gap: 12px; padding: 40px;">
                <Toast
                    v-for="color in colors"
                    :key="color"
                    v-bind="args"
                    :color="color"
                    :title="color"
                    :description="color === '#ff3366' ? 'Custom CSS color' : 'Preset color token'"
                />
            </div>
        `,
    }),
};

export const Positions: Story = {
    parameters: {
        controls: { disable: true },
    },
    render: () => ({
        components: { PositionControls, ToastProvider, ToastViewport },
        setup() {
            const position = ref<ToastPosition>('top-right');
            return { position };
        },
        template: `
            <ToastProvider :duration="0">
                <div style="box-sizing: border-box; display: grid; min-height: 520px; place-items: center; padding: 48px;">
                    <PositionControls v-model="position" />
                </div>
                <ToastViewport :position="position" :teleport="false" />
            </ToastProvider>
        `,
    }),
};
