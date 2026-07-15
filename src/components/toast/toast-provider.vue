<template>
    <slot />
</template>

<script lang="ts" setup vapor>
import {
    DEFAULT_TOAST_CLOSE_LABEL,
    DEFAULT_TOAST_CLOSABLE,
    DEFAULT_TOAST_DURATION,
    DEFAULT_TOAST_MAX,
    DEFAULT_TOAST_PAUSE_ON_FOCUS,
    DEFAULT_TOAST_PAUSE_ON_HOVER,
} from './defaults';
import { provideToast } from './useToast';
import type { ToastProviderProps } from './types';

defineOptions({ name: 'RpToastProvider' });

const props = withDefaults(defineProps<ToastProviderProps>(), {
    max: DEFAULT_TOAST_MAX,
    duration: DEFAULT_TOAST_DURATION,
    variant: undefined,
    color: undefined,
    autoContrast: undefined,
    radius: undefined,
    role: undefined,
    pauseOnHover: DEFAULT_TOAST_PAUSE_ON_HOVER,
    pauseOnFocus: DEFAULT_TOAST_PAUSE_ON_FOCUS,
    closable: DEFAULT_TOAST_CLOSABLE,
    closeLabel: DEFAULT_TOAST_CLOSE_LABEL,
});

provideToast(props);
</script>
