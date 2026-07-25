import type { Ref } from 'vue';
import { mergeAriaIdRefs } from '@/utils/aria';
import type { AttributeSnapshot } from '@/utils/dom/attributes';
import type { FloatingTargetLifecycle } from '../floating/useFloatingTargetLifecycle';
import type { PopoverRole } from './types';

const TARGET_ATTRIBUTES = ['aria-controls', 'aria-expanded', 'aria-haspopup'] as const;
type TargetAttribute = (typeof TARGET_ATTRIBUTES)[number];

interface UsePopoverBindingsOptions {
    targetLifecycle: FloatingTargetLifecycle;
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
    targetLifecycle,
    popoverId,
    popoverRole,
    isVisible,
    isDisabled,
    onTriggerClick,
}: UsePopoverBindingsOptions) {
    targetLifecycle.bindTarget({
        listeners: [['click', onTriggerClick]],
        attributes: {
            names: TARGET_ATTRIBUTES,
            isActive: () => !isDisabled.value,
            apply: (target, snapshot) => {
                applyTargetAttributes(target, snapshot, {
                    id: popoverId.value,
                    expanded: isVisible.value,
                    role: popoverRole.value,
                });
            },
        },
    });
}
