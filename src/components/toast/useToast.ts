import { inject, provide } from 'vue';
import type { ToastCloseReason, ToastProviderContext, ToastStore, UseToastReturn } from './types';
import { toastProviderKey } from './types';

export function provideToast(store: ToastStore): ToastProviderContext {
    function dismissInstance(instanceId: string, reason: ToastCloseReason = 'dismiss') {
        const item = store.toasts.value.find((current) => current.instanceId === instanceId);
        if (item) store.dismiss(item.id, reason);
    }

    const context: ToastProviderContext = {
        ...store,
        dismissInstance,
    };

    provide(toastProviderKey, context);
    return context;
}

export function useToastContext(consumer: string): ToastProviderContext {
    const context = inject(toastProviderKey);
    if (!context) {
        throw new Error(`[Ropav] ${consumer} must be used inside <ToastProvider>.`);
    }
    return context;
}

export function useToast(): UseToastReturn {
    return useToastContext('useToast()');
}
