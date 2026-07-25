import { watch, type Ref } from 'vue';

export interface UseActiveDescendantScrollOptions {
    activeDescendantId: Readonly<Ref<string | undefined>>;
    collectionRef: Readonly<Ref<HTMLElement | null>>;
}

function findActiveDescendant(collection: HTMLElement, id: string) {
    const documentMatch = collection.ownerDocument.getElementById(id);
    if (documentMatch && collection.contains(documentMatch)) return documentMatch;

    return [...collection.querySelectorAll<HTMLElement>('[id]')].find(
        (element) => element.id === id,
    );
}

export function useActiveDescendantScroll(options: UseActiveDescendantScrollOptions) {
    watch(
        [options.activeDescendantId, options.collectionRef],
        ([id, collection]) => {
            if (!id || !collection) return;
            findActiveDescendant(collection, id)?.scrollIntoView?.({ block: 'nearest' });
        },
        { flush: 'post', immediate: true },
    );
}
