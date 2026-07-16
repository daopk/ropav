import { computed, ref, watch } from 'vue';
import {
    DEFAULT_TOAST_CLOSABLE,
    DEFAULT_TOAST_CLOSE_LABEL,
    DEFAULT_TOAST_DURATION,
    DEFAULT_TOAST_MAX,
    DEFAULT_TOAST_PAUSE_ON_FOCUS,
    DEFAULT_TOAST_PAUSE_ON_HOVER,
} from './defaults';
import type {
    ToastCloseReason,
    ToastColor,
    ToastId,
    ToastInput,
    ToastItem,
    ToastOptions,
    ToastProps,
    ToastRole,
    ToastStore,
    ToastStoreOptions,
    ToastType,
    ToastUpdateOptions,
} from './types';

const TYPE_DEFAULTS: Record<ToastType, Readonly<{ color?: ToastColor; role?: ToastRole }>> = {
    default: {},
    success: { color: 'green' },
    error: { color: 'red', role: 'alert' },
    warning: { color: 'yellow', role: 'alert' },
    info: { color: 'blue' },
};

function withoutUndefined<T extends object>(value: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(value).filter(([, entry]) => entry !== undefined),
    ) as Partial<T>;
}

function normalizeMax(max: number | undefined) {
    if (max === Infinity) return Infinity;
    if (!Number.isFinite(max)) return DEFAULT_TOAST_MAX;
    return Math.max(1, Math.floor(max ?? DEFAULT_TOAST_MAX));
}

function normalizeInput(input: ToastInput, options: ToastOptions | undefined): ToastOptions {
    const value = typeof input === 'string' ? { title: input } : input;
    return { ...value, ...options };
}

function splitOptions(options: ToastOptions) {
    const { id, type, onClose, ...toastProps } = options;
    return { id, type, onClose, toastProps: withoutUndefined(toastProps) };
}

function getStoreDefaults(options: Readonly<ToastStoreOptions>) {
    return withoutUndefined<Omit<ToastProps, 'open' | 'title' | 'description'>>({
        duration: options.duration ?? DEFAULT_TOAST_DURATION,
        variant: options.variant,
        color: options.color,
        autoContrast: options.autoContrast,
        radius: options.radius,
        role: options.role,
        pauseOnHover: options.pauseOnHover ?? DEFAULT_TOAST_PAUSE_ON_HOVER,
        pauseOnFocus: options.pauseOnFocus ?? DEFAULT_TOAST_PAUSE_ON_FOCUS,
        closable: options.closable ?? DEFAULT_TOAST_CLOSABLE,
        closeLabel: options.closeLabel ?? DEFAULT_TOAST_CLOSE_LABEL,
    });
}

function replaceAt<T>(items: readonly T[], index: number, value: T) {
    const nextItems = items.slice();
    nextItems[index] = value;
    return nextItems;
}

function notify(item: ToastItem, reason: ToastCloseReason) {
    item.onClose?.(reason);
}

interface ToastRecord {
    type: ToastType;
    props: Partial<Omit<ToastProps, 'open'>>;
    onClose?: (reason: ToastCloseReason) => void;
}

function partitionOverflow(items: ToastItem[], max: number) {
    if (max === Infinity || items.length <= max) return { kept: items, evicted: [] };

    const overflow = items.length - max;
    return {
        kept: items.slice(overflow),
        evicted: items.slice(0, overflow),
    };
}

export function createToastStore(options: Readonly<ToastStoreOptions> = {}): ToastStore {
    const items = ref<ToastItem[]>([]);
    const toasts = computed<readonly ToastItem[]>(() => items.value);
    const records = new Map<string, ToastRecord>();
    let sequence = 0;

    function createInstanceId() {
        sequence += 1;
        return `rp-toast-${sequence}`;
    }

    function resolveItem(id: ToastId, instanceId: string, record: ToastRecord): ToastItem {
        return {
            id,
            instanceId,
            type: record.type,
            props: {
                ...TYPE_DEFAULTS[record.type],
                ...getStoreDefaults(options),
                ...record.props,
            },
            onClose: record.onClose,
        };
    }

    function forget(removedItems: readonly ToastItem[]) {
        for (const item of removedItems) records.delete(item.instanceId);
    }

    function notifyAll(removedItems: readonly ToastItem[], reason: ToastCloseReason) {
        for (const item of removedItems) notify(item, reason);
    }

    function create(type: ToastType, input: ToastInput, createOptions?: ToastOptions) {
        const normalized = normalizeInput(input, createOptions);
        const split = splitOptions(normalized);
        const instanceId = createInstanceId();
        const id = split.id ?? instanceId;
        const record: ToastRecord = {
            type: split.type ?? type,
            props: split.toastProps,
            onClose: split.onClose,
        };
        const item = resolveItem(id, instanceId, record);

        const replaced = items.value.filter((current) => current.id === id);
        const activeItems = items.value.filter((current) => current.id !== id);
        const { kept, evicted } = partitionOverflow(
            [...activeItems, item],
            normalizeMax(options.max),
        );

        records.set(instanceId, record);
        forget([...replaced, ...evicted]);
        items.value = kept;

        // Commit first so callbacks can safely create, update, or dismiss another toast.
        notifyAll(replaced, 'replace');
        notifyAll(evicted, 'overflow');
        return id;
    }

    function show(input: ToastInput, createOptions?: ToastOptions) {
        return create('default', input, createOptions);
    }

    function success(input: ToastInput, createOptions?: ToastOptions) {
        return create('success', input, createOptions);
    }

    function error(input: ToastInput, createOptions?: ToastOptions) {
        return create('error', input, createOptions);
    }

    function warning(input: ToastInput, createOptions?: ToastOptions) {
        return create('warning', input, createOptions);
    }

    function info(input: ToastInput, createOptions?: ToastOptions) {
        return create('info', input, createOptions);
    }

    function update(id: ToastId, updateOptions: ToastUpdateOptions) {
        const index = items.value.findIndex((item) => item.id === id);
        if (index === -1) return;

        const current = items.value[index];
        const record = records.get(current.instanceId);
        if (!record) return;

        const { type, onClose, ...toastProps } = updateOptions;
        const nextRecord: ToastRecord = {
            type: type ?? record.type,
            props: {
                ...record.props,
                ...withoutUndefined(toastProps),
            },
            onClose: Object.hasOwn(updateOptions, 'onClose') ? onClose : record.onClose,
        };

        records.set(current.instanceId, nextRecord);
        items.value = replaceAt(
            items.value,
            index,
            resolveItem(current.id, current.instanceId, nextRecord),
        );
    }

    function closeAt(index: number, reason: ToastCloseReason) {
        if (index === -1) return;

        const current = items.value[index];
        records.delete(current.instanceId);
        items.value = items.value.filter((_, currentIndex) => currentIndex !== index);
        notify(current, reason);
    }

    function dismiss(id: ToastId, reason: ToastCloseReason = 'dismiss') {
        closeAt(
            items.value.findIndex((item) => item.id === id),
            reason,
        );
    }

    function dismissAll(reason: ToastCloseReason = 'dismiss') {
        const dismissed = items.value;
        records.clear();
        items.value = [];
        notifyAll(dismissed, reason);
    }

    const store: ToastStore = {
        toasts,
        show,
        success,
        error,
        warning,
        info,
        update,
        dismiss,
        dismissAll,
    };

    watch(
        () => normalizeMax(options.max),
        (max) => {
            const { kept, evicted } = partitionOverflow(items.value, max);
            if (evicted.length === 0) return;

            forget(evicted);
            items.value = kept;
            notifyAll(evicted, 'overflow');
        },
        { flush: 'sync' },
    );

    return store;
}
