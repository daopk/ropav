<template>
    <Transition name="rp-toast" @after-leave="emit('after-leave')">
        <div v-if="isOpen" v-bind="rootAttrs">
            <div
                v-if="hasIcon"
                v-bind="getPartAttrs('icon', { class: 'rp-toast__icon' })"
                aria-hidden="true"
            >
                <slot name="icon" />
            </div>

            <div v-if="hasContent" class="rp-toast__content">
                <div v-if="hasTitle" v-bind="getPartAttrs('title', { class: 'rp-toast__title' })">
                    <slot name="title">
                        {{ title }}
                    </slot>
                </div>
                <p
                    v-if="hasDescription"
                    v-bind="getPartAttrs('description', { class: 'rp-toast__description' })"
                >
                    {{ description }}
                </p>
                <div
                    v-if="$slots.default"
                    v-bind="getPartAttrs('body', { class: 'rp-toast__body' })"
                >
                    <slot />
                </div>
            </div>

            <div
                v-if="$slots.action"
                v-bind="getPartAttrs('action', { class: 'rp-toast__action' })"
            >
                <slot name="action" />
            </div>

            <button
                v-if="closable"
                v-bind="getPartAttrs('close', { class: 'rp-toast__close' })"
                type="button"
                :aria-label="closeLabel"
                @click="closeToast('dismiss')"
            >
                <IconX aria-hidden="true" />
            </button>
        </div>
    </Transition>
</template>

<script lang="ts" setup vapor>
import { computed, useSlots } from 'vue';
import IconX from '~icons/lucide/x';
import { useControllableValue } from '@/composables/useControllableValue';
import { bem } from '@/utils/bem';
import { useStylesApi } from '@/styles-api';
import {
    DEFAULT_TOAST_CLOSE_LABEL,
    DEFAULT_TOAST_CLOSABLE,
    DEFAULT_TOAST_DURATION,
    DEFAULT_TOAST_PAUSE_ON_FOCUS,
    DEFAULT_TOAST_PAUSE_ON_HOVER,
    DEFAULT_TOAST_ROLE,
} from './defaults';
import type { ToastCloseReason, ToastPart, ToastProps } from './types';
import { getToastColorStyle } from './toastColor';
import { useToastLifecycle } from './useToastLifecycle';

defineOptions({ name: 'RpToast', inheritAttrs: false });

const props = withDefaults(defineProps<ToastProps>(), {
    open: undefined,
    title: '',
    description: '',
    autoContrast: true,
    role: DEFAULT_TOAST_ROLE,
    duration: DEFAULT_TOAST_DURATION,
    pauseOnHover: DEFAULT_TOAST_PAUSE_ON_HOVER,
    pauseOnFocus: DEFAULT_TOAST_PAUSE_ON_FOCUS,
    closable: DEFAULT_TOAST_CLOSABLE,
    closeLabel: DEFAULT_TOAST_CLOSE_LABEL,
});

const emit = defineEmits<{
    'update:open': [value: boolean];
    close: [reason: ToastCloseReason];
    'after-leave': [];
}>();

const slots = useSlots();
const controllableOpen = useControllableValue({
    modelValue: () => props.open,
    defaultValue: () => true,
    onChange: (open) => emit('update:open', open),
});
const isOpen = controllableOpen.value;
const { close: closeToast, rootEvents } = useToastLifecycle({
    isOpen,
    duration: () => props.duration,
    pauseOnHover: () => props.pauseOnHover,
    pauseOnFocus: () => props.pauseOnFocus,
    requestClose(reason) {
        controllableOpen.setValue(false);
        emit('close', reason);
    },
});

const hasTitle = computed(() => Boolean(props.title || slots.title));
const hasDescription = computed(() => Boolean(props.description));
const hasContent = computed(() => Boolean(hasTitle.value || hasDescription.value || slots.default));
const resolvedRole = computed(() => (props.role === 'none' ? undefined : props.role));
const hasIcon = computed(() => Boolean(slots.icon));

const rootClass = computed(() =>
    bem('rp-toast', {
        [props.variant ?? '']: Boolean(props.variant),
        [`radius-${props.radius}`]: Boolean(props.radius),
    }),
);

const rootStyle = computed(() =>
    getToastColorStyle(props.color, props.variant, props.autoContrast, props.contrastColor),
);
const { getPartAttrs, getRootAttrs } = useStylesApi<ToastPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: rootClass.value,
        style: rootStyle.value,
        role: resolvedRole.value,
        ...rootEvents,
    }),
);
</script>

<style src="./toast.scss" lang="scss" scoped></style>
