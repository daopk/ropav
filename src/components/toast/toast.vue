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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue';
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
import { getToastColorStyle } from './useToastColor';

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
const isMounted = ref(false);
const pausedByHover = ref(false);
const pausedByFocus = ref(false);

let closePending = false;

let timer: ReturnType<typeof setTimeout> | undefined;
let timerStartedAt = 0;
let remainingDuration = 0;

watch(
    () => props.open,
    (open) => {
        if (open) closePending = false;
    },
);

watch(
    () => props.pauseOnHover,
    (pauseOnHover) => {
        if (pauseOnHover || !pausedByHover.value) return;

        pausedByHover.value = false;
        resumeTimer();
    },
);

watch(
    () => props.pauseOnFocus,
    (pauseOnFocus) => {
        if (pauseOnFocus || !pausedByFocus.value) return;

        pausedByFocus.value = false;
        resumeTimer();
    },
);

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
        onMouseenter,
        onMouseleave,
        onFocusin,
        onFocusout,
    }),
);

watch([isOpen, () => props.duration], ([open], [wasOpen]) => {
    if (!isMounted.value) return;

    if (!open || !wasOpen) {
        pausedByHover.value = false;
        pausedByFocus.value = false;
    }

    resetTimer();
});

onMounted(() => {
    isMounted.value = true;
    resetTimer();
});

onBeforeUnmount(clearTimer);

function getDuration() {
    return Number.isFinite(props.duration) && props.duration > 0 ? props.duration : 0;
}

function resetTimer() {
    clearTimer();
    remainingDuration = getDuration();
    scheduleTimer();
}

function scheduleTimer() {
    if (!isOpen.value || remainingDuration <= 0 || pausedByHover.value || pausedByFocus.value) {
        return;
    }

    timerStartedAt = Date.now();
    timer = setTimeout(() => {
        timer = undefined;
        remainingDuration = 0;
        closeToast('timeout');
    }, remainingDuration);
}

function clearTimer() {
    if (timer === undefined) return;
    clearTimeout(timer);
    timer = undefined;
}

function pauseTimer() {
    if (timer === undefined) return;
    remainingDuration = Math.max(0, remainingDuration - (Date.now() - timerStartedAt));
    clearTimer();

    if (remainingDuration === 0) closeToast('timeout');
}

function resumeTimer() {
    if (pausedByHover.value || pausedByFocus.value) return;
    scheduleTimer();
}

function onMouseenter() {
    if (!props.pauseOnHover) return;
    pausedByHover.value = true;
    pauseTimer();
}

function onMouseleave() {
    if (!props.pauseOnHover) return;
    pausedByHover.value = false;
    resumeTimer();
}

function onFocusin() {
    if (!props.pauseOnFocus) return;
    pausedByFocus.value = true;
    pauseTimer();
}

function onFocusout(event: FocusEvent) {
    if (!props.pauseOnFocus) return;

    const currentTarget = event.currentTarget;
    if (
        currentTarget instanceof HTMLElement &&
        event.relatedTarget instanceof Node &&
        currentTarget.contains(event.relatedTarget)
    ) {
        return;
    }

    pausedByFocus.value = false;
    resumeTimer();
}

function closeToast(reason: ToastCloseReason) {
    if (closePending) return;

    closePending = true;
    clearTimer();
    controllableOpen.setValue(false);
    emit('close', reason);

    // A controlled owner can close and reopen synchronously, which Vue batches into
    // a single unchanged `open` value. Restart here because the watcher will not run.
    if (isOpen.value) {
        resetTimer();
        void nextTick(() => {
            if (isOpen.value) closePending = false;
        });
    }
}
</script>

<style src="./toast.scss" lang="scss" scoped></style>
