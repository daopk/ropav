<template>
    <Teleport :to="teleportTo" :disabled="!teleport">
        <TransitionGroup
            tag="ol"
            name="rp-toast-viewport-item"
            :class="[
                'rp-toast-viewport',
                `rp-toast-viewport--${position}`,
                { 'rp-toast-viewport--empty': orderedToasts.length === 0 },
            ]"
            :data-position="position"
            :aria-label="label"
        >
            <li
                v-for="toast in orderedToasts"
                :key="toast.instanceId"
                class="rp-toast-viewport__item"
            >
                <Toast
                    v-bind="toast.props"
                    :open="true"
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
import Toast from './toast.vue';
import type { ToastItem, ToastViewportProps } from './types';
import { useToastContext } from './useToast';

defineOptions({ name: 'RpToastViewport' });

const props = withDefaults(defineProps<ToastViewportProps>(), {
    position: 'top-right',
    label: 'Notifications',
    teleport: true,
    teleportTo: 'body',
});

const context = useToastContext('<ToastViewport>');
function reverseToasts(toasts: readonly ToastItem[]) {
    return toasts.map((_, index) => toasts[toasts.length - index - 1]);
}

const orderedToasts = computed(() =>
    props.position.startsWith('top') ? reverseToasts(context.toasts.value) : context.toasts.value,
);

function dismiss(toast: ToastItem) {
    context.dismissInstance(toast.instanceId);
}
</script>

<style src="./toast-viewport.scss" lang="scss" scoped></style>
