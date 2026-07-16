import { reactive } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import { createToastStore } from './toast-store';

describe('createToastStore', () => {
    it('manages toast state outside component setup and isolates store instances', () => {
        const onClose = vi.fn();
        const firstStore = createToastStore({ duration: 0 });
        const secondStore = createToastStore({ duration: 0 });

        const id = firstStore.success('Saving', { onClose });
        firstStore.update(id, { title: 'Saved', description: 'All changes persisted.' });

        expect(firstStore.toasts.value).toHaveLength(1);
        expect(firstStore.toasts.value[0]).toMatchObject({
            id,
            type: 'success',
            props: {
                color: 'green',
                description: 'All changes persisted.',
                title: 'Saved',
            },
        });
        expect(secondStore.toasts.value).toHaveLength(0);

        secondStore.show('One');
        secondStore.show('Two');
        secondStore.dismissAll();
        expect(secondStore.toasts.value).toHaveLength(0);

        firstStore.dismiss(id);
        firstStore.dismiss(id);

        expect(firstStore.toasts.value).toHaveLength(0);
        expect(onClose).toHaveBeenCalledOnce();
        expect(onClose).toHaveBeenCalledWith('dismiss');
    });

    it('replaces a duplicate id with a fresh instance and a replace close reason', () => {
        const onReplaced = vi.fn();
        const store = createToastStore({ duration: 0 });

        store.show('First', { id: 'upload', onClose: onReplaced });
        const firstInstanceId = store.toasts.value[0].instanceId;
        store.success('Complete', { id: 'upload' });

        expect(onReplaced).toHaveBeenCalledOnce();
        expect(onReplaced).toHaveBeenCalledWith('replace');
        expect(store.toasts.value).toHaveLength(1);
        expect(store.toasts.value[0]).toMatchObject({ id: 'upload', type: 'success' });
        expect(store.toasts.value[0].instanceId).not.toBe(firstInstanceId);
    });

    it('evicts the oldest toast with overflow and supports reactive max changes', () => {
        const options = reactive({ duration: 0, max: 3 });
        const firstClose = vi.fn();
        const secondClose = vi.fn();
        const store = createToastStore(options);

        store.show('First', { onClose: firstClose });
        store.show('Second', { onClose: secondClose });
        store.show('Third');
        store.show('Fourth');

        expect(firstClose).toHaveBeenCalledWith('overflow');
        expect(store.toasts.value.map((toast) => toast.props.title)).toEqual([
            'Second',
            'Third',
            'Fourth',
        ]);

        options.max = 1;

        expect(secondClose).toHaveBeenCalledWith('overflow');
        expect(store.toasts.value.map((toast) => toast.props.title)).toEqual(['Fourth']);
    });

    it('commits overflow before invoking re-entrant close callbacks', () => {
        const store = createToastStore({ duration: 0, max: 1 });
        const onClose = vi.fn(() => store.show('Created from callback'));

        store.show('First', { onClose });
        expect(() => store.show('Second')).not.toThrow();

        expect(onClose).toHaveBeenCalledOnce();
        expect(onClose).toHaveBeenCalledWith('overflow');
        expect(store.toasts.value).toHaveLength(1);
        expect(store.toasts.value[0].props.title).toBe('Created from callback');
    });
});
