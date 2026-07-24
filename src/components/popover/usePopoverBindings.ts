import { watch, type Ref } from 'vue';
import { mergeAriaIdRefs } from '@/utils/aria';
import {
    restoreAttributes,
    snapshotAttributes,
    type AttributeSnapshot,
} from '@/utils/dom/attributes';
import type { PopoverRole } from './types';

const TARGET_ATTRIBUTES = ['aria-controls', 'aria-expanded', 'aria-haspopup'] as const;
type TargetAttribute = (typeof TARGET_ATTRIBUTES)[number];

interface UsePopoverBindingsOptions {
    isExplicitTarget: Readonly<Ref<boolean>>;
    targetElement: Readonly<Ref<Element | null>>;
    popoverId: Readonly<Ref<string>>;
    popoverRole: Readonly<Ref<PopoverRole>>;
    isVisible: Readonly<Ref<boolean>>;
    isDisabled: Readonly<Ref<boolean>>;
    onTriggerClick: () => void;
}

function applyTargetAttributes(
    element: Element,
    snapshot: AttributeSnapshot<TargetAttribute>,
    options: { id: string; expanded: boolean; role: PopoverRole },
) {
    element.setAttribute(
        'aria-controls',
        mergeAriaIdRefs(snapshot.get('aria-controls'), options.id) ?? '',
    );
    element.setAttribute('aria-expanded', String(options.expanded));
    element.setAttribute('aria-haspopup', options.role);
}

export function usePopoverBindings({
    isExplicitTarget,
    targetElement,
    popoverId,
    popoverRole,
    isVisible,
    isDisabled,
    onTriggerClick,
}: UsePopoverBindingsOptions) {
    watch(
        [isExplicitTarget, targetElement],
        ([explicit, target], _previous, onCleanup) => {
            if (!explicit || !target) return;

            target.addEventListener('click', onTriggerClick);
            onCleanup(() => target.removeEventListener('click', onTriggerClick));
        },
        { flush: 'sync' },
    );

    watch(
        [isExplicitTarget, targetElement, popoverId, popoverRole, isVisible, isDisabled],
        ([explicit, target, id, role, visible, disabled], _previous, onCleanup) => {
            if (!explicit || !target || disabled) return;

            const snapshot = snapshotAttributes(target, TARGET_ATTRIBUTES);
            applyTargetAttributes(target, snapshot, { id, expanded: visible, role });
            onCleanup(() => restoreAttributes(target, snapshot));
        },
        { flush: 'sync' },
    );
}
