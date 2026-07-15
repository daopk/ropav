<template>
    <Teleport :to="resolvedTeleportTo" :disabled="!teleport">
        <TransitionGroup tag="ol" name="rp-toast-viewport-item" v-bind="rootAttrs">
            <li
                v-for="toast in orderedToasts"
                :key="toast.instanceId"
                v-bind="getPartAttrs('item', { class: 'rp-toast-viewport__item' })"
                :data-type="toast.type"
            >
                <Toast
                    v-bind="toast.props"
                    :open="true"
                    :class-names="getToastClassNames(toast)"
                    :styles="getToastStyles(toast)"
                    :data-type="toast.type"
                    @close="context.dismissInstance(toast.instanceId, $event)"
                >
                    <template v-if="$slots.icon" #icon>
                        <slot name="icon" :toast="toast" :dismiss="() => dismiss(toast)" />
                    </template>

                    <slot v-if="$slots.default" :toast="toast" :dismiss="() => dismiss(toast)" />

                    <template v-if="$slots.action" #action>
                        <slot name="action" :toast="toast" :dismiss="() => dismiss(toast)" />
                    </template>
                </Toast>
            </li>
        </TransitionGroup>
    </Teleport>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { useStylesApi, type StylesApiClassNames, type StylesApiStyles } from '@/styles-api';
import Toast from './toast.vue';
import { useTeleportTarget } from '../teleport-provider/useTeleportTarget';
import type { ToastItem, ToastPart, ToastViewportPart, ToastViewportProps } from './types';
import { useToastContext } from './useToast';

defineOptions({ name: 'RpToastViewport', inheritAttrs: false });

const props = withDefaults(defineProps<ToastViewportProps>(), {
    position: 'top-right',
    label: 'Notifications',
    teleport: true,
});

const resolvedTeleportTo = useTeleportTarget(() => props.teleportTo);

const context = useToastContext('<ToastViewport>');
function reverseToasts(toasts: readonly ToastItem[]) {
    return toasts.map((_, index) => toasts[toasts.length - index - 1]);
}

const orderedToasts = computed(() =>
    props.position.startsWith('top') ? reverseToasts(context.toasts.value) : context.toasts.value,
);

const { getPartAttrs, getRootAttrs } = useStylesApi<ToastViewportPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: [
            'rp-toast-viewport',
            `rp-toast-viewport--${props.position}`,
            { 'rp-toast-viewport--empty': orderedToasts.value.length === 0 },
        ],
        'data-position': props.position,
        'aria-label': props.label,
    }),
);

const viewportToastPartMap: Record<ToastPart, ToastViewportPart> = {
    root: 'toast',
    icon: 'toastIcon',
    title: 'toastTitle',
    description: 'toastDescription',
    body: 'toastBody',
    action: 'toastAction',
    close: 'toastClose',
};

function getToastClassNames(toast: ToastItem): StylesApiClassNames<ToastPart> {
    return Object.fromEntries(
        Object.entries(viewportToastPartMap).map(([toastPart, viewportPart]) => [
            toastPart,
            [toast.props.classNames?.[toastPart as ToastPart], props.classNames?.[viewportPart]],
        ]),
    ) as StylesApiClassNames<ToastPart>;
}

function getToastStyles(toast: ToastItem): StylesApiStyles<ToastPart> {
    return Object.fromEntries(
        Object.entries(viewportToastPartMap).map(([toastPart, viewportPart]) => [
            toastPart,
            [toast.props.styles?.[toastPart as ToastPart], props.styles?.[viewportPart]],
        ]),
    ) as StylesApiStyles<ToastPart>;
}

function dismiss(toast: ToastItem) {
    context.dismissInstance(toast.instanceId);
}
</script>

<style src="./toast-viewport.scss" lang="scss" scoped></style>
