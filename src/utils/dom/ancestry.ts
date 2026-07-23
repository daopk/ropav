import { isElement } from './query';

export function getComposedParent(node: Node): Node | null {
    if (isElement(node) && node.assignedSlot) return node.assignedSlot;
    if (node.parentNode) return node.parentNode;

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
