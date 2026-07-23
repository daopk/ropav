import { createRafScheduler } from '../rafScheduler';
import { isElement } from './query';

export interface ObserveComposedAncestryOptions {
    deferWhileDisconnected?: boolean;
}

function getFrameElement(documentNode: Document): Element | null {
    try {
        const frameElement = documentNode.defaultView?.frameElement;
        return isElement(frameElement) ? frameElement : null;
    } catch {
        return null;
    }
}

export function getComposedParent(node: Node): Node | null {
    if (isElement(node) && node.assignedSlot) return node.assignedSlot;
    if (node.parentNode) return node.parentNode;
    if (node.nodeType === 9) return getFrameElement(node as Document);

    const host = 'host' in node ? node.host : null;
    return isElement(host) ? host : null;
}

export function getComposedAncestry(node: Node | null | undefined): Node[] {
    const ancestry: Node[] = [];
    let current = node ?? null;

    while (current) {
        current = getComposedParent(current);
        if (current) ancestry.push(current);
    }

    return ancestry;
}

export function areNodeListsIdentical(left: readonly Node[], right: readonly Node[]): boolean {
    return left.length === right.length && left.every((node, index) => node === right[index]);
}

function readComposedAncestryPaths(nodes: readonly (Node | null | undefined)[]): Node[][] {
    return nodes.map((node) => (node ? [node, ...getComposedAncestry(node)] : []));
}

function areAncestryPathsIdentical(left: readonly Node[][], right: readonly Node[][]): boolean {
    return (
        left.length === right.length &&
        left.every((path, index) => areNodeListsIdentical(path, right[index] ?? []))
    );
}

function getNodeDocument(node: Node): Document | null {
    return node.nodeType === 9 ? (node as Document) : node.ownerDocument;
}

function getMutationObserverConstructor(node: Node): typeof MutationObserver | undefined {
    return getNodeDocument(node)?.defaultView?.MutationObserver ?? globalThis.MutationObserver;
}

function isShadowRootNode(node: Node): node is ShadowRoot {
    return node.nodeType === 11 && 'host' in node && isElement(node.host);
}

function hasDisconnectedAncestry(nodes: readonly (Node | null | undefined)[]) {
    return nodes.some(
        (node) =>
            node != null &&
            [node, ...getComposedAncestry(node)].some((ancestor) => !ancestor.isConnected),
    );
}

export function observeComposedAncestry(
    getNodes: () => readonly (Node | null | undefined)[],
    onChange: () => void,
    options: ObserveComposedAncestryOptions = {},
) {
    let paths = readComposedAncestryPaths(getNodes());
    let mutationObservers: MutationObserver[] = [];
    let slotRoots: ShadowRoot[] = [];
    let disposed = false;

    const reconnectScheduler = createRafScheduler(check, getView);

    function getView() {
        for (const node of getNodes()) {
            const view = node ? getNodeDocument(node)?.defaultView : null;
            if (view) return view;
        }
        return null;
    }

    function scheduleReconnectCheck(nodes: readonly (Node | null | undefined)[]) {
        if (!hasDisconnectedAncestry(nodes)) return;
        if (!getView()?.requestAnimationFrame) return;
        reconnectScheduler.schedule();
    }

    function disconnectTargets() {
        for (const observer of mutationObservers) observer.disconnect();
        mutationObservers = [];
        for (const root of slotRoots) root.removeEventListener('slotchange', check);
        slotRoots = [];
    }

    function observeTargets(
        nodes: readonly (Node | null | undefined)[],
        nextPaths: readonly Node[][],
    ) {
        const observedNodes = new Set(nextPaths.flat());
        const nextSlotRoots = new Set<ShadowRoot>();
        const observersByConstructor = new Map<typeof MutationObserver, MutationObserver>();

        for (const node of observedNodes) {
            if (isElement(node) && node.shadowRoot) nextSlotRoots.add(node.shadowRoot);
            if (isShadowRootNode(node)) nextSlotRoots.add(node);

            const MutationObserverConstructor = getMutationObserverConstructor(node);
            if (!MutationObserverConstructor) continue;

            let observer = observersByConstructor.get(MutationObserverConstructor);
            if (!observer) {
                observer = new MutationObserverConstructor(check);
                observersByConstructor.set(MutationObserverConstructor, observer);
            }

            if (isElement(node)) {
                observer.observe(node, {
                    childList: true,
                    attributes: true,
                    attributeFilter: ['slot', 'name'],
                });
            } else {
                observer.observe(node, { childList: true });
            }
        }

        mutationObservers = [...observersByConstructor.values()];
        slotRoots = [...nextSlotRoots];
        for (const root of slotRoots) root.addEventListener('slotchange', check);
        scheduleReconnectCheck(nodes);
    }

    function rebind(nodes: readonly (Node | null | undefined)[], nextPaths: Node[][]) {
        disconnectTargets();
        paths = nextPaths;
        observeTargets(nodes, paths);
    }

    function check() {
        if (disposed) return;

        const nodes = getNodes();
        if (options.deferWhileDisconnected && hasDisconnectedAncestry(nodes)) {
            scheduleReconnectCheck(nodes);
            return;
        }

        reconnectScheduler.cancel();
        const nextPaths = readComposedAncestryPaths(nodes);
        if (areAncestryPathsIdentical(paths, nextPaths)) return;

        rebind(nodes, nextPaths);
        onChange();
    }

    const initialNodes = getNodes();
    paths = readComposedAncestryPaths(initialNodes);
    observeTargets(initialNodes, paths);

    return () => {
        if (disposed) return;
        disposed = true;
        reconnectScheduler.cancel();
        disconnectTargets();
    };
}
