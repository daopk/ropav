import { createHoverDisclosureInteractionModel } from './hoverDisclosureInteractionModel';
import type { ConnectHoverDisclosureDismissal } from './hoverDisclosureDismissalRouting';
import type { UseHoverDisclosureOptions, UseHoverDisclosureReturn } from './types';
import { useHoverDisclosureInteractions } from './useHoverDisclosureInteractions';
import { useHoverDisclosureOpenState } from './useHoverDisclosureOpenState';
import {
    createHoverDisclosureTargetState,
    useHoverDisclosureTargetBinding,
} from './useHoverDisclosureTargetBinding';

export function useHoverDisclosure(
    options: Readonly<UseHoverDisclosureOptions> = {},
): UseHoverDisclosureReturn {
    return useHoverDisclosureController(options);
}

export function useHoverDisclosureWithDismissalRouting(
    options: Readonly<UseHoverDisclosureOptions>,
    connectDismissal: ConnectHoverDisclosureDismissal,
): UseHoverDisclosureReturn {
    return useHoverDisclosureController(options, connectDismissal);
}

function useHoverDisclosureController(
    options: Readonly<UseHoverDisclosureOptions>,
    connectDismissal?: ConnectHoverDisclosureDismissal,
): UseHoverDisclosureReturn {
    const interaction = createHoverDisclosureInteractionModel();
    const targets = createHoverDisclosureTargetState();
    const openState = useHoverDisclosureOpenState({
        interaction,
        onContentClosed: () => {
            targets.contentElement = null;
        },
        options,
    });
    const { bindingAdapter, contentProps, triggerProps } = useHoverDisclosureInteractions({
        commands: openState,
        dismissalRouted: connectDismissal !== undefined,
        interaction,
        options,
        state: openState.state,
        targets,
    });

    useHoverDisclosureTargetBinding({
        adapter: bindingAdapter,
        connectDismissal,
        isOpen: openState.isOpen,
        options,
        targets,
    });

    return {
        isOpen: openState.isOpen,
        isDisabled: openState.isDisabled,
        state: openState.state,
        triggerProps,
        contentProps,
        open: openState.open,
        close: openState.close,
        toggle: openState.toggle,
    };
}
