import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    toValue,
    watch,
    type MaybeRefOrGetter,
} from 'vue';
import { isNodeWithinElement } from '@/utils/dom/events';
import type { ToastCloseReason } from './types';

interface UseToastLifecycleOptions {
    isOpen: MaybeRefOrGetter<boolean>;
    duration: MaybeRefOrGetter<number>;
    pauseOnHover: MaybeRefOrGetter<boolean>;
    pauseOnFocus: MaybeRefOrGetter<boolean>;
    requestClose: (reason: ToastCloseReason) => void;
}

export function useToastLifecycle(options: Readonly<UseToastLifecycleOptions>) {
    const isOpen = computed(() => toValue(options.isOpen));
    const duration = computed(() => toValue(options.duration));
    const pauseOnHover = computed(() => toValue(options.pauseOnHover));
    const pauseOnFocus = computed(() => toValue(options.pauseOnFocus));

    let isMounted = false;
    let closePending = false;
    let pausedByHover = false;
    let pausedByFocus = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let timerStartedAt = 0;
    let remainingDuration = 0;

    function getDuration() {
        return Number.isFinite(duration.value) && duration.value > 0 ? duration.value : 0;
    }

    function clearTimer() {
        if (timer === undefined) return;
        clearTimeout(timer);
        timer = undefined;
    }

    function scheduleTimer() {
        if (!isOpen.value || remainingDuration <= 0 || pausedByHover || pausedByFocus) return;

        timerStartedAt = Date.now();
        timer = setTimeout(() => {
            timer = undefined;
            remainingDuration = 0;
            close('timeout');
        }, remainingDuration);
    }

    function resetTimer() {
        clearTimer();
        remainingDuration = getDuration();
        scheduleTimer();
    }

    function pauseTimer() {
        if (timer === undefined) return;
        remainingDuration = Math.max(0, remainingDuration - (Date.now() - timerStartedAt));
        clearTimer();

        if (remainingDuration === 0) close('timeout');
    }

    function resumeTimer() {
        if (pausedByHover || pausedByFocus) return;
        scheduleTimer();
    }

    function resetPauseState() {
        pausedByHover = false;
        pausedByFocus = false;
    }

    function onMouseenter() {
        if (!pauseOnHover.value) return;
        pausedByHover = true;
        pauseTimer();
    }

    function onMouseleave() {
        if (!pauseOnHover.value) return;
        pausedByHover = false;
        resumeTimer();
    }

    function onFocusin() {
        if (!pauseOnFocus.value) return;
        pausedByFocus = true;
        pauseTimer();
    }

    function onFocusout(event: FocusEvent) {
        if (!pauseOnFocus.value) return;
        if (isNodeWithinElement(event.relatedTarget, event.currentTarget)) return;

        pausedByFocus = false;
        resumeTimer();
    }

    function close(reason: ToastCloseReason) {
        if (closePending) return;

        closePending = true;
        clearTimer();
        options.requestClose(reason);

        // A controlled owner can close and reopen synchronously, which Vue batches into
        // a single unchanged `open` value. Restart here because the watcher will not run.
        if (isOpen.value) {
            resetTimer();
            void nextTick(() => {
                if (isOpen.value) closePending = false;
            });
        }
    }

    watch(isOpen, (open) => {
        if (open) closePending = false;
    });

    watch(pauseOnHover, (enabled) => {
        if (enabled || !pausedByHover) return;

        pausedByHover = false;
        resumeTimer();
    });

    watch(pauseOnFocus, (enabled) => {
        if (enabled || !pausedByFocus) return;

        pausedByFocus = false;
        resumeTimer();
    });

    watch([isOpen, duration], ([open], [wasOpen]) => {
        if (!isMounted) return;

        if (!open || !wasOpen) resetPauseState();
        resetTimer();
    });

    onMounted(() => {
        isMounted = true;
        resetTimer();
    });

    onBeforeUnmount(() => {
        isMounted = false;
        clearTimer();
    });

    return {
        close,
        rootEvents: {
            onMouseenter,
            onMouseleave,
            onFocusin,
            onFocusout,
        },
    };
}
