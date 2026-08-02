import { createFocusTrap, type FocusTrap as FocusTrapInstance } from 'focus-trap';
import { onBeforeUnmount, readonly, ref, shallowRef, toValue, watch } from 'vue';
import type {
    FocusTrapActivateOptions,
    FocusTrapContainers,
    FocusTrapDeactivateOptions,
    FocusTrapPauseOptions,
    FocusTrapTarget,
    FocusTrapUnpauseOptions,
    UseFocusTrapOptions,
    UseFocusTrapReturn,
} from './types';

function hasContainers(
    containers: FocusTrapContainers | null | undefined,
): containers is FocusTrapContainers {
    return Array.isArray(containers) ? containers.length > 0 : Boolean(containers);
}

export function useFocusTrap(
    target: FocusTrapTarget,
    options: Readonly<UseFocusTrapOptions> = {},
): UseFocusTrapReturn {
    const focusTrap = shallowRef<FocusTrapInstance | null>(null);
    const isActive = ref(false);
    const isPaused = ref(false);

    let shouldActivate = Boolean(options.immediate);
    let shouldPause = false;

    function syncState(trap: FocusTrapInstance) {
        isActive.value = trap.active;
        isPaused.value = trap.paused;
    }

    function createTrap(containers: FocusTrapContainers) {
        const { immediate: _immediate, ...focusTrapOptions } = options;
        const {
            onActivate,
            onDeactivate,
            onPause,
            onUnpause,
            onPostActivate,
            onPostDeactivate,
            onPostPause,
            onPostUnpause,
        } = focusTrapOptions;

        const trap = createFocusTrap(containers, {
            ...focusTrapOptions,
            onActivate(parameters) {
                syncState(parameters.trap);
                onActivate?.(parameters);
            },
            onPostActivate(parameters) {
                syncState(parameters.trap);
                onPostActivate?.(parameters);
            },
            onDeactivate(parameters) {
                syncState(parameters.trap);
                onDeactivate?.(parameters);
            },
            onPostDeactivate(parameters) {
                syncState(parameters.trap);
                onPostDeactivate?.(parameters);
            },
            onPause(parameters) {
                syncState(parameters.trap);
                onPause?.(parameters);
            },
            onPostPause(parameters) {
                syncState(parameters.trap);
                onPostPause?.(parameters);
            },
            onUnpause(parameters) {
                syncState(parameters.trap);
                onUnpause?.(parameters);
            },
            onPostUnpause(parameters) {
                syncState(parameters.trap);
                onPostUnpause?.(parameters);
            },
        });

        focusTrap.value = trap;
        return trap;
    }

    function activate(activateOptions?: FocusTrapActivateOptions) {
        shouldActivate = true;
        shouldPause = false;

        const trap = focusTrap.value;
        if (!trap) return;

        trap.activate(activateOptions);
        syncState(trap);
    }

    function deactivate(deactivateOptions?: FocusTrapDeactivateOptions) {
        shouldActivate = false;
        shouldPause = false;

        const trap = focusTrap.value;
        if (!trap) return;

        trap.deactivate(deactivateOptions);
        syncState(trap);
    }

    function pause(pauseOptions?: FocusTrapPauseOptions) {
        shouldPause = true;

        const trap = focusTrap.value;
        if (!trap) return;

        trap.pause(pauseOptions);
        syncState(trap);
    }

    function unpause(unpauseOptions?: FocusTrapUnpauseOptions) {
        shouldPause = false;

        const trap = focusTrap.value;
        if (!trap) return;

        trap.unpause(unpauseOptions);
        syncState(trap);
    }

    function updateContainerElements(containers: FocusTrapContainers) {
        const trap = focusTrap.value ?? createTrap(containers);
        trap.updateContainerElements(containers);
        syncState(trap);
    }

    watch(
        () => toValue(target),
        (containers) => {
            if (!hasContainers(containers)) {
                focusTrap.value?.deactivate({ returnFocus: false });
                focusTrap.value = null;
                isActive.value = false;
                isPaused.value = false;
                return;
            }

            const trap = focusTrap.value ?? createTrap(containers);
            trap.updateContainerElements(containers);

            if (shouldActivate && !trap.active) trap.activate();
            if (shouldPause && trap.active && !trap.paused) trap.pause();
            syncState(trap);
        },
        { flush: 'post', immediate: true },
    );

    onBeforeUnmount(() => {
        shouldActivate = false;
        shouldPause = false;
        focusTrap.value?.deactivate();
        focusTrap.value = null;
        isActive.value = false;
        isPaused.value = false;
    });

    return {
        focusTrap,
        isActive: readonly(isActive),
        isPaused: readonly(isPaused),
        activate,
        deactivate,
        pause,
        unpause,
        updateContainerElements,
    };
}
