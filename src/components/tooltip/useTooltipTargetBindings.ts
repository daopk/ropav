import type { Ref } from 'vue';
import { mergeAriaIdRefs } from '@/utils/aria';
import type { FloatingTargetLifecycle } from '../floating/useFloatingTargetLifecycle';

const TARGET_ATTRIBUTES = ['aria-describedby'] as const;

interface UseTooltipTargetBindingsOptions {
    targetLifecycle: FloatingTargetLifecycle;
    shouldDescribeContent: Readonly<Ref<boolean>>;
    tooltipId: Readonly<Ref<string>>;
    openTooltip: () => void;
    closeTooltip: () => void;
    onKeydown: (event: KeyboardEvent) => void;
}

export function useTooltipTargetBindings({
    targetLifecycle,
    shouldDescribeContent,
    tooltipId,
    openTooltip,
    closeTooltip,
    onKeydown,
}: UseTooltipTargetBindingsOptions) {
    targetLifecycle.bindTarget({
        listeners: [
            ['mouseenter', openTooltip],
            ['mouseleave', closeTooltip],
            ['focusin', openTooltip],
            ['focusout', closeTooltip],
            ['keydown', onKeydown as EventListener],
        ],
        attributes: {
            names: TARGET_ATTRIBUTES,
            isActive: () => shouldDescribeContent.value,
            apply: (target, snapshot) => {
                target.setAttribute(
                    'aria-describedby',
                    mergeAriaIdRefs(snapshot.get('aria-describedby'), tooltipId.value) ?? '',
                );
            },
        },
    });
}
