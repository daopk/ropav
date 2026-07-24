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
import { observeComposedAncestry } from '@/utils/dom/ancestry';
import { isEventWithinElement } from '@/utils/dom/events';

interface InertSnapshot {
    ariaHidden: string | null;
    inert: boolean;
}

interface OverlayLayerState {
    layers: OverlayLayerContext[];
    interactionLayers: OverlayLayerContext[];
    inertSnapshots: Map<HTMLElement, InertSnapshot>;
    interactionListeners: Partial<
        Record<OverlayLayerInteractionName, OverlayLayerDocumentListener>
    >;
    originalBodyOverflow: string;
    scrollLocked: boolean;
    observer: MutationObserver | null;
    syncQueued: boolean;
}

export interface OverlayLayerInteraction {
    inside?: MaybeRefOrGetter<readonly (Element | null | undefined)[]>;
    escapeKeyDown?: (event: KeyboardEvent) => void;
    pointerDownOutside?: (event: PointerEvent) => void;
    focusOutside?: (event: FocusEvent) => void;
    clickOutside?: (event: MouseEvent) => void;
}

export interface OverlayLayerInteractionConnection {
    (): void;
    refresh: () => void;
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
    connectInteraction: (interaction: OverlayLayerInteraction) => OverlayLayerInteractionConnection;
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
const activeInteractionLayers: OverlayLayerContext[] = [];

type OverlayLayerInteractionName =
    | 'escapeKeyDown'
    | 'pointerDownOutside'
    | 'focusOutside'
    | 'clickOutside';

interface OverlayLayerDocumentListener {
    capture: boolean;
    eventName: keyof DocumentEventMap;
    listener: EventListener;
}

interface OverlayLayerInteractionListenerDefinition {
    capture: boolean;
    eventName: keyof DocumentEventMap;
    outside: boolean;
    matches?: (event: Event) => boolean;
}

const interactionListenerDefinitions: Record<
    OverlayLayerInteractionName,
    OverlayLayerInteractionListenerDefinition
> = {
    escapeKeyDown: {
        capture: false,
        eventName: 'keydown',
        outside: false,
        matches: (event) => (event as KeyboardEvent).key === 'Escape',
    },
    pointerDownOutside: {
        capture: true,
        eventName: 'pointerdown',
        outside: true,
    },
    focusOutside: {
        capture: true,
        eventName: 'focusin',
        outside: true,
    },
    clickOutside: {
        capture: true,
        eventName: 'click',
        outside: true,
    },
};

interface OverlayLayerMetadata {
    baseZIndex: ComputedRef<number>;
    interactions: Set<OverlayLayerInteraction>;
    interactionDocuments: Set<Document>;
    ownInteractionDocuments: Set<Document>;
    parent: OverlayLayerContext | null;
    registered: boolean;
    setZIndex: (value: number) => void;
}

const layerMetadata = new WeakMap<OverlayLayerContext, OverlayLayerMetadata>();

function createState(): OverlayLayerState {
    return {
        layers: [],
        interactionLayers: [],
        inertSnapshots: new Map(),
        interactionListeners: {},
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

function insertLayer(layers: OverlayLayerContext[], layer: OverlayLayerContext) {
    const currentIndex = layers.indexOf(layer);
    if (currentIndex >= 0) layers.splice(currentIndex, 1);
    const descendantIndex = layers.findIndex((candidate) => isDescendantLayer(candidate, layer));
    if (descendantIndex >= 0) layers.splice(descendantIndex, 0, layer);
    else layers.push(layer);
}

function insertPhysicalLayer(layers: OverlayLayerContext[], layer: OverlayLayerContext) {
    removeLayerFromStack(layers, layer);
    const layerIndex = activeInteractionLayers.indexOf(layer);
    const nextIndex = layers.findIndex(
        (candidate) => activeInteractionLayers.indexOf(candidate) > layerIndex,
    );
    if (nextIndex >= 0) layers.splice(nextIndex, 0, layer);
    else layers.push(layer);
}

function removeLayerFromStack(layers: OverlayLayerContext[], layer: OverlayLayerContext) {
    const index = layers.indexOf(layer);
    if (index >= 0) layers.splice(index, 1);
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

function syncDocumentInteractionLayers(document: Document) {
    const state = getState(document);
    state.interactionLayers = activeInteractionLayers.filter((layer) =>
        layerMetadata.get(layer)?.interactionDocuments.has(document),
    );
    syncInteractionListeners(document, state);
}

function reconcileInteractionDocuments(layer: OverlayLayerContext) {
    const affectedDocuments = new Set<Document>();
    const layers = activeInteractionLayers.filter(
        (candidate) => candidate === layer || isDescendantLayer(candidate, layer),
    );
    if (!layers.includes(layer)) layers.unshift(layer);

    for (const candidate of layers) {
        const metadata = layerMetadata.get(candidate);
        if (!metadata) continue;
        for (const document of metadata.interactionDocuments) {
            affectedDocuments.add(document);
        }

        const nextDocuments = metadata.registered
            ? new Set(metadata.ownInteractionDocuments)
            : new Set<Document>();
        const parentDocuments = metadata.parent
            ? layerMetadata.get(metadata.parent)?.interactionDocuments
            : undefined;
        if (metadata.registered && parentDocuments) {
            for (const document of parentDocuments) nextDocuments.add(document);
        }
        metadata.interactionDocuments = nextDocuments;

        for (const document of nextDocuments) affectedDocuments.add(document);
    }

    for (const document of affectedDocuments) syncDocumentInteractionLayers(document);
}

function hasInteractionHandler(state: OverlayLayerState, name: OverlayLayerInteractionName) {
    return state.interactionLayers.some((layer) =>
        [...(layerMetadata.get(layer)?.interactions ?? [])].some(
            (interaction) => typeof interaction[name] === 'function',
        ),
    );
}

function routeLayerInteraction(
    state: OverlayLayerState,
    name: OverlayLayerInteractionName,
    event: Event,
) {
    const layer = state.interactionLayers[state.interactionLayers.length - 1];
    if (!layer) return;

    const definition = interactionListenerDefinitions[name];
    if (definition.matches && !definition.matches(event)) return;

    const interactions = [...(layerMetadata.get(layer)?.interactions ?? [])];
    for (const interaction of interactions) {
        const handler = interaction[name] as ((event: Event) => void) | undefined;
        if (!handler) continue;

        const additionalInside = interaction.inside ? toValue(interaction.inside) : [];
        if (definition.outside && layer.isInside(event, additionalInside)) continue;
        handler(event);
    }
}

function syncInteractionListeners(document: Document, state: OverlayLayerState) {
    for (const name of Object.keys(
        interactionListenerDefinitions,
    ) as OverlayLayerInteractionName[]) {
        const existing = state.interactionListeners[name];
        if (!hasInteractionHandler(state, name)) {
            if (existing) {
                document.removeEventListener(
                    existing.eventName,
                    existing.listener,
                    existing.capture,
                );
                delete state.interactionListeners[name];
            }
            continue;
        }
        if (existing) continue;

        const definition = interactionListenerDefinitions[name];
        const listener: EventListener = (event) => routeLayerInteraction(state, name, event);
        document.addEventListener(definition.eventName, listener, definition.capture);
        state.interactionListeners[name] = {
            capture: definition.capture,
            eventName: definition.eventName,
            listener,
        };
    }
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
    removeLayerFromStack(state.layers, layer);
    syncLayerZIndices(state);
    syncModalEffects(document, state);
}

interface OverlayLayerAncestryObserverOptions {
    active: ComputedRef<boolean>;
    element: Ref<HTMLElement | null>;
    branches: ReadonlySet<HTMLElement>;
    interactions: ReadonlySet<OverlayLayerInteraction>;
    onContentChange: () => void;
    onAuxiliaryChange: () => void;
}

function createOverlayLayerAncestryObserver(options: OverlayLayerAncestryObserverOptions) {
    let cleanups: (() => void)[] = [];
    let disposed = false;

    function stop() {
        for (const cleanup of cleanups) cleanup();
        cleanups = [];
    }

    function reset() {
        stop();
        if (disposed || !options.active.value) return;

        const content = options.element.value;
        if (content) {
            cleanups.push(
                observeComposedAncestry(() => [content], options.onContentChange, {
                    deferWhileDisconnected: true,
                }),
            );
        }

        const auxiliaryElements = new Set<Element>(options.branches);
        for (const interaction of options.interactions) {
            if (!interaction.inside) continue;
            for (const element of toValue(interaction.inside)) {
                if (element) auxiliaryElements.add(element);
            }
        }
        if (content) auxiliaryElements.delete(content);
        for (const element of auxiliaryElements) {
            cleanups.push(
                observeComposedAncestry(() => [element], options.onAuxiliaryChange, {
                    deferWhileDisconnected: true,
                    notifyOnDisconnect: true,
                }),
            );
        }
    }

    return {
        reset,
        dispose() {
            disposed = true;
            stop();
        },
    };
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
    const interactions = new Set<OverlayLayerInteraction>();
    const interactionSetRevision = ref(0);
    const baseZIndex = computed(() => toValue(options.baseZIndex ?? 100));
    const zIndex = ref(baseZIndex.value);
    let registeredDocument: Document | null = null;
    let registeredElement: HTMLElement | null = null;
    let parentBranchCleanup: (() => void) | undefined;
    const ancestryObserver = createOverlayLayerAncestryObserver({
        active,
        element: options.element,
        branches: branchSet,
        interactions,
        onContentChange: syncObservedAncestry,
        onAuxiliaryChange: syncObservedAuxiliaryAncestry,
    });

    function syncBranches() {
        branches.value = [...branchSet];
        focusBranches.value = [...focusBranchSet];
        syncOwnInteractionDocuments();
        ancestryObserver.reset();
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

    function connectInteraction(interaction: OverlayLayerInteraction) {
        interactions.add(interaction);
        interactionSetRevision.value += 1;

        let connected = true;
        return Object.assign(
            () => {
                if (!connected) return;
                connected = false;
                interactions.delete(interaction);
                interactionSetRevision.value += 1;
            },
            {
                refresh() {
                    if (!connected) return;
                    syncOwnInteractionDocuments();
                    ancestryObserver.reset();
                },
            },
        );
    }

    function readOwnInteractionDocuments() {
        const documents = new Set<Document>();
        if (registeredElement) documents.add(registeredElement.ownerDocument);
        for (const branch of branchSet) {
            if (branch.isConnected) documents.add(branch.ownerDocument);
        }
        for (const interaction of interactions) {
            if (interaction.inside) {
                for (const element of toValue(interaction.inside)) {
                    if (element?.isConnected) documents.add(element.ownerDocument);
                }
            }
        }
        return [...documents];
    }

    function syncOwnInteractionDocuments(documents = readOwnInteractionDocuments()) {
        const metadata = layerMetadata.get(context);
        if (!metadata) return;
        metadata.ownInteractionDocuments = new Set(documents);
        reconcileInteractionDocuments(context);
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
        connectInteraction,
    };
    layerMetadata.set(context, {
        baseZIndex,
        interactions,
        interactionDocuments: new Set(),
        ownInteractionDocuments: new Set(),
        parent,
        registered: false,
        setZIndex(value) {
            zIndex.value = value;
        },
    });

    watch(
        () => {
            void interactionSetRevision.value;
            return readOwnInteractionDocuments();
        },
        (documents) => {
            syncOwnInteractionDocuments(documents);
            ancestryObserver.reset();
        },
        { flush: 'sync', immediate: true },
    );

    function unregister() {
        if (!registeredDocument) return;
        const document = registeredDocument;
        registeredDocument = null;
        registeredElement = null;
        const metadata = layerMetadata.get(context);
        if (metadata) metadata.registered = false;
        removeLayerFromStack(activeInteractionLayers, context);
        syncOwnInteractionDocuments();
        replaceParentBranch(null);
        removeLayer(context, document, getState(document));
    }

    function moveRegistration(element: HTMLElement) {
        const previousDocument = registeredDocument;
        if (!previousDocument) return;

        registeredDocument = element.ownerDocument;
        registeredElement = element;
        removeLayer(context, previousDocument, getState(previousDocument));

        const state = getState(registeredDocument);
        insertPhysicalLayer(state.layers, context);
        syncOwnInteractionDocuments();
        replaceParentBranch(element);
        syncLayerZIndices(state);
        syncModalEffects(registeredDocument, state);
    }

    function register(element: HTMLElement) {
        const document = element.ownerDocument;
        if (registeredDocument === document) {
            if (registeredElement !== element) {
                registeredElement = element;
                syncOwnInteractionDocuments();
                replaceParentBranch(element);
                syncModalEffects(document, getState(document));
            }
            return;
        }
        if (registeredDocument) {
            moveRegistration(element);
            return;
        }
        const state = getState(document);
        registeredDocument = document;
        registeredElement = element;
        const metadata = layerMetadata.get(context);
        if (metadata) metadata.registered = true;
        insertLayer(activeInteractionLayers, context);
        insertPhysicalLayer(state.layers, context);
        syncOwnInteractionDocuments();
        replaceParentBranch(element);
        syncLayerZIndices(state);
        syncModalEffects(document, state);
    }

    function syncRegistration() {
        const element = options.element.value;
        if (active.value && element?.isConnected) {
            register(element);
            syncOwnInteractionDocuments();
        } else {
            unregister();
        }
    }

    function syncObservedAncestry() {
        syncRegistration();
        if (registeredDocument) {
            syncModalEffects(registeredDocument, getState(registeredDocument));
        }
    }

    function syncObservedAuxiliaryAncestry() {
        syncOwnInteractionDocuments();
        if (registeredDocument) {
            syncModalEffects(registeredDocument, getState(registeredDocument));
        }
    }

    watch(
        [active, options.element],
        () => {
            syncRegistration();
            ancestryObserver.reset();
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

    onBeforeUnmount(() => {
        ancestryObserver.dispose();
        unregister();
        interactions.clear();
    });
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
