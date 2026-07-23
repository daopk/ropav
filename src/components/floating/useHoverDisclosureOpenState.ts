import { computed, onBeforeUnmount, toValue, watch } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { normalizeDelay } from '@/utils/number';
import {
    hasActiveHoverDisclosureInteraction,
    type HoverDisclosureInteractionModel,
} from './hoverDisclosureInteractionModel';
import type {
    HoverDisclosureOpenChangeDetails,
    HoverDisclosureOpenChangeReason,
    HoverDisclosureState,
    UseHoverDisclosureOptions,
} from './types';

export interface HoverDisclosureChangeRequest {
    event?: Event;
    open: boolean;
    reason: HoverDisclosureOpenChangeReason;
    timing: 'delayed' | 'immediate';
}

interface UseHoverDisclosureOpenStateOptions {
    interaction: HoverDisclosureInteractionModel;
    onContentClosed: () => void;
    options: Readonly<UseHoverDisclosureOptions>;
}

const defaultOpenDelay = 0;
const defaultCloseDelay = 0;

export function useHoverDisclosureOpenState({
    interaction,
    onContentClosed,
    options,
}: UseHoverDisclosureOpenStateOptions) {
    const controlledOpen = computed(() => toValue(options.open));
    const isDisabled = computed(() => Boolean(toValue(options.disabled)));
    let pendingChangeDetails: HoverDisclosureOpenChangeDetails | undefined;
    const controllableOpen = useControllableValue({
        modelValue: () => controlledOpen.value,
        defaultValue: () => options.defaultOpen === true && !isDisabled.value,
        onChange: (nextOpen) => {
            if (pendingChangeDetails) {
                options.onOpenChange?.(nextOpen, pendingChangeDetails);
            }
        },
    });
    const openState = controllableOpen.value;
    const isOpen = computed(() => !isDisabled.value && openState.value);
    const state = computed<HoverDisclosureState>(() => (isOpen.value ? 'open' : 'closed'));
    let requestedOpen = openState.value;
    let openTimer: ReturnType<typeof setTimeout> | undefined;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    function request(change: HoverDisclosureChangeRequest) {
        if (change.open) requestOpen(change);
        else requestClose(change);
    }

    function requestOpen(change: HoverDisclosureChangeRequest) {
        if (change.timing === 'immediate') {
            clearTimers();
            setOpen(true, change.reason, change.event);
            return;
        }
        if (disposed || isDisabled.value) return;

        clearCloseTimer();
        clearOpenTimer();
        if (requestedOpen) return;

        const delay = normalizeDelay(toValue(options.openDelay), defaultOpenDelay);
        if (delay === 0) {
            setOpen(true, change.reason, change.event);
            return;
        }

        openTimer = setTimeout(() => {
            openTimer = undefined;
            const interactionState = interaction.read();
            if (!interactionState.triggerHovered || isDisabled.value) return;
            setOpen(true, change.reason, change.event);
        }, delay);
    }

    function requestClose(change: HoverDisclosureChangeRequest) {
        if (change.timing === 'immediate') {
            clearTimers();
            setOpen(false, change.reason, change.event);
            return;
        }

        clearOpenTimer();
        clearCloseTimer();
        if (disposed || hasActiveHoverDisclosureInteraction(interaction.read())) {
            return;
        }

        closeTimer = setTimeout(
            () => {
                closeTimer = undefined;
                if (hasActiveHoverDisclosureInteraction(interaction.read())) {
                    return;
                }
                setOpen(false, change.reason, change.event);
            },
            normalizeDelay(toValue(options.closeDelay), defaultCloseDelay),
        );
    }

    function setOpen(nextOpen: boolean, reason: HoverDisclosureOpenChangeReason, event?: Event) {
        if (disposed || (nextOpen && isDisabled.value) || requestedOpen === nextOpen) {
            return;
        }

        requestedOpen = nextOpen;
        pendingChangeDetails = { reason, event };
        try {
            controllableOpen.setValue(nextOpen);
        } finally {
            pendingChangeDetails = undefined;
        }
    }

    function cancelScheduledClose() {
        clearCloseTimer();
    }

    function isRequestedOpen() {
        return requestedOpen;
    }

    function open() {
        request({
            open: true,
            reason: 'programmatic',
            timing: 'immediate',
        });
    }

    function close() {
        interaction.send({ type: 'set-touch-pinned', pinned: false });
        request({
            open: false,
            reason: 'programmatic',
            timing: 'immediate',
        });
    }

    function toggle() {
        if (requestedOpen || isOpen.value) close();
        else open();
    }

    function clearOpenTimer() {
        if (openTimer === undefined) return;
        clearTimeout(openTimer);
        openTimer = undefined;
    }

    function clearCloseTimer() {
        if (closeTimer === undefined) return;
        clearTimeout(closeTimer);
        closeTimer = undefined;
    }

    function clearTimers() {
        clearOpenTimer();
        clearCloseTimer();
    }

    watch(
        [openState, controllableOpen.isControlled],
        ([value]) => {
            requestedOpen = value;
            if (value) return;

            interaction.send({ type: 'reset', part: 'content' });
            interaction.send({
                type: 'set-touch-pinned',
                pinned: false,
            });
            onContentClosed();
        },
        { flush: 'sync' },
    );
    watch(isDisabled, (disabled) => {
        if (!disabled) return;

        interaction.send({ type: 'reset', part: 'all' });
        request({
            open: false,
            reason: 'disabled',
            timing: 'immediate',
        });
    });
    onBeforeUnmount(() => {
        disposed = true;
        clearTimers();
    });

    return {
        cancelScheduledClose,
        close,
        isDisabled,
        isOpen,
        isRequestedOpen,
        open,
        request,
        state,
        toggle,
    };
}
