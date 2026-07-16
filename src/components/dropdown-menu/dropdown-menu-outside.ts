import { isRef } from 'vue';
import type { DropdownMenuInteractOutsideTarget } from './types';

function isNode(value: unknown): value is Node {
    return typeof value === 'object' && value !== null && 'nodeType' in value;
}

export function isEventWithinElement(event: Event, element: Element) {
    const path = event.composedPath();
    if (path.length > 0) {
        return path.some(
            (entry) => entry === element || (isNode(entry) && element.contains(entry)),
        );
    }

    return isNode(event.target) && element.contains(event.target);
}

export function isEventWithinTargets(
    event: Event,
    targets: readonly DropdownMenuInteractOutsideTarget[],
) {
    for (const source of targets) {
        const target = isRef(source) ? source.value : source;
        if (!target) continue;

        if (typeof target === 'string') {
            if (typeof document === 'undefined') continue;
            try {
                if (
                    [...document.querySelectorAll(target)].some((element) =>
                        isEventWithinElement(event, element),
                    )
                ) {
                    return true;
                }
            } catch {
                // Invalid selectors are treated as missing ignore targets.
            }
            continue;
        }

        if (isEventWithinElement(event, target)) return true;
    }

    return false;
}
