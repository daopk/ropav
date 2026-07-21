import {
    computed,
    inject,
    onBeforeUnmount,
    provide,
    readonly,
    ref,
    shallowRef,
    toValue,
    watch,
    type ComputedRef,
    type InjectionKey,
    type MaybeRefOrGetter,
    type Ref,
    type ShallowRef,
} from 'vue';

interface InertSnapshot {
    ariaHidden: string | null;
    inert: boolean;
}

interface OverlayLayerState {
    layers: OverlayLayerContext[];
    inertSnapshots: Map<HTMLElement, InertSnapshot>;
    originalBodyOverflow: string;
    scrollLocked: boolean;
    observer: MutationObserver | null;
    syncQueued: boolean;
}

export interface OverlayLayerContext {
    id: symbol;
    element: Ref<HTMLElement | null>;
    active: ComputedRef<boolean>;
    modal: ComputedRef<boolean>;
    modalEffects: boolean;
    preventScroll: ComputedRef<boolean>;
    branches: Readonly<ShallowRef<readonly HTMLElement[]>>;
    focusBranches: Readonly<ShallowRef<readonly HTMLElement[]>>;
    zIndex: Readonly<Ref<number>>;
    isTopLayer: () => boolean;
    isInside: (event: Event, additional?: readonly (Element | null | undefined)[]) => boolean;
    registerBranch: (
        element: HTMLElement,
        options?: { focus?: boolean; inside?: boolean },
    ) => () => void;
}

export interface UseOverlayLayerOptions {
    active: MaybeRefOrGetter<boolean>;
    element: Ref<HTMLElement | null>;
    modal?: MaybeRefOrGetter<boolean>;
    modalEffects?: boolean;
    preventScroll?: MaybeRefOrGetter<boolean>;
    baseZIndex?: MaybeRefOrGetter<number>;
}

const overlayLayerKey = Symbol('overlay-layer') as InjectionKey<OverlayLayerContext>;
const documentStates = new WeakMap<Document, OverlayLayerState>();
const layerMetadata = new WeakMap<
    OverlayLayerContext,
    {
        baseZIndex: ComputedRef<number>;
        parent: OverlayLayerContext | null;
        setZIndex: (value: number) => void;
    }
>();

function createState(): OverlayLayerState {
    return {
        layers: [],
        inertSnapshots: new Map(),
        originalBodyOverflow: '',
        scrollLocked: false,
        observer: null,
        syncQueued: false,
    };
}

function getState(document: Document) {
    const existing = documentStates.get(document);
    if (existing) return existing;
    const state = createState();
    documentStates.set(document, state);
    return state;
}

function isDescendantLayer(layer: OverlayLayerContext, ancestor: OverlayLayerContext) {
    let parent = layerMetadata.get(layer)?.parent ?? null;
    while (parent) {
        if (parent === ancestor) return true;
        parent = layerMetadata.get(parent)?.parent ?? null;
    }
    return false;
}

function syncLayerZIndices(state: OverlayLayerState) {
    let highestZIndex = Number.NEGATIVE_INFINITY;
    for (const layer of state.layers) {
        const metadata = layerMetadata.get(layer);
        if (!metadata) continue;
        const zIndex = Math.max(metadata.baseZIndex.value, highestZIndex + 2);
        metadata.setZIndex(zIndex);
        highestZIndex = zIndex;
    }
}

function isEventWithinElement(event: Event, element: Element) {
    const path = event.composedPath();
    if (path.length > 0) {
        return path.some(
            (entry) =>
                entry === element ||
                (typeof Node !== 'undefined' && entry instanceof Node && element.contains(entry)),
        );
    }
    return (
        typeof Node !== 'undefined' &&
        event.target instanceof Node &&
        element.contains(event.target)
    );
}

function restoreInertBackground(state: OverlayLayerState) {
    for (const [element, snapshot] of state.inertSnapshots) {
        element.inert = snapshot.inert;
        if (snapshot.ariaHidden == null) element.removeAttribute('aria-hidden');
        else element.setAttribute('aria-hidden', snapshot.ariaHidden);
    }
    state.inertSnapshots.clear();
}

function inertElement(state: OverlayLayerState, element: HTMLElement) {
    if (!state.inertSnapshots.has(element)) {
        state.inertSnapshots.set(element, {
            ariaHidden: element.getAttribute('aria-hidden'),
            inert: Boolean(element.inert),
        });
    }
    element.inert = true;
    element.setAttribute('aria-hidden', 'true');
}

function inertUnprotectedBranches(
    state: OverlayLayerState,
    parent: HTMLElement,
    protectedRoots: readonly HTMLElement[],
) {
    for (const child of parent.children) {
        if (!(child instanceof HTMLElement)) continue;
        const protectsLayer = protectedRoots.some((root) => child === root || child.contains(root));
        if (!protectsLayer) {
            inertElement(state, child);
            continue;
        }
        if (!protectedRoots.includes(child)) {
            inertUnprotectedBranches(state, child, protectedRoots);
        }
    }
}

function stopObserver(state: OverlayLayerState) {
    state.observer?.disconnect();
    state.observer = null;
    state.syncQueued = false;
}

function unlockScroll(document: Document, state: OverlayLayerState) {
    if (!state.scrollLocked) return;
    document.body.style.overflow = state.originalBodyOverflow;
    state.scrollLocked = false;
}

function queueModalEffects(document: Document, state: OverlayLayerState) {
    if (state.syncQueued) return;
    state.syncQueued = true;
    queueMicrotask(() => {
        state.syncQueued = false;
        syncModalEffects(document, state);
    });
}

function startObserver(document: Document, state: OverlayLayerState) {
    if (state.observer || typeof MutationObserver === 'undefined') return;
    state.observer = new MutationObserver(() => queueModalEffects(document, state));
    state.observer.observe(document.body, { childList: true, subtree: true });
}

function syncModalEffects(document: Document, state: OverlayLayerState) {
    restoreInertBackground(state);

    let modalIndex = -1;
    for (let index = state.layers.length - 1; index >= 0; index -= 1) {
        const layer = state.layers[index];
        if (layer?.modalEffects && layer.modal.value) {
            modalIndex = index;
            break;
        }
    }

    const shouldLock = state.layers.some(
        (layer) => layer.modalEffects && layer.modal.value && layer.preventScroll.value,
    );
    if (shouldLock && !state.scrollLocked) {
        state.originalBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        state.scrollLocked = true;
    } else if (!shouldLock) {
        unlockScroll(document, state);
    }

    if (modalIndex < 0) {
        stopObserver(state);
        return;
    }

    const protectedRoots: HTMLElement[] = [];
    for (const layer of state.layers.slice(modalIndex)) {
        const element = layer.element.value;
        if (element?.isConnected) protectedRoots.push(element);
        for (const branch of layer.branches.value) {
            if (branch.isConnected) protectedRoots.push(branch);
        }
    }

    if (protectedRoots.length > 0) {
        inertUnprotectedBranches(state, document.body, protectedRoots);
        startObserver(document, state);
    }
}

function removeLayer(layer: OverlayLayerContext, document: Document, state: OverlayLayerState) {
    const index = state.layers.indexOf(layer);
    if (index >= 0) state.layers.splice(index, 1);
    syncLayerZIndices(state);
    syncModalEffects(document, state);
}

export function useOverlayLayer(options: UseOverlayLayerOptions): OverlayLayerContext {
    const parent = inject(overlayLayerKey, null);
    const active = computed(() => Boolean(toValue(options.active)));
    const modal = computed(() => Boolean(toValue(options.modal ?? false)));
    const preventScroll = computed(() => Boolean(toValue(options.preventScroll ?? true)));
    const branches = shallowRef<readonly HTMLElement[]>([]);
    const focusBranches = shallowRef<readonly HTMLElement[]>([]);
    const branchSet = new Set<HTMLElement>();
    const focusBranchSet = new Set<HTMLElement>();
    const insideBranchSet = new Set<HTMLElement>();
    const baseZIndex = computed(() => toValue(options.baseZIndex ?? 100));
    const zIndex = ref(baseZIndex.value);
    let registeredDocument: Document | null = null;
    let registeredElement: HTMLElement | null = null;
    let parentBranchCleanup: (() => void) | undefined;

    function syncBranches() {
        branches.value = [...branchSet];
        focusBranches.value = [...focusBranchSet];
        if (registeredDocument) {
            syncModalEffects(registeredDocument, getState(registeredDocument));
        }
    }

    function registerBranch(
        element: HTMLElement,
        branchOptions: { focus?: boolean; inside?: boolean } = {},
    ) {
        branchSet.add(element);
        if (branchOptions.focus !== false) focusBranchSet.add(element);
        if (branchOptions.inside !== false) insideBranchSet.add(element);
        const parentCleanup = parent?.registerBranch(element, branchOptions);
        syncBranches();
        return () => {
            branchSet.delete(element);
            focusBranchSet.delete(element);
            insideBranchSet.delete(element);
            parentCleanup?.();
            syncBranches();
        };
    }

    function replaceParentBranch(element: HTMLElement | null) {
        parentBranchCleanup?.();
        parentBranchCleanup = element ? parent?.registerBranch(element) : undefined;
    }

    const context: OverlayLayerContext = {
        id: Symbol('overlay-layer'),
        element: options.element,
        active,
        modal,
        modalEffects: options.modalEffects === true,
        preventScroll,
        branches,
        focusBranches,
        zIndex: readonly(zIndex),
        isTopLayer() {
            if (!registeredDocument) return false;
            const layers = getState(registeredDocument).layers;
            return layers[layers.length - 1] === context;
        },
        isInside(event, additional = []) {
            const elements = [options.element.value, ...insideBranchSet, ...additional];
            return elements.some(
                (element) => element != null && isEventWithinElement(event, element),
            );
        },
        registerBranch,
    };
    layerMetadata.set(context, {
        baseZIndex,
        parent,
        setZIndex(value) {
            zIndex.value = value;
        },
    });

    function unregister() {
        replaceParentBranch(null);
        if (!registeredDocument) return;
        const document = registeredDocument;
        registeredDocument = null;
        registeredElement = null;
        removeLayer(context, document, getState(document));
    }

    function register(element: HTMLElement) {
        const document = element.ownerDocument;
        if (registeredDocument === document) {
            if (registeredElement !== element) {
                replaceParentBranch(element);
                registeredElement = element;
                syncModalEffects(document, getState(document));
            }
            return;
        }
        unregister();
        const state = getState(document);
        const currentIndex = state.layers.indexOf(context);
        if (currentIndex >= 0) state.layers.splice(currentIndex, 1);
        const descendantIndex = state.layers.findIndex((layer) =>
            isDescendantLayer(layer, context),
        );
        if (descendantIndex >= 0) state.layers.splice(descendantIndex, 0, context);
        else state.layers.push(context);
        registeredDocument = document;
        registeredElement = element;
        replaceParentBranch(element);
        syncLayerZIndices(state);
        syncModalEffects(document, state);
    }

    watch(
        [active, options.element],
        ([isActive, element]) => {
            if (isActive && element?.isConnected) register(element);
            else unregister();
        },
        { flush: 'post', immediate: true },
    );
    watch([modal, preventScroll], () => {
        if (registeredDocument) {
            syncModalEffects(registeredDocument, getState(registeredDocument));
        }
    });
    watch(baseZIndex, (value) => {
        if (registeredDocument) {
            syncLayerZIndices(getState(registeredDocument));
        } else {
            zIndex.value = value;
        }
    });

    onBeforeUnmount(unregister);
    provide(overlayLayerKey, context);
    return context;
}

export function useOverlayLayerBranch(
    element: Ref<HTMLElement | null>,
    options: { focus?: boolean; inside?: boolean } = {},
) {
    const layer = inject(overlayLayerKey, null);
    let cleanup: (() => void) | undefined;
    watch(
        element,
        (nextElement) => {
            cleanup?.();
            cleanup = nextElement ? layer?.registerBranch(nextElement, options) : undefined;
        },
        { flush: 'post', immediate: true },
    );
    onBeforeUnmount(() => cleanup?.());
    return layer;
}

export function useParentOverlayLayer() {
    return inject(overlayLayerKey, null);
}
