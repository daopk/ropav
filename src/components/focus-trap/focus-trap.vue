<template>
    <component
        :is="as"
        ref="containerRef"
        class="rp-focus-trap"
        :data-active="isActive || undefined"
        :data-paused="isPaused || undefined"
    >
        <slot v-bind="slotProps" />
    </component>
</template>

<script lang="ts" setup vapor>
import { computed, ref, watch } from 'vue';
import { useFocusTrap } from './useFocusTrap';
import type {
    FocusTrapPauseOptions,
    FocusTrapProps,
    FocusTrapSlotProps,
    FocusTrapUnpauseOptions,
} from './types';

defineOptions({ name: 'RpFocusTrap' });

const props = withDefaults(defineProps<FocusTrapProps>(), {
    active: true,
    paused: false,
    as: 'div',
    options: () => ({}),
});

const emit = defineEmits<{
    'update:active': [value: boolean];
    'update:paused': [value: boolean];
}>();

const containerRef = ref<HTMLElement | null>(null);
const { isActive, isPaused, activate, deactivate, pause, unpause } = useFocusTrap(
    containerRef,
    props.options,
);

const slotProps = computed<FocusTrapSlotProps>(() => ({
    active: isActive.value,
    paused: isPaused.value,
    activate,
    deactivate,
    pause: pauseTrap,
    unpause: unpauseTrap,
}));

function pauseTrap(options?: FocusTrapPauseOptions) {
    pause(options);
    if (!props.paused) emit('update:paused', true);
}

function unpauseTrap(options?: FocusTrapUnpauseOptions) {
    unpause(options);
    if (props.paused) emit('update:paused', false);
}

watch(
    () => props.active,
    (active) => {
        if (active) activate();
        else deactivate();
    },
    { flush: 'post', immediate: true },
);

watch(
    () => props.paused,
    (paused) => {
        if (paused) pause();
        else unpause();
    },
    { flush: 'post', immediate: true },
);

watch(isActive, (active) => {
    if (active !== props.active) emit('update:active', active);
});

void containerRef;
</script>
