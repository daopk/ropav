import { isRef } from 'vue';
import { isEventWithinElement } from '@/utils/dom/events';
import { querySelectorAllSafe } from '@/utils/dom/query';
import type { DropdownMenuInteractOutsideTarget } from './types';

export function isEventWithinTargets(
    event: Event,
    targets: readonly DropdownMenuInteractOutsideTarget[],
) {
    for (const source of targets) {
        const target = isRef(source) ? source.value : source;
        if (!target) continue;

        if (typeof target === 'string') {
            if (
                querySelectorAllSafe(target).some((element) => isEventWithinElement(event, element))
            ) {
                return true;
            }
            continue;
        }

        if (isEventWithinElement(event, target)) return true;
    }

    return false;
}
