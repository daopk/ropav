import { describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref, type Ref } from 'vue';
import { useActiveDescendantScroll } from './useActiveDescendantScroll';

function observeActiveDescendant(
    activeDescendantId: Ref<string | undefined>,
    collectionRef: Ref<HTMLElement | null>,
) {
    const scope = effectScope();
    scope.run(() => {
        useActiveDescendantScroll({ activeDescendantId, collectionRef });
    });
    return scope;
}

async function flushScroll() {
    await nextTick();
    await nextTick();
}

describe('useActiveDescendantScroll', () => {
    it('scrolls the exact active descendant into view', async () => {
        const collection = document.createElement('div');
        const firstOption = document.createElement('div');
        const activeOption = document.createElement('div');
        firstOption.id = 'fruit-option-0';
        activeOption.id = 'fruit-option-1';
        activeOption.scrollIntoView = vi.fn();
        collection.append(firstOption, activeOption);
        document.body.append(collection);

        const activeDescendantId = ref<string>();
        const collectionRef = ref<HTMLElement | null>(collection);
        const scope = observeActiveDescendant(activeDescendantId, collectionRef);

        activeDescendantId.value = activeOption.id;
        await flushScroll();

        expect(activeOption.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
        scope.stop();
        collection.remove();
    });

    it('supports special-character ids and a collection that resolves later', async () => {
        const collection = document.createElement('div');
        const activeOption = document.createElement('div');
        activeOption.id = 'fruit:"[option]';
        activeOption.scrollIntoView = vi.fn();
        collection.append(activeOption);

        const activeDescendantId = ref<string | undefined>(activeOption.id);
        const collectionRef = ref<HTMLElement | null>(null);
        const scope = observeActiveDescendant(activeDescendantId, collectionRef);

        collectionRef.value = collection;
        await flushScroll();

        expect(activeOption.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
        scope.stop();
    });

    it('ignores missing, outside, and stale active descendants', async () => {
        const collection = document.createElement('div');
        const outsideOption = document.createElement('div');
        const staleOption = document.createElement('div');
        outsideOption.id = 'outside-option';
        staleOption.id = 'stale-option';
        outsideOption.scrollIntoView = vi.fn();
        staleOption.scrollIntoView = vi.fn();
        collection.append(staleOption);
        document.body.append(collection, outsideOption);

        const activeDescendantId = ref<string>();
        const collectionRef = ref<HTMLElement | null>(collection);
        const scope = observeActiveDescendant(activeDescendantId, collectionRef);

        activeDescendantId.value = outsideOption.id;
        await flushScroll();
        activeDescendantId.value = staleOption.id;
        activeDescendantId.value = undefined;
        await flushScroll();

        expect(outsideOption.scrollIntoView).not.toHaveBeenCalled();
        expect(staleOption.scrollIntoView).not.toHaveBeenCalled();
        scope.stop();
        collection.remove();
        outsideOption.remove();
    });
});
